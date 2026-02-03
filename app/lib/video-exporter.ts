/**
 * Client-side MP4 video exporter using WebCodecs API + Mediabunny
 * Combines audio with animated character images based on phoneme timing
 */

import {
    Output,
    Mp4OutputFormat,
    BufferTarget,
    CanvasSource,
    AudioBufferSource,
} from 'mediabunny';
import { PhonemeData, MouthShape, MouthShapeConfig } from './types';
import { loadMouthShapeConfig } from './mouth-shape-config';

// Export settings
const FRAME_RATE = 30;
const VIDEO_BITRATE = 8_000_000; // 8 Mbps for high quality
const AUDIO_BITRATE = 192_000; // 192 kbps for better audio
const AUDIO_SAMPLE_RATE = 48000;
const BACKGROUND_COLOR = '#121212'; // Match app dark theme

export interface ExportProgress {
    phase: 'loading' | 'encoding' | 'finalizing';
    progress: number; // 0-100
    message: string;
}

export interface ExportOptions {
    audioBlob: Blob;
    phonemes: PhonemeData[];
    duration: number;
    onProgress?: (progress: ExportProgress) => void;
}

/**
 * Check if WebCodecs API is supported in the current browser
 */
export function isWebCodecsSupported(): boolean {
    return typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined';
}

/**
 * Get the current phoneme for a given timestamp
 */
function getPhonemeAtTime(phonemes: PhonemeData[], time: number): MouthShape {
    const phoneme = phonemes.find(p => time >= p.start && time < p.end);
    return phoneme?.value || 'X';
}

interface ImageAssets {
    images: Map<MouthShape, ImageBitmap>;
    width: number;
    height: number;
}

/**
 * Preload all character images and determine video dimensions from the first image
 */
async function preloadImages(
    config: Record<MouthShape, MouthShapeConfig>
): Promise<ImageAssets> {
    const imageMap = new Map<MouthShape, ImageBitmap>();
    const shapes: MouthShape[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'];
    
    let width = 1280; // Default fallback
    let height = 720;
    let firstImageLoaded = false;

    await Promise.all(
        shapes.map(async (shape) => {
            const url = config[shape]?.images?.characterUrl;
            if (url) {
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const bitmap = await createImageBitmap(blob);
                    imageMap.set(shape, bitmap);
                    
                    // Use the first successfully loaded image to determine dimensions
                    if (!firstImageLoaded) {
                        width = bitmap.width;
                        height = bitmap.height;
                        firstImageLoaded = true;
                    }
                } catch (error) {
                    console.warn(`Failed to load image for shape ${shape}:`, error);
                }
            }
        })
    );

    // Ensure dimensions are even (required for video encoding)
    width = Math.round(width / 2) * 2;
    height = Math.round(height / 2) * 2;

    return { images: imageMap, width, height };
}

/**
 * Draw a frame to the canvas with the appropriate mouth shape
 */
function drawFrameToCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    imageMap: Map<MouthShape, ImageBitmap>,
    shape: MouthShape
): void {
    // Clear canvas with dark background matching the app theme
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const image = imageMap.get(shape);
    if (image) {
        // Draw image at full canvas size (canvas is sized to match image)
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: draw the shape letter
        ctx.fillStyle = '#8b5cf6';
        ctx.font = `bold ${Math.min(canvas.width, canvas.height) / 4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shape, canvas.width / 2, canvas.height / 2);
    }
}

/**
 * Decode audio blob to AudioBuffer
 */
async function decodeAudio(audioBlob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();
    return audioBuffer;
}

/**
 * Export lip-synced video as MP4
 */
export async function exportVideo(options: ExportOptions): Promise<Blob> {
    const { audioBlob, phonemes, duration, onProgress } = options;

    if (!isWebCodecsSupported()) {
        throw new Error('WebCodecs API is not supported in this browser');
    }

    // Phase 1: Loading resources
    onProgress?.({
        phase: 'loading',
        progress: 0,
        message: 'Loading character images...',
    });

    const mouthShapeConfig = loadMouthShapeConfig();
    const { images: imageMap, width: videoWidth, height: videoHeight } = await preloadImages(mouthShapeConfig);
    
    console.log(`[Video Export] Using dimensions: ${videoWidth}x${videoHeight}`);

    onProgress?.({
        phase: 'loading',
        progress: 50,
        message: 'Decoding audio...',
    });

    const audioBuffer = await decodeAudio(audioBlob);

    onProgress?.({
        phase: 'loading',
        progress: 100,
        message: 'Resources loaded',
    });

    // Phase 2: Encoding
    onProgress?.({
        phase: 'encoding',
        progress: 0,
        message: 'Setting up encoder...',
    });

    // Create canvas for rendering frames (use regular canvas for CanvasSource)
    // Size matches the source images for best quality
    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
    })!;

    // Create Mediabunny output
    const output = new Output({
        format: new Mp4OutputFormat({
            fastStart: 'in-memory',
        }),
        target: new BufferTarget(),
    });

    // Create video source using CanvasSource - designed for canvas-based rendering
    const videoSource = new CanvasSource(canvas, {
        codec: 'avc',
        bitrate: VIDEO_BITRATE,
    });

    // Create audio source using AudioBufferSource
    const audioSource = new AudioBufferSource({
        codec: 'aac',
        bitrate: AUDIO_BITRATE,
    });

    // Add tracks
    output.addVideoTrack(videoSource, { frameRate: FRAME_RATE });
    output.addAudioTrack(audioSource);

    // Start output
    await output.start();

    // Calculate total frames
    const totalFrames = Math.ceil(duration * FRAME_RATE);
    const frameDuration = 1 / FRAME_RATE;

    // Encode video frames
    for (let frameNumber = 0; frameNumber < totalFrames; frameNumber++) {
        const timestamp = frameNumber / FRAME_RATE;
        const shape = getPhonemeAtTime(phonemes, timestamp);

        // Draw frame to canvas
        drawFrameToCanvas(ctx, canvas, imageMap, shape);

        // Add frame using CanvasSource API (timestamp and duration in seconds)
        await videoSource.add(timestamp, frameDuration);

        // Update progress
        if (frameNumber % 10 === 0) {
            const progress = Math.round((frameNumber / totalFrames) * 80);
            onProgress?.({
                phase: 'encoding',
                progress,
                message: `Encoding frame ${frameNumber + 1}/${totalFrames}...`,
            });
        }
    }

    // Close video source when done
    videoSource.close();

    onProgress?.({
        phase: 'encoding',
        progress: 80,
        message: 'Encoding audio...',
    });

    // Add audio using AudioBufferSource - it accepts AudioBuffer directly
    await audioSource.add(audioBuffer);
    audioSource.close();

    onProgress?.({
        phase: 'encoding',
        progress: 95,
        message: 'Finishing encoding...',
    });

    // Phase 3: Finalizing
    onProgress?.({
        phase: 'finalizing',
        progress: 0,
        message: 'Finalizing video...',
    });

    await output.finalize();

    onProgress?.({
        phase: 'finalizing',
        progress: 100,
        message: 'Export complete!',
    });

    // Get the final buffer
    const buffer = (output.target as BufferTarget).buffer;
    if (!buffer) {
        throw new Error('Failed to generate video buffer');
    }

    return new Blob([buffer], { type: 'video/mp4' });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
