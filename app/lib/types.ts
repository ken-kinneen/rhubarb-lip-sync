/**
 * Core application types
 */

// ============================================================================
// Phoneme Types
// ============================================================================

/** Rhubarb mouth shapes - represents different mouth positions */
export type MouthShape = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X';

/** Basic mouth shapes (always available) */
export type BasicMouthShape = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** Extended mouth shapes (optional) */
export type ExtendedMouthShape = 'G' | 'H' | 'X';

/** Phoneme data with timing information */
export interface PhonemeData {
  start: number;      // Start time in seconds
  end: number;        // End time in seconds
  value: MouthShape;  // The mouth shape
}

/** Mouth shape metadata for display */
export interface MouthShapeInfo {
  name: string;
  description: string;
  color: string;
}

/** Mouth shape image configuration */
export interface MouthShapeImages {
  mouthUrl: string;      // URL to just the mouth image
  characterUrl: string;  // URL to full character with this mouth shape
}

/** Complete mouth shape configuration */
export interface MouthShapeConfig {
  info: MouthShapeInfo;
  images: MouthShapeImages;
}

/** 
 * Complete mouth shape reference
 * @deprecated Use loadMouthShapeConfig() from mouth-shape-config.ts instead
 * This is kept for backward compatibility
 */
export const MOUTH_SHAPE_INFO: Record<MouthShape, MouthShapeInfo> = {
  A: { name: 'Rest', description: 'Closed mouth (rest position)', color: '#6b7280' },
  B: { name: 'M/B/P', description: 'Lips together', color: '#ef4444' },
  C: { name: 'T/D/S', description: 'Mouth slightly open', color: '#f59e0b' },
  D: { name: 'Ah', description: 'Mouth open (vowels)', color: '#eab308' },
  E: { name: 'Ee', description: 'Narrow opening', color: '#84cc16' },
  F: { name: 'F/V', description: 'Teeth on lower lip', color: '#22c55e' },
  G: { name: 'G/K', description: 'Back of tongue', color: '#14b8a6' },
  H: { name: 'Wide', description: 'Wide open mouth', color: '#06b6d4' },
  X: { name: 'Silence', description: 'Closed (silence)', color: '#3b82f6' },
};

// ============================================================================
// Processing Types
// ============================================================================

/** Result from processing audio */
export interface ProcessingResult {
  phonemes: PhonemeData[];
  duration: number;
  processingTime: number;
  audioUrl: string;
}

/** Processing state */
export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

// ============================================================================
// Audio Input Types
// ============================================================================

/** How audio was provided */
export type AudioInputMethod = 'recording' | 'upload' | 'example';

/** Audio input state */
export interface AudioInputState {
  method: AudioInputMethod | null;
  blob: Blob | null;
  url: string | null;
  filename?: string;
}

// ============================================================================
// Playback Types
// ============================================================================

/** Audio playback state */
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

// ============================================================================
// Waveform Types
// ============================================================================

/** Waveform visualization data */
export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
}

// ============================================================================
// Example Audio
// ============================================================================

/** Example audio file metadata */
export interface ExampleAudio {
  id: string;
  name: string;
  description: string;
  filename: string;
  duration: number;
}

// ============================================================================
// Rhubarb Settings Types  
// ============================================================================

/** 
 * Rhubarb processing options 
 * Note: These are the actual options supported by the Rhubarb binary
 */
export interface RhubarbOptions {
  /** Optional dialog text to improve phoneme detection accuracy */
  dialog?: string;
  /** 
   * Extended mouth shapes to use (combine letters: 'GHX', 'GX', 'G', etc.)
   * - G: F/V sounds (teeth on lower lip)
   * - H: Long L sounds (tongue raised)
   * - X: Silence/rest position
   */
  extendedShapes?: string;
}
