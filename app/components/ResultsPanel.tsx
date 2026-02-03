"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Download, Copy, Check, ChevronDown, ChevronUp, Film, Loader2 } from "lucide-react";
import { PhonemeData, MOUTH_SHAPE_INFO } from "@/app/lib/types";
import { exportPhonemeJSON } from "@/app/lib/rhubarb-api";
import { UI } from "@/app/lib/constants";
import { exportVideo, downloadBlob, isWebCodecsSupported, ExportProgress } from "@/app/lib/video-exporter";

interface ResultsPanelProps {
    phonemes: PhonemeData[];
    duration: number;
    processingTime: number;
    audioBlob?: Blob | null;
}

export function ResultsPanel({ phonemes, duration, processingTime, audioBlob }: ResultsPanelProps) {
    const [copied, setCopied] = useState(false);
    const [showFullJson, setShowFullJson] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);
    const [webCodecsSupported, setWebCodecsSupported] = useState(true);

    // Check WebCodecs support on mount
    useEffect(() => {
        setWebCodecsSupported(isWebCodecsSupported());
    }, []);

    const jsonOutput = useMemo(() => exportPhonemeJSON(phonemes, duration), [phonemes, duration]);

    // Calculate statistics
    const stats = useMemo(
        () => ({
            totalPhonemes: phonemes.length,
            duration: duration.toFixed(2),
            processingTime: processingTime.toFixed(2),
            avgPhonemeLength: phonemes.length > 0 ? ((duration / phonemes.length) * 1000).toFixed(0) : "0",
        }),
        [phonemes, duration, processingTime]
    );

    // Count phonemes by type
    const phonemeCounts = useMemo(() => {
        return phonemes.reduce((acc, p) => {
            acc[p.value] = (acc[p.value] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [phonemes]);

    const handleDownload = () => {
        const blob = new Blob([jsonOutput], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lipsync-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonOutput);
            setCopied(true);
            setTimeout(() => setCopied(false), UI.TOAST_DURATION_MS);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleExportVideo = async () => {
        if (!audioBlob || isExporting) return;

        setIsExporting(true);
        setExportError(null);
        setExportProgress(null);

        try {
            const videoBlob = await exportVideo({
                audioBlob,
                phonemes,
                duration,
                onProgress: setExportProgress,
            });

            downloadBlob(videoBlob, `lipsync-${Date.now()}.mp4`);
        } catch (error) {
            console.error("Failed to export video:", error);
            setExportError(error instanceof Error ? error.message : "Failed to export video");
        } finally {
            setIsExporting(false);
            setExportProgress(null);
        }
    };

    if (phonemes.length === 0) {
        return null;
    }

    return (
        <div className='card-base overflow-hidden'>
            {/* Header with actions */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-[#333333]'>
                <h2 className='text-lg font-semibold text-[#f5f5f5]'>Results</h2>
                <div className='flex gap-2'>
                    <button onClick={handleCopy} className='btn-secondary flex items-center gap-2'>
                        {copied ? (
                            <>
                                <Check className='w-4 h-4 text-green-400' />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className='w-4 h-4' />
                                Copy
                            </>
                        )}
                    </button>
                    <button onClick={handleDownload} className='btn-secondary flex items-center gap-2'>
                        <Download className='w-4 h-4' />
                        JSON
                    </button>
                    {webCodecsSupported && audioBlob && (
                        <button
                            onClick={handleExportVideo}
                            disabled={isExporting}
                            className='btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Film className='w-4 h-4' />
                                    Export MP4
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Export progress indicator */}
            {isExporting && exportProgress && (
                <div className='px-6 py-3 bg-[#1a1a1a] border-b border-[#333333]'>
                    <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm text-[#a8a8a8]'>{exportProgress.message}</span>
                        <span className='text-sm font-mono text-[#8b5cf6]'>{exportProgress.progress}%</span>
                    </div>
                    <div className='w-full h-2 bg-[#333333] rounded-full overflow-hidden'>
                        <div
                            className='h-full bg-[#8b5cf6] transition-all duration-200'
                            style={{ width: `${exportProgress.progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Export error */}
            {exportError && (
                <div className='px-6 py-3 bg-red-500/10 border-b border-red-500/30'>
                    <p className='text-sm text-red-400'>{exportError}</p>
                </div>
            )}

            {/* Statistics */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-px bg-[#333333]'>
                <StatCard label='Phonemes' value={stats.totalPhonemes.toString()} />
                <StatCard label='Duration' value={`${stats.duration}s`} />
                <StatCard label='Processing' value={`${stats.processingTime}s`} />
                <StatCard label='Avg Length' value={`${stats.avgPhonemeLength}ms`} />
            </div>

            {/* Phoneme distribution */}
            <div className='p-6 border-t border-[#333333]'>
                <div className='text-[10px] uppercase tracking-wider text-[#6b6b6b] mb-3'>Distribution</div>
                <div className='grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2'>
                    {Object.entries(phonemeCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([shape, count]) => {
                            const info = MOUTH_SHAPE_INFO[shape as keyof typeof MOUTH_SHAPE_INFO];
                            const percentage = ((count / phonemes.length) * 100).toFixed(0);

                            return (
                                <div key={shape} className='bg-[#1e1e1e] rounded-lg p-3 text-center relative overflow-hidden'>
                                    {/* Background bar */}
                                    <div
                                        className='absolute bottom-0 left-0 right-0 opacity-20'
                                        style={{
                                            height: `${percentage}%`,
                                            backgroundColor: info?.color || "#8b5cf6",
                                        }}
                                    />
                                    <div className='relative'>
                                        <div className='text-xl font-bold font-mono' style={{ color: info?.color || "#8b5cf6" }}>
                                            {shape}
                                        </div>
                                        <div className='text-xs text-[#6b6b6b] mt-1'>{count}×</div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* JSON output (collapsible) */}
            <div className='border-t border-[#333333]'>
                <button
                    onClick={() => setShowFullJson(!showFullJson)}
                    className='w-full flex items-center justify-between px-6 py-3 hover:bg-[#1e1e1e] transition-colors'
                >
                    <span className='text-sm font-medium text-[#a8a8a8]'>JSON Output</span>
                    {showFullJson ? <ChevronUp className='w-4 h-4 text-[#6b6b6b]' /> : <ChevronDown className='w-4 h-4 text-[#6b6b6b]' />}
                </button>

                {showFullJson && (
                    <div className='px-6 pb-6'>
                        <div className='bg-[#1e1e1e] rounded-lg p-4 overflow-auto max-h-80'>
                            <pre className='text-xs text-[#a8a8a8] font-mono whitespace-pre-wrap'>{jsonOutput}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className='bg-[#1a1a1a] p-4 text-center'>
            <div className='text-[10px] uppercase tracking-wider text-[#6b6b6b] mb-1'>{label}</div>
            <div className='text-2xl font-bold text-[#8b5cf6]'>{value}</div>
        </div>
    );
}
