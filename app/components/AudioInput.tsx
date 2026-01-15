"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Mic, 
  Upload, 
  FileAudio, 
  Play, 
  Square, 
  Pause, 
  Trash2,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { AudioInputMethod, ExampleAudio } from '@/app/lib/types';
import { AudioRecorder as AudioRecorderClass, formatTime } from '@/app/lib/audio-utils';
import { SUPPORTED_AUDIO_FORMATS, RECORDING } from '@/app/lib/constants';

interface AudioInputProps {
  onAudioReady: (blob: Blob, method: AudioInputMethod, filename?: string) => void;
  isProcessing: boolean;
  exampleFiles: ExampleAudio[];
  disabled?: boolean;
}

type InputTab = 'record' | 'upload' | 'examples';

export function AudioInput({ onAudioReady, isProcessing, exampleFiles, disabled = false }: AudioInputProps) {
  const [activeTab, setActiveTab] = useState<InputTab>('record');
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  // Upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Example state
  const [loadingExample, setLoadingExample] = useState<string | null>(null);
  
  // Refs
  const recorderRef = useRef<AudioRecorderClass | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current) recorderRef.current.cancelRecording();
    };
  }, []);

  // ============================================================================
  // Recording Functions
  // ============================================================================
  
  const startRecording = async () => {
    try {
      setRecordingError(null);
      recorderRef.current = new AudioRecorderClass();
      await recorderRef.current.startRecording();
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        if (recorderRef.current) {
          setRecordingDuration(recorderRef.current.getDuration());
        }
      }, RECORDING.TIMER_INTERVAL_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setRecordingError(message);
    }
  };

  const pauseRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.pauseRecording();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.resumeRecording();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        if (recorderRef.current) {
          setRecordingDuration(recorderRef.current.getDuration());
        }
      }, RECORDING.TIMER_INTERVAL_MS);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    
    try {
      const audioBlob = await recorderRef.current.stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      
      setIsRecording(false);
      setIsPaused(false);
      
      onAudioReady(audioBlob, 'recording');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop recording';
      setRecordingError(message);
    }
  };

  const discardRecording = () => {
    if (recorderRef.current) recorderRef.current.cancelRecording();
    if (timerRef.current) clearInterval(timerRef.current);
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingDuration(0);
    setRecordingError(null);
  };

  // ============================================================================
  // File Upload Functions
  // ============================================================================
  
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!SUPPORTED_AUDIO_FORMATS.some(format => file.type.startsWith(format.split('/')[0]))) {
      return 'Please upload an audio file (MP3, WAV, OGG, etc.)';
    }
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return 'File is too large. Maximum size is 50MB.';
    }
    
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    
    setUploadError(null);
    setUploadedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const processUploadedFile = async () => {
    if (!uploadedFile) return;
    onAudioReady(uploadedFile, 'upload', uploadedFile.name);
    setUploadedFile(null);
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ============================================================================
  // Example File Functions
  // ============================================================================
  
  const loadExampleFile = async (example: ExampleAudio) => {
    setLoadingExample(example.id);
    
    try {
      const response = await fetch(`/examples/${example.filename}`);
      if (!response.ok) throw new Error('Failed to load example file');
      
      const blob = await response.blob();
      onAudioReady(blob, 'example', example.name);
    } catch (err) {
      console.error('Failed to load example:', err);
      setUploadError('Failed to load example file. Please try again.');
    } finally {
      setLoadingExample(null);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================
  
  const tabs: { id: InputTab; label: string; icon: React.ReactNode }[] = [
    { id: 'record', label: 'Record', icon: <Mic className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { id: 'examples', label: 'Examples', icon: <FileAudio className="w-4 h-4" /> },
  ];

  return (
    <div className="card-base overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-[#333333]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={isProcessing || isRecording || disabled}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3.5
              text-sm font-medium transition-all
              ${activeTab === tab.id 
                ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-b-2 border-[#8b5cf6]' 
                : 'text-[#6b6b6b] hover:text-[#a8a8a8] hover:bg-[#1e1e1e]'
              }
              ${(isProcessing || isRecording) && tab.id !== activeTab ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Recording Tab */}
        {activeTab === 'record' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-[#a8a8a8] text-sm">
                {isRecording 
                  ? (isPaused ? 'Recording paused' : 'Recording in progress...') 
                  : 'Click the button to start recording from your microphone'
                }
              </p>
            </div>

            {/* Duration Display */}
            {isRecording && (
              <div className="flex justify-center">
                <div className="bg-[#1e1e1e] rounded-xl px-6 py-4 flex items-center gap-4">
                  {!isPaused && (
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-record-pulse" />
                  )}
                  <span className="text-3xl font-mono font-bold text-[#8b5cf6]">
                    {formatTime(recordingDuration)}
                  </span>
                </div>
              </div>
            )}

            {/* Recording Error */}
            {recordingError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                <p className="text-sm text-red-400">{recordingError}</p>
              </div>
            )}

            {/* Recording Controls */}
            <div className="flex justify-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isProcessing || disabled}
                  className="btn-primary flex items-center gap-2 px-8"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </button>
              ) : (
                <>
                  {!isPaused ? (
                    <button onClick={pauseRecording} className="btn-secondary flex items-center gap-2">
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                  ) : (
                    <button onClick={resumeRecording} className="btn-secondary flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Resume
                    </button>
                  )}
                  
                  <button onClick={stopRecording} className="btn-primary flex items-center gap-2">
                    <Square className="w-4 h-4" />
                    Stop & Process
                  </button>
                  
                  <button 
                    onClick={discardRecording} 
                    className="btn-ghost flex items-center gap-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    Discard
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {!uploadedFile ? (
              <>
                {/* Drag & Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragOver 
                      ? 'border-[#8b5cf6] bg-[#8b5cf6]/10' 
                      : 'border-[#333333] hover:border-[#8b5cf6]/50 hover:bg-[#1e1e1e]'
                    }
                  `}
                >
                  <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragOver ? 'text-[#8b5cf6]' : 'text-[#6b6b6b]'}`} />
                  <p className="text-[#a8a8a8] mb-1">
                    {isDragOver ? 'Drop your audio file here' : 'Drag & drop an audio file here'}
                  </p>
                  <p className="text-sm text-[#6b6b6b]">
                    or <span className="text-[#8b5cf6]">click to browse</span>
                  </p>
                  <p className="text-xs text-[#4a4a4a] mt-3">
                    Supports MP3, WAV, OGG, WebM, M4A (max 50MB)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </>
            ) : (
              /* Selected File Preview */
              <div className="bg-[#1e1e1e] rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center">
                    <FileAudio className="w-6 h-6 text-[#8b5cf6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#f5f5f5] truncate">{uploadedFile.name}</p>
                    <p className="text-sm text-[#6b6b6b]">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={clearUploadedFile}
                      className="btn-ghost p-2 text-[#6b6b6b] hover:text-red-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={processUploadedFile}
                      disabled={isProcessing}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Process
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                <p className="text-sm text-red-400">{uploadError}</p>
              </div>
            )}
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-4">
            <p className="text-center text-[#a8a8a8] text-sm">
              Try with pre-recorded audio samples to see how it works
            </p>
            
            {exampleFiles.length > 0 ? (
              <div className="grid gap-3">
                {exampleFiles.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => loadExampleFile(example)}
                    disabled={isProcessing || loadingExample !== null}
                    className={`
                      w-full bg-[#1e1e1e] rounded-xl p-4 text-left
                      border border-[#333333] hover:border-[#8b5cf6]/50
                      transition-all duration-200 group
                      ${loadingExample === example.id ? 'opacity-75' : ''}
                      ${isProcessing || loadingExample !== null ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center group-hover:bg-[#8b5cf6]/30 transition-colors">
                        {loadingExample === example.id ? (
                          <Loader2 className="w-6 h-6 text-[#8b5cf6] animate-spin" />
                        ) : (
                          <Play className="w-6 h-6 text-[#8b5cf6]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#f5f5f5] group-hover:text-[#8b5cf6] transition-colors">
                          {example.name}
                        </p>
                        <p className="text-sm text-[#6b6b6b]">{example.description}</p>
                      </div>
                      <div className="text-sm text-[#6b6b6b] font-mono">
                        {formatTime(example.duration)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#6b6b6b]">
                <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No example files available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="border-t border-[#333333] bg-[#8b5cf6]/10 px-6 py-3">
          <div className="flex items-center justify-center gap-3 text-[#8b5cf6]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Processing audio...</span>
          </div>
        </div>
      )}
    </div>
  );
}

