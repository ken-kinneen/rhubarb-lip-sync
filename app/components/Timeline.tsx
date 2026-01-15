"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, Volume2, Gauge } from 'lucide-react';
import { PhonemeData, MOUTH_SHAPE_INFO, WaveformData } from '@/app/lib/types';
import { 
  drawWaveform, 
  drawPhonemeMarkers, 
  drawPlayhead, 
  getTimeFromPosition,
} from '@/app/lib/waveform-generator';
import { formatTime } from '@/app/lib/audio-utils';
import { WAVEFORM } from '@/app/lib/constants';

interface TimelineProps {
  waveformData: WaveformData | null;
  phonemes: PhonemeData[];
  currentTime: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  duration: number;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export function Timeline({
  waveformData,
  phonemes,
  currentTime,
  isPlaying,
  onSeek,
  onPlayPause,
  duration,
}: TimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Update canvas size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.clientWidth);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Find audio element and set playback rate
  useEffect(() => {
    // Find the audio element in the DOM (created by useAudioPlayback hook)
    const findAudioElement = () => {
      const audioElements = document.getElementsByTagName('audio');
      if (audioElements.length > 0) {
        audioElementRef.current = audioElements[0] as HTMLAudioElement;
        audioElementRef.current.playbackRate = playbackSpeed;
      }
    };

    findAudioElement();
    const interval = setInterval(findAudioElement, 100);
    
    return () => clearInterval(interval);
  }, []);

  // Update playback rate when speed changes
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Draw waveform and phonemes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = WAVEFORM.CANVAS_HEIGHT;

    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const progress = duration > 0 ? currentTime / duration : 0;

    // Draw waveform if available
    if (waveformData) {
      drawWaveform(canvas, waveformData.peaks, {
        progress,
        height: canvas.height,
      });
    } else {
      // Draw a simple placeholder based on phonemes
      drawSimplifiedTimeline(ctx, canvas.width, canvas.height, progress);
    }

    // Draw phoneme markers
    if (phonemes.length > 0 && duration > 0) {
      const phonemesWithColors = phonemes.map(p => ({
        ...p,
        color: MOUTH_SHAPE_INFO[p.value].color,
      }));
      drawPhonemeMarkers(canvas, phonemesWithColors, duration, {
        markerHeight: WAVEFORM.PHONEME_MARKER_HEIGHT,
      });
    }

    // Draw playhead
    if (duration > 0) {
      drawPlayhead(canvas, progress);
    }
  }, [waveformData, phonemes, currentTime, duration, canvasWidth]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;

    const time = getTimeFromPosition(canvas, e.clientX, duration);
    onSeek(time);
  }, [duration, onSeek]);

  const handleRestart = useCallback(() => {
    onSeek(0);
  }, [onSeek]);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  // Progress percentage for the progress bar
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="card-base overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#333333]">
        <h2 className="text-lg font-semibold text-[#f5f5f5]">Timeline</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm font-mono text-[#a8a8a8]">
            <span className="text-[#8b5cf6]">{formatTime(currentTime)}</span>
            <span className="text-[#4a4a4a] mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="relative bg-[#1e1e1e]">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full cursor-pointer"
          style={{ display: 'block', height: `${WAVEFORM.CANVAS_HEIGHT}px` }}
        />
        
        {/* Progress bar overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#333333]">
          <div 
            className="h-full bg-[#8b5cf6] transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-[#333333]">
        <button
          onClick={handleRestart}
          className="btn-ghost p-2"
          title="Restart"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={onPlayPause}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Play
            </>
          )}
        </button>

        <div className="flex-1" />

        {/* Playback speed control */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="btn-secondary flex items-center gap-2 px-3"
            title="Playback speed"
          >
            <Gauge className="w-4 h-4" />
            <span className="text-sm font-mono">{playbackSpeed}x</span>
          </button>
          
          {showSpeedMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowSpeedMenu(false)}
              />
              
              {/* Speed menu */}
              <div className="absolute bottom-full right-0 mb-2 bg-[#242424] border border-[#333333] rounded-lg shadow-lg overflow-hidden z-20">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`
                      w-full px-4 py-2 text-left text-sm font-mono
                      transition-colors
                      ${speed === playbackSpeed 
                        ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' 
                        : 'text-[#a8a8a8] hover:bg-[#2a2a2a]'
                      }
                    `}
                  >
                    {speed}x {speed === 1.0 && '(Normal)'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phoneme count */}
        <div className="text-sm text-[#6b6b6b]">
          {phonemes.length} phonemes
        </div>

        {/* Volume indicator */}
        <div className="flex items-center gap-2 text-[#6b6b6b]">
          <Volume2 className="w-4 h-4" />
        </div>
      </div>

      {/* Phoneme legend */}
      {phonemes.length > 0 && (
        <div className="px-6 py-4 border-t border-[#333333] bg-[#1a1a1a]">
          <div className="text-[10px] uppercase tracking-wider text-[#6b6b6b] mb-3">
            Mouth Shape Legend
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {Object.entries(MOUTH_SHAPE_INFO).map(([shape, info]) => (
              <div
                key={shape}
                className="flex items-center gap-2 text-xs"
              >
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-[#a8a8a8] font-mono">{shape}</span>
                <span className="text-[#4a4a4a] hidden lg:inline truncate">{info.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Draw a simplified timeline when waveform data is not available
 */
function drawSimplifiedTimeline(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number,
  progress: number
): void {
  const centerY = height / 2;
  const barHeight = 4;
  
  // Background bar
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, centerY - barHeight / 2, width, barHeight);
  
  // Progress bar
  ctx.fillStyle = '#8b5cf6';
  ctx.fillRect(0, centerY - barHeight / 2, width * progress, barHeight);
}
