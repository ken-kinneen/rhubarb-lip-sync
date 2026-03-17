"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { PhonemeData, WaveformData, AudioInputMethod } from '@/app/lib/types';
import {
  getCurrentSessionId,
  createSession,
  loadFullState,
  saveAudioData,
  saveProcessingResult,
  saveUIState,
  FullPersistedState,
  PersistedSession,
} from '@/app/lib/persistence';

// ============================================================================
// Types
// ============================================================================

export interface RestoredState {
  audioBlob: Blob | null;
  audioUrl: string | null;
  inputMethod: AudioInputMethod | null;
  phonemes: PhonemeData[] | null;
  waveformData: WaveformData | null;
  duration: number | null;
  processingTime: number | null;
  extendedShapes: string;
  isCharacterFloating: boolean;
  editablePhonemes: PhonemeData[] | null;
}

export interface UsePersistenceReturn {
  isLoading: boolean;
  isRestored: boolean;
  sessionId: string | null;
  restoredState: RestoredState | null;
  saveAudio: (blob: Blob, inputMethod: AudioInputMethod) => Promise<void>;
  saveResult: (phonemes: PhonemeData[], waveformData: WaveformData, duration: number, processingTime: number) => Promise<void>;
  saveUI: (extendedShapes: string, isCharacterFloating: boolean, editablePhonemes: PhonemeData[] | null) => void;
  clearSession: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export function usePersistence(): UsePersistenceReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isRestored, setIsRestored] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [restoredState, setRestoredState] = useState<RestoredState | null>(null);
  
  // Track if we've initialized to prevent double-init in strict mode
  const initializedRef = useRef(false);
  // Track blob URLs we create so we can revoke them
  const blobUrlRef = useRef<string | null>(null);

  // Initialize: load existing session or create new one
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      try {
        // Check for existing session
        const existingSessionId = await getCurrentSessionId();
        
        if (existingSessionId) {
          // Try to load existing state
          const state = await loadFullState(existingSessionId);
          
          if (state && (state.audio || state.result)) {
            // We have data to restore
            setSessionId(existingSessionId);
            
            // Create blob URL for audio if we have it
            let audioUrl: string | null = null;
            if (state.audio?.audioBlob) {
              audioUrl = URL.createObjectURL(state.audio.audioBlob);
              blobUrlRef.current = audioUrl;
            }
            
            const restored: RestoredState = {
              audioBlob: state.audio?.audioBlob || null,
              audioUrl,
              inputMethod: state.audio?.inputMethod || null,
              phonemes: state.result?.phonemes || null,
              waveformData: state.result?.waveformData || null,
              duration: state.result?.duration || null,
              processingTime: state.result?.processingTime || null,
              extendedShapes: state.uiState?.extendedShapes || 'GHX',
              isCharacterFloating: state.uiState?.isCharacterFloating || false,
              editablePhonemes: state.uiState?.editablePhonemes || null,
            };
            
            setRestoredState(restored);
            setIsRestored(true);
            console.log('✅ Restored session:', existingSessionId);
          } else {
            // Session exists but no data, create new
            const newSession = await createSession();
            setSessionId(newSession.id);
            console.log('📝 Created new session (previous was empty):', newSession.id);
          }
        } else {
          // No existing session, create new
          const newSession = await createSession();
          setSessionId(newSession.id);
          console.log('📝 Created new session:', newSession.id);
        }
      } catch (error) {
        console.error('Failed to initialize persistence:', error);
        // Create a new session as fallback
        try {
          const newSession = await createSession();
          setSessionId(newSession.id);
        } catch {
          // IndexedDB not available, generate a temporary ID
          setSessionId(`temp_${Date.now()}`);
        }
      } finally {
        setIsLoading(false);
      }
    }

    init();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  // Save audio data
  const saveAudio = useCallback(async (blob: Blob, inputMethod: AudioInputMethod) => {
    if (!sessionId) return;
    
    try {
      await saveAudioData({
        sessionId,
        audioBlob: blob,
        audioMimeType: blob.type,
        inputMethod,
      });
      console.log('💾 Saved audio data');
    } catch (error) {
      console.error('Failed to save audio:', error);
    }
  }, [sessionId]);

  // Save processing result
  const saveResult = useCallback(async (
    phonemes: PhonemeData[],
    waveformData: WaveformData,
    duration: number,
    processingTime: number
  ) => {
    if (!sessionId) return;
    
    try {
      await saveProcessingResult({
        sessionId,
        phonemes,
        waveformData,
        duration,
        processingTime,
      });
      console.log('💾 Saved processing result');
    } catch (error) {
      console.error('Failed to save result:', error);
    }
  }, [sessionId]);

  // Save UI state (synchronous, uses localStorage)
  const saveUI = useCallback((
    extendedShapes: string,
    isCharacterFloating: boolean,
    editablePhonemes: PhonemeData[] | null
  ) => {
    if (!sessionId) return;
    
    saveUIState({
      sessionId,
      extendedShapes,
      isCharacterFloating,
      editablePhonemes,
    });
  }, [sessionId]);

  // Clear current session and start fresh
  const clearSession = useCallback(async () => {
    // Revoke old blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    
    // Create new session
    const newSession = await createSession();
    setSessionId(newSession.id);
    setRestoredState(null);
    setIsRestored(false);
    console.log('🗑️ Cleared session, created new:', newSession.id);
  }, []);

  return {
    isLoading,
    isRestored,
    sessionId,
    restoredState,
    saveAudio,
    saveResult,
    saveUI,
    clearSession,
  };
}
