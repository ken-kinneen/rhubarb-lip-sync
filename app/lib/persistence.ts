/**
 * Persistence layer for Rhubarb Lip Sync app
 * 
 * Uses IndexedDB for large binary data (audio blobs, waveform)
 * and localStorage for smaller state data.
 */

import { PhonemeData, WaveformData, AudioInputMethod } from './types';

// ============================================================================
// Types
// ============================================================================

export interface PersistedSession {
  id: string;
  createdAt: number;
  updatedAt: number;
  name?: string;
}

export interface PersistedAudioData {
  sessionId: string;
  audioBlob: Blob;
  audioMimeType: string;
  inputMethod: AudioInputMethod;
}

export interface PersistedProcessingResult {
  sessionId: string;
  phonemes: PhonemeData[];
  waveformData: WaveformData;
  duration: number;
  processingTime: number;
}

export interface PersistedUIState {
  sessionId: string;
  extendedShapes: string;
  isCharacterFloating: boolean;
  editablePhonemes: PhonemeData[] | null;
}

export interface FullPersistedState {
  session: PersistedSession;
  audio: PersistedAudioData | null;
  result: PersistedProcessingResult | null;
  uiState: PersistedUIState | null;
}

// ============================================================================
// Constants
// ============================================================================

const DB_NAME = 'rhubarbLipSync';
const DB_VERSION = 1;
const STORE_AUDIO = 'audio';
const STORE_RESULTS = 'results';
const STORE_SESSIONS = 'sessions';

const LOCALSTORAGE_PREFIX = 'rhubarbLipSync_';
const CURRENT_SESSION_KEY = `${LOCALSTORAGE_PREFIX}currentSession`;
const UI_STATE_KEY = `${LOCALSTORAGE_PREFIX}uiState`;

// ============================================================================
// IndexedDB Setup
// ============================================================================

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Audio store - keyed by sessionId
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: 'sessionId' });
      }

      // Results store - keyed by sessionId
      if (!db.objectStoreNames.contains(STORE_RESULTS)) {
        db.createObjectStore(STORE_RESULTS, { keyPath: 'sessionId' });
      }

      // Sessions store - keyed by id
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const sessionStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
        sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });

  return dbPromise;
}

// ============================================================================
// Session Management
// ============================================================================

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function getCurrentSessionId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_SESSION_KEY);
}

export async function setCurrentSessionId(sessionId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
}

export async function createSession(name?: string): Promise<PersistedSession> {
  const db = await getDB();
  const session: PersistedSession = {
    id: generateSessionId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    name,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SESSIONS], 'readwrite');
    const store = transaction.objectStore(STORE_SESSIONS);
    const request = store.add(session);

    request.onsuccess = () => {
      setCurrentSessionId(session.id);
      resolve(session);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getSession(sessionId: string): Promise<PersistedSession | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SESSIONS], 'readonly');
    const store = transaction.objectStore(STORE_SESSIONS);
    const request = store.get(sessionId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function updateSession(sessionId: string): Promise<void> {
  const db = await getDB();
  const session = await getSession(sessionId);
  if (!session) return;

  session.updatedAt = Date.now();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SESSIONS], 'readwrite');
    const store = transaction.objectStore(STORE_SESSIONS);
    const request = store.put(session);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function listSessions(): Promise<PersistedSession[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SESSIONS], 'readonly');
    const store = transaction.objectStore(STORE_SESSIONS);
    const index = store.index('updatedAt');
    const request = index.openCursor(null, 'prev'); // Most recent first

    const sessions: PersistedSession[] = [];
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        sessions.push(cursor.value);
        cursor.continue();
      } else {
        resolve(sessions);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SESSIONS, STORE_AUDIO, STORE_RESULTS], 'readwrite');
    
    // Delete from all stores
    transaction.objectStore(STORE_SESSIONS).delete(sessionId);
    transaction.objectStore(STORE_AUDIO).delete(sessionId);
    transaction.objectStore(STORE_RESULTS).delete(sessionId);

    transaction.oncomplete = () => {
      // Clear UI state if it's for this session
      const uiState = getUIState();
      if (uiState?.sessionId === sessionId) {
        clearUIState();
      }
      // Clear current session if it's this one
      const currentId = localStorage.getItem(CURRENT_SESSION_KEY);
      if (currentId === sessionId) {
        localStorage.removeItem(CURRENT_SESSION_KEY);
      }
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

// ============================================================================
// Audio Data (IndexedDB)
// ============================================================================

export async function saveAudioData(data: PersistedAudioData): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_AUDIO], 'readwrite');
    const store = transaction.objectStore(STORE_AUDIO);
    const request = store.put(data);

    request.onsuccess = () => {
      updateSession(data.sessionId);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAudioData(sessionId: string): Promise<PersistedAudioData | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_AUDIO], 'readonly');
    const store = transaction.objectStore(STORE_AUDIO);
    const request = store.get(sessionId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Processing Results (IndexedDB)
// ============================================================================

export async function saveProcessingResult(data: PersistedProcessingResult): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RESULTS], 'readwrite');
    const store = transaction.objectStore(STORE_RESULTS);
    const request = store.put(data);

    request.onsuccess = () => {
      updateSession(data.sessionId);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getProcessingResult(sessionId: string): Promise<PersistedProcessingResult | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RESULTS], 'readonly');
    const store = transaction.objectStore(STORE_RESULTS);
    const request = store.get(sessionId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// UI State (localStorage - smaller, synchronous access)
// ============================================================================

export function saveUIState(state: PersistedUIState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
}

export function getUIState(): PersistedUIState | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(UI_STATE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearUIState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(UI_STATE_KEY);
}

// ============================================================================
// Full State Operations
// ============================================================================

export async function loadFullState(sessionId: string): Promise<FullPersistedState | null> {
  try {
    const session = await getSession(sessionId);
    if (!session) return null;

    const [audio, result] = await Promise.all([
      getAudioData(sessionId),
      getProcessingResult(sessionId),
    ]);

    const uiState = getUIState();
    const matchingUIState = uiState?.sessionId === sessionId ? uiState : null;

    return {
      session,
      audio,
      result,
      uiState: matchingUIState,
    };
  } catch (error) {
    console.error('Failed to load persisted state:', error);
    return null;
  }
}

export async function saveFullState(
  sessionId: string,
  audioBlob: Blob | null,
  inputMethod: AudioInputMethod | null,
  phonemes: PhonemeData[] | null,
  waveformData: WaveformData | null,
  duration: number | null,
  processingTime: number | null,
  extendedShapes: string,
  isCharacterFloating: boolean,
  editablePhonemes: PhonemeData[] | null
): Promise<void> {
  try {
    // Save audio data if available
    if (audioBlob && inputMethod) {
      await saveAudioData({
        sessionId,
        audioBlob,
        audioMimeType: audioBlob.type,
        inputMethod,
      });
    }

    // Save processing result if available
    if (phonemes && waveformData && duration !== null && processingTime !== null) {
      await saveProcessingResult({
        sessionId,
        phonemes,
        waveformData,
        duration,
        processingTime,
      });
    }

    // Save UI state
    saveUIState({
      sessionId,
      extendedShapes,
      isCharacterFloating,
      editablePhonemes,
    });
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

// ============================================================================
// Cleanup utilities
// ============================================================================

export async function clearAllData(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SESSIONS, STORE_AUDIO, STORE_RESULTS], 'readwrite');
    
    transaction.objectStore(STORE_SESSIONS).clear();
    transaction.objectStore(STORE_AUDIO).clear();
    transaction.objectStore(STORE_RESULTS).clear();

    transaction.oncomplete = () => {
      localStorage.removeItem(CURRENT_SESSION_KEY);
      clearUIState();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  } catch {
    return null;
  }
}
