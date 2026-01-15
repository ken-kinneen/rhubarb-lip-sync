/**
 * Rhubarb Lip Sync API Client
 * 
 * Supports two modes:
 * 1. Local Server Action (for local dev with Rhubarb installed)
 * 2. External API (for Vercel deployment)
 */

import { PhonemeData, MouthShape } from './types';

// Check if we should use external API
const RHUBARB_API_URL = process.env.NEXT_PUBLIC_RHUBARB_API_URL;

/**
 * Convert audio Blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1] || base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface RhubarbProcessingOptions {
  dialog?: string;
  extendedShapes?: string;
}

export interface RhubarbProcessingResult {
  phonemes: PhonemeData[];
  duration: number;
  audioUrl: string;
  processingTime: number;
}

/**
 * Process audio via External API (for Vercel deployment)
 */
async function processViaExternalAPI(
  audioBlob: Blob,
  options?: RhubarbProcessingOptions
): Promise<RhubarbProcessingResult> {
  const startTime = performance.now();

  console.log('[Rhubarb] Using external API:', RHUBARB_API_URL);

  // Send as form data for better compatibility
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.wav');
  if (options?.extendedShapes) {
    formData.append('extendedShapes', options.extendedShapes);
  }
  if (options?.dialog) {
    formData.append('dialog', options.dialog);
  }

  const response = await fetch(`${RHUBARB_API_URL}/process`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  const result = await response.json();

  const phonemes: PhonemeData[] = result.mouthCues.map((cue: any) => ({
    start: cue.start,
    end: cue.end,
    value: cue.value as MouthShape,
  }));

  const audioUrl = URL.createObjectURL(audioBlob);
  const processingTime = result.processingTime || (performance.now() - startTime) / 1000;

  console.log('[Rhubarb] External API result:', {
    phonemes: phonemes.length,
    duration: result.metadata.duration,
    processingTime: processingTime.toFixed(2) + 's',
  });

  return {
    phonemes,
    duration: result.metadata.duration,
    audioUrl,
    processingTime,
  };
}

/**
 * Process audio via Server Action (for local development)
 */
async function processViaServerAction(
  audioBlob: Blob,
  options?: RhubarbProcessingOptions
): Promise<RhubarbProcessingResult> {
  // Dynamic import to avoid bundling server code in client
  const { processWithRealRhubarb } = await import('@/app/actions/rhubarb');

  const startTime = performance.now();

  console.log('[Rhubarb] Using local server action...');
  const base64Audio = await blobToBase64(audioBlob);

  const result = await processWithRealRhubarb(base64Audio, {
    dialog: options?.dialog,
    extendedShapes: options?.extendedShapes ?? 'GHX',
  });

  const processingTime = (performance.now() - startTime) / 1000;

  const phonemes: PhonemeData[] = result.mouthCues.map(cue => ({
    start: cue.start,
    end: cue.end,
    value: cue.value as MouthShape,
  }));

  const audioUrl = URL.createObjectURL(audioBlob);

  console.log('[Rhubarb] Server action result:', {
    phonemes: phonemes.length,
    duration: result.metadata.duration,
    processingTime: processingTime.toFixed(2) + 's',
  });

  return {
    phonemes,
    duration: result.metadata.duration,
    audioUrl,
    processingTime,
  };
}

/**
 * Process audio with Rhubarb Lip Sync
 * Automatically uses external API if configured, otherwise server action
 */
export async function processAudio(
  audioBlob: Blob,
  options?: RhubarbProcessingOptions
): Promise<RhubarbProcessingResult> {
  if (RHUBARB_API_URL) {
    return processViaExternalAPI(audioBlob, options);
  } else {
    return processViaServerAction(audioBlob, options);
  }
}

/**
 * Check if Rhubarb is available
 */
export async function isRhubarbAvailable(): Promise<boolean> {
  try {
    if (RHUBARB_API_URL) {
      // Check external API
      const response = await fetch(`${RHUBARB_API_URL}/version`);
      const result = await response.json();
      if (result.available) {
        console.log('[Rhubarb] External API available, version:', result.version);
      }
      return result.available;
    } else {
      // Check local server action
      const { checkRhubarbAvailable } = await import('@/app/actions/rhubarb');
      const result = await checkRhubarbAvailable();
      if (result.available) {
        console.log('[Rhubarb] Local binary available, version:', result.version);
      } else {
        console.warn('[Rhubarb] Local binary not found:', result.error);
      }
      return result.available;
    }
  } catch (error) {
    console.error('[Rhubarb] Availability check failed:', error);
    return false;
  }
}

/**
 * Export phoneme data as JSON string (Rhubarb format)
 */
export function exportPhonemeJSON(phonemes: PhonemeData[], duration: number): string {
  const output = {
    metadata: {
      soundFile: 'audio.wav',
      duration: duration,
    },
    mouthCues: phonemes.map(p => ({
      start: p.start,
      end: p.end,
      value: p.value,
    })),
  };

  return JSON.stringify(output, null, 2);
}
