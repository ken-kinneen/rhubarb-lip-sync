'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

interface RhubarbResult {
  metadata: {
    soundFile: string;
    duration: number;
  };
  mouthCues: Array<{
    start: number;
    end: number;
    value: string;
  }>;
}

/**
 * Check if ffmpeg is available
 */
async function isFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert audio to WAV format using ffmpeg
 * Rhubarb only accepts WAV files
 */
async function convertToWav(inputPath: string, outputPath: string): Promise<void> {
  // ffmpeg command to convert to WAV (16-bit PCM, mono, 16kHz - optimal for speech)
  const cmd = `ffmpeg -y -i "${inputPath}" -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}"`;
  
  console.log('[FFmpeg] Converting to WAV:', cmd);
  
  try {
    await execAsync(cmd, { timeout: 30000 });
    console.log('[FFmpeg] Conversion successful');
  } catch (error: any) {
    console.error('[FFmpeg] Conversion failed:', error.message);
    throw new Error(`Audio conversion failed: ${error.message}. Make sure ffmpeg is installed.`);
  }
}

/**
 * Detect audio format from buffer magic bytes
 */
function detectAudioFormat(buffer: Buffer): string {
  // Check magic bytes
  if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WAVE') {
    return 'wav';
  }
  if (buffer.slice(0, 3).toString() === 'ID3' || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0)) {
    return 'mp3';
  }
  if (buffer.slice(0, 4).toString() === 'OggS') {
    return 'ogg';
  }
  if (buffer.slice(0, 4).toString() === 'fLaC') {
    return 'flac';
  }
  if (buffer.slice(4, 8).toString() === 'ftyp') {
    return 'm4a';
  }
  // Default to original extension handling
  return 'unknown';
}

/**
 * Process audio with real Rhubarb Lip Sync
 * Requires Rhubarb binary to be installed on the server
 * Automatically converts non-WAV files using ffmpeg
 */
export async function processWithRealRhubarb(
  audioData: string, // base64 encoded audio
  options?: {
    dialog?: string;
    extendedShapes?: string; // 'GHX', 'GX', 'X', or '' for basic shapes only
  }
): Promise<RhubarbResult> {
  const tempDir = tmpdir();
  const timestamp = Date.now();
  
  // We'll determine the actual format from the buffer
  const audioBuffer = Buffer.from(audioData, 'base64');
  const detectedFormat = detectAudioFormat(audioBuffer);
  
  console.log('[Rhubarb] Detected audio format:', detectedFormat);
  
  // File paths
  const originalPath = join(tempDir, `rhubarb-${timestamp}-original.${detectedFormat === 'unknown' ? 'audio' : detectedFormat}`);
  const wavPath = join(tempDir, `rhubarb-${timestamp}.wav`);
  const outputPath = join(tempDir, `rhubarb-${timestamp}.json`);
  const dialogPath = options?.dialog ? join(tempDir, `rhubarb-${timestamp}.txt`) : null;

  let needsConversion = detectedFormat !== 'wav';
  let audioPathForRhubarb = wavPath;

  try {
    // Write original audio to temp file
    await writeFile(originalPath, audioBuffer);

    // Convert to WAV if needed
    if (needsConversion) {
      const ffmpegAvailable = await isFFmpegAvailable();
      if (!ffmpegAvailable) {
        throw new Error(
          'Audio file is not in WAV format and ffmpeg is not installed. ' +
          'Please install ffmpeg to enable automatic audio conversion, or upload a WAV file.'
        );
      }
      await convertToWav(originalPath, wavPath);
    } else {
      // Already WAV, just rename/copy
      audioPathForRhubarb = originalPath;
    }

    // Write dialog file if provided
    if (dialogPath && options?.dialog) {
      await writeFile(dialogPath, options.dialog, 'utf8');
    }

    // Build Rhubarb command
    const rhubarbPath = process.env.RHUBARB_PATH || 'rhubarb';
    const extendedShapes = options?.extendedShapes ?? 'GHX';
    
    const cmd = [
      rhubarbPath,
      '-f json',
      `--extendedShapes ${extendedShapes}`,
      `-o "${outputPath}"`,
      dialogPath ? `-d "${dialogPath}"` : '',
      `"${audioPathForRhubarb}"`,
    ].filter(Boolean).join(' ');

    console.log('[Rhubarb] Running:', cmd);

    // Execute Rhubarb (60 second timeout)
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (stderr) {
      console.warn('[Rhubarb] stderr:', stderr);
    }

    // Read result
    const resultData = await readFile(outputPath, 'utf8');
    const result: RhubarbResult = JSON.parse(resultData);

    console.log('[Rhubarb] Success:', {
      phonemes: result.mouthCues?.length || 0,
      duration: result.metadata?.duration,
    });

    return result;
  } catch (error: any) {
    console.error('[Rhubarb] Error:', error);
    
    // Provide helpful error messages
    if (error.code === 'ENOENT') {
      throw new Error(
        'Rhubarb binary not found. Please install Rhubarb Lip Sync and set RHUBARB_PATH environment variable.'
      );
    }
    
    throw new Error(`Rhubarb processing failed: ${error.message}`);
  } finally {
    // Cleanup temp files
    await unlink(originalPath).catch(() => {});
    await unlink(wavPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
    if (dialogPath) await unlink(dialogPath).catch(() => {});
  }
}

/**
 * Check if Rhubarb is installed and available
 */
export async function checkRhubarbAvailable(): Promise<{
  available: boolean;
  version?: string;
  ffmpegAvailable?: boolean;
  error?: string;
}> {
  try {
    const rhubarbPath = process.env.RHUBARB_PATH || 'rhubarb';
    const { stdout } = await execAsync(`${rhubarbPath} --version`, {
      timeout: 5000,
    });
    
    // Also check ffmpeg
    const ffmpegAvailable = await isFFmpegAvailable();
    
    return {
      available: true,
      version: stdout.trim(),
      ffmpegAvailable,
    };
  } catch (error: any) {
    return {
      available: false,
      error: error.message,
    };
  }
}
