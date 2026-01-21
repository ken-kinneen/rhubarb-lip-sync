"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Header, AudioInput, Timeline, MouthShapeDisplay, CharacterDisplay, ResultsPanel, Settings, PhonemeEditor } from "@/app/components";
import { AudioInputMethod, PhonemeData } from "@/app/lib/types";
import { EXAMPLE_AUDIO_FILES } from "@/app/lib/constants";
import { useAudioPlayback, useAudioProcessor } from "@/app/hooks";
import { isRhubarbAvailable } from "@/app/lib/rhubarb-api";
import { RhubarbProcessingOptions } from "@/app/lib/rhubarb-api";

export default function RhubarbLipSyncApp() {
    // Custom hooks for clean separation of concerns
    const playback = useAudioPlayback();
    const processor = useAudioProcessor();

    // Settings state
    const [showSettings, setShowSettings] = useState(false);
    const [extendedShapes, setExtendedShapes] = useState("GHX"); // Default: all extended shapes
    const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
    const [currentInputMethod, setCurrentInputMethod] = useState<AudioInputMethod | null>(null);
    
    // Editable phonemes (allows editing without modifying original processor result)
    const [editablePhonemes, setEditablePhonemes] = useState<PhonemeData[] | null>(null);

    // Rhubarb availability check
    const [rhubarbAvailable, setRhubarbAvailable] = useState<boolean | null>(null);

    // Check if Rhubarb is available on mount
    useEffect(() => {
        isRhubarbAvailable().then((available) => {
            setRhubarbAvailable(available);
            if (available) {
                console.log("✅ Rhubarb is installed and ready!");
            } else {
                console.warn("⚠️ Rhubarb binary not found. Please install it.");
            }
        });
    }, []);

    // Handle audio ready from any input method
    const handleAudioReady = useCallback(
        async (blob: Blob, method: AudioInputMethod, filename?: string) => {
            // Store for reprocessing when settings change
            setCurrentAudioBlob(blob);
            setCurrentInputMethod(method);

            const options: RhubarbProcessingOptions = {
                extendedShapes,
            };

            const result = await processor.processAudio(blob, method, options);

            if (result) {
                // Load audio for playback
                playback.load(result.audioUrl);
                // Initialize editable phonemes with the result
                setEditablePhonemes(result.phonemes);
            }
        },
        [processor, playback, extendedShapes]
    );

    // Handle phoneme edits from the editor
    const handlePhonemesChange = useCallback((newPhonemes: PhonemeData[]) => {
        setEditablePhonemes(newPhonemes);
    }, []);

    // Track which player is the "source of truth" for playback
    const [activePlayer, setActivePlayer] = useState<'timeline' | 'editor' | null>(null);

    // Handle time updates from PhonemeEditor to sync the display
    // This updates the visual state without triggering audio playback
    const handleEditorTimeUpdate = useCallback((time: number) => {
        // Only sync if the editor is the active player
        if (activePlayer === 'editor') {
            // Use internal method to update time display without affecting audio
            playback.seek(time);
        }
    }, [playback, activePlayer]);

    // Handle play state changes from PhonemeEditor
    const handleEditorPlayStateChange = useCallback((isPlaying: boolean) => {
        if (isPlaying) {
            // Editor started playing - make it the active player and pause Timeline's audio
            setActivePlayer('editor');
            if (playback.isPlaying) {
                playback.pause();
            }
        } else {
            // Editor stopped - clear active player
            if (activePlayer === 'editor') {
                setActivePlayer(null);
            }
        }
    }, [playback, activePlayer]);

    // Wrap timeline play/pause to track active player
    const handleTimelinePlayPause = useCallback(() => {
        if (!playback.isPlaying) {
            // Starting playback from timeline
            setActivePlayer('timeline');
        } else {
            // Stopping playback
            setActivePlayer(null);
        }
        playback.togglePlayPause();
    }, [playback]);

    // Handle settings change and reprocess
    const handleSettingsChange = useCallback(
        async (newExtendedShapes: string) => {
            setExtendedShapes(newExtendedShapes);

            // Reprocess current audio with new settings if available
            if (currentAudioBlob && currentInputMethod) {
                const options: RhubarbProcessingOptions = {
                    extendedShapes: newExtendedShapes,
                };

                const result = await processor.processAudio(currentAudioBlob, currentInputMethod, options);

                if (result) {
                    playback.load(result.audioUrl);
                    setEditablePhonemes(result.phonemes);
                }
            }
        },
        [currentAudioBlob, currentInputMethod, processor, playback]
    );
    
    // Use editable phonemes if available, otherwise use original from processor
    const currentPhonemes = editablePhonemes || processor.result?.phonemes || [];

    const hasResults = processor.result && processor.result.phonemes.length > 0;

    return (
        <div className='min-h-screen bg-[#121212] text-white flex flex-col'>
            {/* Header */}
            <Header
                isProcessing={processor.isProcessing}
                onSettingsClick={() => setShowSettings(true)}
                rhubarbAvailable={rhubarbAvailable}
            />

            {/* Main content */}
            <main className='flex-1 p-4 md:p-6 overflow-auto'>
                <div className='max-w-7xl mx-auto space-y-6'>
                    {/* Rhubarb not installed warning */}
                    {rhubarbAvailable === false && (
                        <div className='bg-amber-500/10 border border-amber-500/30 rounded-xl p-4'>
                            <div className='flex items-start gap-3'>
                                <span className='text-2xl'>⚠️</span>
                                <div>
                                    <h3 className='font-semibold text-amber-400 mb-1'>Rhubarb Not Installed</h3>
                                    <p className='text-sm text-amber-300/80 mb-2'>
                                        The Rhubarb binary is required for lip sync processing.
                                    </p>
                                    <p className='text-xs text-[#a8a8a8]'>
                                        Install from:{" "}
                                        <a
                                            href='https://github.com/DanielSWolf/rhubarb-lip-sync/releases'
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-[#8b5cf6] underline hover:text-[#a855f7]'
                                        >
                                            github.com/DanielSWolf/rhubarb-lip-sync
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Audio Input - The main entry point */}
                    <AudioInput
                        onAudioReady={handleAudioReady}
                        isProcessing={processor.isProcessing}
                        exampleFiles={[...EXAMPLE_AUDIO_FILES]}
                        disabled={rhubarbAvailable === false}
                    />

                    {/* Processing error */}
                    {processor.error && (
                        <div className='bg-red-500/10 border border-red-500/30 rounded-xl p-4'>
                            <p className='text-sm text-red-400'>{processor.error}</p>
                        </div>
                    )}

                    {/* Results Section */}
                    {hasResults && processor.result && (
                        <>
                            {/* Character Display and Timeline - Side by Side */}
                            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                                {/* Left side: Character Display and Timeline */}
                                <div className='lg:col-span-2 space-y-6'>
                                    {/* Large Character Display */}
                                    <CharacterDisplay
                                        phonemes={currentPhonemes}
                                        currentTime={playback.currentTime}
                                    />
                                    
                                    {/* Timeline */}
                                    <Timeline
                                        waveformData={processor.result.waveformData}
                                        phonemes={currentPhonemes}
                                        currentTime={playback.currentTime}
                                        isPlaying={playback.isPlaying && activePlayer === 'timeline'}
                                        onSeek={playback.seek}
                                        onPlayPause={handleTimelinePlayPause}
                                        duration={processor.result.duration}
                                    />
                                </div>
                                
                                {/* Right side: Mouth Shape Display */}
                                <div>
                                    <MouthShapeDisplay
                                        phonemes={currentPhonemes}
                                        currentTime={playback.currentTime}
                                        duration={processor.result.duration}
                                    />
                                </div>
                            </div>

                            {/* Phoneme Editor - Detailed editing with Peaks.js */}
                            <PhonemeEditor
                                audioUrl={processor.result.audioUrl}
                                phonemes={currentPhonemes}
                                onPhonemesChange={handlePhonemesChange}
                                duration={processor.result.duration}
                                onTimeUpdate={handleEditorTimeUpdate}
                                onPlayStateChange={handleEditorPlayStateChange}
                            />

                            {/* Results Panel */}
                            <ResultsPanel
                                phonemes={currentPhonemes}
                                duration={processor.result.duration}
                                processingTime={processor.result.processingTime}
                            />
                        </>
                    )}

                    {/* Empty state - only show when no results and not processing */}
                    {!hasResults && !processor.isProcessing && rhubarbAvailable !== false && <EmptyState />}
                </div>
            </main>

            {/* Settings Modal */}
            {showSettings && (
                <Settings extendedShapes={extendedShapes} onSettingsChange={handleSettingsChange} onClose={() => setShowSettings(false)} />
            )}
        </div>
    );
}

/** Empty state component showing how to get started */
function EmptyState() {
    return (
        <div className='card-base p-8 md:p-12'>
            <div className='max-w-2xl mx-auto text-center'>
                <h2 className='text-2xl md:text-3xl font-bold text-[#f5f5f5] mb-7'>Extract Lip Sync Data from Audio</h2>

                {/* How it works */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-left'>
                    <div className='bg-[#1e1e1e] rounded-xl p-5 border border-[#333333]'>
                        <div className='w-10 h-10 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center mb-3'>
                            <span className='text-xl'>🎤</span>
                        </div>
                        <h3 className='font-semibold text-[#f5f5f5] mb-1'>1. Add Audio</h3>
                        <p className='text-sm text-[#6b6b6b]'>Record with your mic, upload a file, or try an example</p>
                    </div>

                    <div className='bg-[#1e1e1e] rounded-xl p-5 border border-[#333333]'>
                        <div className='w-10 h-10 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center mb-3'>
                            <span className='text-xl'>🚀</span>
                        </div>
                        <h3 className='font-semibold text-[#f5f5f5] mb-1'>2. Rhubarb Process</h3>
                        <p className='text-sm text-[#6b6b6b]'>Real phoneme detection using speech recognition</p>
                    </div>

                    <div className='bg-[#1e1e1e] rounded-xl p-5 border border-[#333333]'>
                        <div className='w-10 h-10 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center mb-3'>
                            <span className='text-xl'>📥</span>
                        </div>
                        <h3 className='font-semibold text-[#f5f5f5] mb-1'>3. Export JSON</h3>
                        <p className='text-sm text-[#6b6b6b]'>Download timestamps for use in your animation project</p>
                    </div>
                </div>

                {/* Mouth shapes preview */}
                <div className='mt-8 pt-8 border-t border-[#333333]'>
                    <p className='text-sm text-[#6b6b6b] mb-4'>Detects 9 mouth shapes</p>
                    <div className='flex justify-center gap-2 flex-wrap'>
                        {["A", "B", "C", "D", "E", "F", "G", "H", "X"].map((shape) => (
                            <div
                                key={shape}
                                className='w-10 h-10 bg-[#242424] rounded-lg flex items-center justify-center text-sm font-mono font-bold text-[#8b5cf6] border border-[#333333]'
                            >
                                {shape}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
