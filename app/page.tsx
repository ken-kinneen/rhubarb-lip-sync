"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { Header, AudioInput, MouthShapeDisplay, CharacterDisplay, ResultsPanel, Settings, PhonemeEditor, FloatingWindow } from "@/app/components";
import { AudioInputMethod, PhonemeData } from "@/app/lib/types";
import { EXAMPLE_AUDIO_FILES } from "@/app/lib/constants";
import { useAudioPlayback, useAudioProcessor, usePersistence } from "@/app/hooks";
import { isRhubarbAvailable, RhubarbProcessingOptions } from "@/app/lib/rhubarb-api";

export default function RhubarbLipSyncApp() {
    // Custom hooks for clean separation of concerns
    const playback = useAudioPlayback();
    const processor = useAudioProcessor();
    const persistence = usePersistence();

    // Settings state
    const [showSettings, setShowSettings] = useState(false);
    const [extendedShapes, setExtendedShapes] = useState("GHX"); // Default: all extended shapes
    const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
    const [currentInputMethod, setCurrentInputMethod] = useState<AudioInputMethod | null>(null);
    
    // Editable phonemes (allows editing without modifying original processor result)
    const [editablePhonemes, setEditablePhonemes] = useState<PhonemeData[] | null>(null);

    // Rhubarb availability check
    const [rhubarbAvailable, setRhubarbAvailable] = useState<boolean | null>(null);

    // Floating character window state
    const [isCharacterFloating, setIsCharacterFloating] = useState(false);

    // Track if we've restored from persistence
    const hasRestoredRef = useRef(false);

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

    // Restore state from persistence when available
    useEffect(() => {
        if (hasRestoredRef.current || persistence.isLoading || !persistence.isRestored || !persistence.restoredState) {
            return;
        }
        
        hasRestoredRef.current = true;
        const state = persistence.restoredState;
        
        console.log('🔄 Restoring state from persistence...');
        
        // Restore UI state
        setExtendedShapes(state.extendedShapes);
        setIsCharacterFloating(state.isCharacterFloating);
        
        // Restore audio blob and input method
        if (state.audioBlob) {
            setCurrentAudioBlob(state.audioBlob);
        }
        if (state.inputMethod) {
            setCurrentInputMethod(state.inputMethod);
        }
        
        // Restore processing result if we have all the data
        if (state.phonemes && state.waveformData && state.duration !== null && state.processingTime !== null && state.audioUrl) {
            // Manually set the processor result (bypass processing)
            processor.restoreResult({
                phonemes: state.phonemes,
                waveformData: state.waveformData,
                audioUrl: state.audioUrl,
                duration: state.duration,
                processingTime: state.processingTime,
            });
            
            // Load audio for playback
            playback.load(state.audioUrl);
            
            // Restore editable phonemes (user's edits) or fall back to original
            setEditablePhonemes(state.editablePhonemes || state.phonemes);
            
            console.log('✅ State restored successfully');
        }
    }, [persistence.isLoading, persistence.isRestored, persistence.restoredState, processor, playback]);

    // Auto-save UI state when it changes
    useEffect(() => {
        if (persistence.isLoading || !persistence.sessionId) return;
        
        persistence.saveUI(extendedShapes, isCharacterFloating, editablePhonemes);
    }, [extendedShapes, isCharacterFloating, editablePhonemes, persistence]);

    // Handle audio ready from any input method
    const handleAudioReady = useCallback(
        async (blob: Blob, method: AudioInputMethod, filename?: string) => {
            // Store for reprocessing when settings change
            setCurrentAudioBlob(blob);
            setCurrentInputMethod(method);

            // Save audio to persistence
            persistence.saveAudio(blob, method);

            const options: RhubarbProcessingOptions = {
                extendedShapes,
            };

            const result = await processor.processAudio(blob, method, options);

            if (result) {
                // Load audio for playback
                playback.load(result.audioUrl);
                // Initialize editable phonemes with the result
                setEditablePhonemes(result.phonemes);
                
                // Save processing result to persistence
                persistence.saveResult(
                    result.phonemes,
                    result.waveformData,
                    result.duration,
                    result.processingTime
                );
            }
        },
        [processor, playback, extendedShapes, persistence]
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
        // Always sync time updates from the editor to update CharacterDisplay
        // This ensures real-time scrubbing preview works
        playback.seek(time);
    }, [playback]);

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
                    
                    // Save updated processing result to persistence
                    persistence.saveResult(
                        result.phonemes,
                        result.waveformData,
                        result.duration,
                        result.processingTime
                    );
                }
            }
        },
        [currentAudioBlob, currentInputMethod, processor, playback, persistence]
    );
    
    // Use editable phonemes if available, otherwise use original from processor
    const currentPhonemes = editablePhonemes || processor.result?.phonemes || [];

    const hasResults = processor.result && processor.result.phonemes.length > 0;

    // Show loading state while restoring from persistence
    if (persistence.isLoading) {
        return (
            <div className='min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center'>
                <div className='flex flex-col items-center gap-4'>
                    <div className='w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin' />
                    <p className='text-[#a8a8a8]'>Loading session...</p>
                </div>
            </div>
        );
    }

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
                    {/* Session restored notification */}
                    {persistence.isRestored && hasResults && (
                        <div className='bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                                <span className='text-green-400'>✓</span>
                                <span className='text-sm text-green-300'>Previous session restored</span>
                            </div>
                            <button
                                onClick={async () => {
                                    await persistence.clearSession();
                                    processor.reset();
                                    playback.reset();
                                    setCurrentAudioBlob(null);
                                    setCurrentInputMethod(null);
                                    setEditablePhonemes(null);
                                }}
                                className='text-xs text-[#a8a8a8] hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10'
                            >
                                Start Fresh
                            </button>
                        </div>
                    )}

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

                    {/* Audio Input - Only show when no results (fresh start or after clearing session) */}
                    {!hasResults && (
                        <AudioInput
                            onAudioReady={handleAudioReady}
                            isProcessing={processor.isProcessing}
                            exampleFiles={[...EXAMPLE_AUDIO_FILES]}
                            disabled={rhubarbAvailable === false}
                        />
                    )}

                    {/* Processing error */}
                    {processor.error && (
                        <div className='bg-red-500/10 border border-red-500/30 rounded-xl p-4'>
                            <p className='text-sm text-red-400'>{processor.error}</p>
                        </div>
                    )}

                    {/* Results Section - CapCut-inspired Layout */}
                    {hasResults && processor.result && (
                        <>
                            {/* ROW 1: File Explorer | Player (Character) | Shape Editor */}
                            <div className='grid grid-cols-12 gap-4 items-stretch'>
                                {/* Left: File Explorer (Coming Soon) */}
                                <div className='col-span-2'>
                                    <div className='card-base h-full'>
                                        <div className='px-4 py-3 border-b border-[#333333]'>
                                            <h3 className='text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider'>Load Media</h3>
                                        </div>
                                        <div className='p-4 flex flex-col items-center justify-center h-[calc(100%-48px)] text-center'>
                                            <div className='text-[#6b6b6b] mb-2'>
                                                <svg className='w-12 h-12 mx-auto mb-3 opacity-40' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' />
                                                </svg>
                                                <p className='text-sm text-[#6b6b6b]'>File Explorer</p>
                                            </div>
                                            <span className='text-xs px-2 py-1 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full'>Coming Soon</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Player (Character Preview) */}
                                <div className='col-span-6'>
                                    {!isCharacterFloating && (
                                        <CharacterDisplay
                                            phonemes={currentPhonemes}
                                            currentTime={playback.currentTime}
                                            onPopOut={() => setIsCharacterFloating(true)}
                                        />
                                    )}
                                    {isCharacterFloating && (
                                        <div className='card-base p-8 flex flex-col items-center justify-center text-center h-full'>
                                            <div className='text-[#6b6b6b] mb-4'>
                                                <svg className='w-12 h-12 mx-auto mb-2 opacity-50' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                                                </svg>
                                                Character is in floating window
                                            </div>
                                            <button
                                                onClick={() => setIsCharacterFloating(false)}
                                                className='btn-secondary'
                                            >
                                                Dock Character
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Shape Editor */}
                                <div className='col-span-4'>
                                    <MouthShapeDisplay
                                        phonemes={currentPhonemes}
                                        currentTime={playback.currentTime}
                                        duration={processor.result.duration}
                                    />
                                </div>
                            </div>

                            {/* ROW 2: Phoneme Editor (full width) - combines overview + detail */}
                            <PhonemeEditor
                                audioUrl={processor.result.audioUrl}
                                phonemes={currentPhonemes}
                                onPhonemesChange={handlePhonemesChange}
                                duration={processor.result.duration}
                                onTimeUpdate={handleEditorTimeUpdate}
                                onPlayStateChange={handleEditorPlayStateChange}
                                onSettingsClick={() => setShowSettings(true)}
                            />

                            {/* ROW 4: Results Panel (full width) */}
                            <ResultsPanel
                                phonemes={currentPhonemes}
                                duration={processor.result.duration}
                                processingTime={processor.result.processingTime}
                                audioBlob={currentAudioBlob}
                            />
                        </>
                    )}

                    {/* Empty state - only show when no results and not processing */}
                    {!hasResults && !processor.isProcessing && rhubarbAvailable !== false && <EmptyState />}
                </div>
            </main>

            {/* Floating Character Window */}
            <FloatingWindow
                isOpen={isCharacterFloating}
                onClose={() => setIsCharacterFloating(false)}
                title="Character Preview"
                defaultPosition={{ x: 50, y: 100 }}
                defaultSize={{ width: 450, height: 520 }}
                storageKey="characterPreview"
            >
                <CharacterDisplay
                    phonemes={currentPhonemes}
                    currentTime={playback.currentTime}
                    isFloating={true}
                />
            </FloatingWindow>

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
