/**
 * Application constants - centralized configuration
 */

// Waveform visualization
export const WAVEFORM = {
  SAMPLES_PER_PIXEL: 100,
  CANVAS_HEIGHT: 200,
  PHONEME_MARKER_HEIGHT: 30,
  WAVEFORM_SCALE: 0.9, // Scale to 90% of available height
} as const;

// Recording settings
export const RECORDING = {
  DATA_INTERVAL_MS: 100, // Collect data every 100ms
  TIMER_INTERVAL_MS: 100, // Update timer every 100ms
} as const;

// Supported audio formats for upload
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/webm',
  'audio/m4a',
  'audio/aac',
] as const;

// Example audio files (stored in public/examples/)
export const EXAMPLE_AUDIO_FILES = [
  {
    id: 'sample',
    name: 'Sample Audio',
    description: 'A short audio sample for testing',
    filename: 'hello-world.mp3',
    duration: 12.0,
  },
] as const;

// UI configuration
export const UI = {
  TOAST_DURATION_MS: 2000,
  DEBOUNCE_RESIZE_MS: 100,
} as const;
