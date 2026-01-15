/**
 * Waveform visualization generator
 */

export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
}

/**
 * Generate waveform data from audio buffer
 */
export async function generateWaveformData(
  audioBlob: Blob,
  samplesPerPixel: number = 100
): Promise<WaveformData> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    
    // Calculate peaks
    const peaks = extractPeaks(channelData, samplesPerPixel);
    
    await audioContext.close();
    
    return {
      peaks,
      duration,
      sampleRate,
    };
  } catch (error) {
    await audioContext.close();
    throw error;
  }
}

/**
 * Extract peak values from audio data
 */
function extractPeaks(channelData: Float32Array, samplesPerPixel: number): number[] {
  const peaks: number[] = [];
  const totalSamples = channelData.length;
  const numPeaks = Math.ceil(totalSamples / samplesPerPixel);
  
  for (let i = 0; i < numPeaks; i++) {
    const start = i * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, totalSamples);
    
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) {
        max = abs;
      }
    }
    
    peaks.push(max);
  }
  
  return peaks;
}

/**
 * Draw waveform on canvas
 */
export function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: number[],
  options: {
    backgroundColor?: string;
    waveColor?: string;
    progressColor?: string;
    progress?: number; // 0-1
    height?: number;
  } = {}
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const {
    backgroundColor = '#1e1e1e',
    waveColor = '#4a4a4a',
    progressColor = '#8b5cf6',
    progress = 0,
    height = canvas.height,
  } = options;

  const width = canvas.width;
  const centerY = height / 2;
  const barWidth = width / peaks.length;
  const progressX = width * progress;

  // Clear canvas
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw waveform
  peaks.forEach((peak, i) => {
    const x = i * barWidth;
    const barHeight = peak * centerY * 0.9; // Scale to 90% of half height
    
    // Choose color based on progress
    ctx.fillStyle = x < progressX ? progressColor : waveColor;
    
    // Draw bar (centered vertically)
    ctx.fillRect(
      x,
      centerY - barHeight,
      Math.max(1, barWidth - 1),
      barHeight * 2
    );
  });
}

/**
 * Draw phoneme markers on canvas
 */
export function drawPhonemeMarkers(
  canvas: HTMLCanvasElement,
  phonemes: Array<{ start: number; end: number; value: string; color: string }>,
  duration: number,
  options: {
    markerHeight?: number;
    opacity?: number;
  } = {}
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const {
    markerHeight = 20,
    opacity = 0.6,
  } = options;

  const width = canvas.width;
  const height = canvas.height;

  phonemes.forEach(phoneme => {
    const startX = (phoneme.start / duration) * width;
    const endX = (phoneme.end / duration) * width;
    const markerWidth = endX - startX;

    // Draw colored bar at top
    ctx.fillStyle = phoneme.color;
    ctx.globalAlpha = opacity;
    ctx.fillRect(startX, 0, markerWidth, markerHeight);

    // Draw label if wide enough
    if (markerWidth > 20) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(phoneme.value, startX + markerWidth / 2, markerHeight / 2);
    }

    // Draw vertical line at boundaries
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = phoneme.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, markerHeight);
    ctx.lineTo(startX, height);
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
}

/**
 * Draw playhead indicator
 */
export function drawPlayhead(
  canvas: HTMLCanvasElement,
  position: number, // 0-1
  color: string = '#ffffff'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const x = canvas.width * position;
  const height = canvas.height;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  // Draw triangle at top
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x - 5, 10);
  ctx.lineTo(x + 5, 10);
  ctx.closePath();
  ctx.fill();
}

/**
 * Get time from canvas click position
 */
export function getTimeFromPosition(
  canvas: HTMLCanvasElement,
  clickX: number,
  duration: number
): number {
  const rect = canvas.getBoundingClientRect();
  const x = clickX - rect.left;
  const progress = Math.max(0, Math.min(1, x / canvas.width));
  return progress * duration;
}



