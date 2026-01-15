"use client";

import { useState, useCallback, useRef } from 'react';
import { PhonemeData, ProcessingStatus, WaveformData, AudioInputMethod } from '@/app/lib/types';
import { processAudio as processWithRhubarb, RhubarbProcessingOptions } from '@/app/lib/rhubarb-api';
import { generateWaveformData } from '@/app/lib/waveform-generator';
import { WAVEFORM } from '@/app/lib/constants';

export interface ProcessingResult {
    phonemes: PhonemeData[];
    waveformData: WaveformData;
    audioUrl: string;
    duration: number;
    processingTime: number;
}

/**
 * Custom hook for audio processing with Rhubarb Lip Sync
 */
export function useAudioProcessor() {
    const [status, setStatus] = useState<ProcessingStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ProcessingResult | null>(null);

    // Track current processing to allow cancellation
    const processingRef = useRef<boolean>(false);

    /**
     * Process audio blob with Rhubarb
     */
    const processAudio = useCallback(async (
        blob: Blob,
        _inputMethod: AudioInputMethod,
        options?: RhubarbProcessingOptions
    ): Promise<ProcessingResult | null> => {
        // Prevent concurrent processing
        if (processingRef.current) {
            console.warn('Processing already in progress');
            return null;
        }

        processingRef.current = true;
        setStatus('processing');
        setError(null);

        try {
            // Generate waveform data for visualization (runs in parallel)
            const [waveformData, rhubarbResult] = await Promise.all([
                generateWaveformData(blob, WAVEFORM.SAMPLES_PER_PIXEL),
                processWithRhubarb(blob, options),
            ]);

            const result: ProcessingResult = {
                phonemes: rhubarbResult.phonemes,
                waveformData,
                audioUrl: rhubarbResult.audioUrl,
                duration: rhubarbResult.duration,
                processingTime: rhubarbResult.processingTime,
            };

            setResult(result);
            setStatus('success');

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to process audio';
            setError(message);
            setStatus('error');
            console.error('Processing error:', err);
            return null;
        } finally {
            processingRef.current = false;
        }
    }, []);

    // Reset processor state
    const reset = useCallback(() => {
        setStatus('idle');
        setError(null);
        setResult(null);
        processingRef.current = false;
    }, []);

    // Check if currently processing
    const isProcessing = status === 'processing';

    return {
        status,
        isProcessing,
        error,
        result,
        processAudio,
        reset,
    };
}

export type UseAudioProcessorReturn = ReturnType<typeof useAudioProcessor>;
