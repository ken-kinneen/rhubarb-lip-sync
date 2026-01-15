"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for audio playback control
 */
export function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Update time using requestAnimationFrame for smooth updates
  const updateTime = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  // Load audio from URL
  const load = useCallback((audioUrl: string) => {
    console.log('[Playback] Loading audio from URL:', audioUrl);
    
    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load(); // Force cleanup
    }
    
    const audio = new Audio();
    audioRef.current = audio;
    
    // Set up event listeners BEFORE setting src
    audio.addEventListener('loadedmetadata', () => {
      console.log('[Playback] Audio loaded successfully, duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoaded(true);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    });
    
    audio.addEventListener('error', (e) => {
      console.error('[Playback] Audio loading error:', {
        error: e,
        audioError: audio.error,
        src: audio.src,
        networkState: audio.networkState,
        readyState: audio.readyState,
      });
      setIsLoaded(false);
    });
    
    audio.addEventListener('canplaythrough', () => {
      console.log('[Playback] Audio can play through');
    });
    
    // Reset state
    setCurrentTime(0);
    setIsPlaying(false);
    setIsLoaded(false);
    
    // Set src AFTER event listeners are attached
    audio.src = audioUrl;
    audio.load();
  }, []);

  // Play audio
  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } catch (error) {
      console.error('Playback error:', error);
    }
  }, [updateTime]);

  // Pause audio
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Seek to time
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    const clampedTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }, []);

  // Restart from beginning
  const restart = useCallback(() => {
    seek(0);
  }, [seek]);

  // Set volume (0-1)
  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = Math.max(0, Math.min(1, volume));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Reset state
  const reset = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    audioRef.current = null;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoaded(false);
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    isLoaded,
    load,
    play,
    pause,
    togglePlayPause,
    seek,
    restart,
    setVolume,
    reset,
  };
}

export type UseAudioPlaybackReturn = ReturnType<typeof useAudioPlayback>;

