"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { PhonemeData, MouthShape, MouthShapeConfig } from '@/app/lib/types';
import { loadMouthShapeConfig, getDefaultMouthShape } from '@/app/lib/mouth-shape-config';

interface MouthShapeDisplayProps {
  phonemes: PhonemeData[];
  currentTime: number;
  duration: number;
}

export function MouthShapeDisplay({ phonemes, currentTime }: MouthShapeDisplayProps) {
  const [mouthShapeConfig, setMouthShapeConfig] = useState<Record<MouthShape, MouthShapeConfig>>({} as Record<MouthShape, MouthShapeConfig>);
  const [defaultShape, setDefaultShape] = useState<MouthShape>('X');
  
  // Load mouth shape configuration
  useEffect(() => {
    const loadConfig = () => {
      setMouthShapeConfig(loadMouthShapeConfig());
      setDefaultShape(getDefaultMouthShape());
    };

    // Load on mount
    loadConfig();

    // Listen for config changes from Settings
    window.addEventListener('mouthShapeConfigChanged', loadConfig);

    return () => {
      window.removeEventListener('mouthShapeConfigChanged', loadConfig);
    };
  }, []);
  
  // Find current phoneme based on playback time
  const currentPhoneme = useMemo(() => {
    if (phonemes.length === 0) return null;
    return phonemes.find(p => currentTime >= p.start && currentTime < p.end);
  }, [phonemes, currentTime]);

  if (phonemes.length === 0 || !mouthShapeConfig || Object.keys(mouthShapeConfig).length === 0) {
    return null;
  }

  // Use the configurable default shape when no phoneme is active
  const currentShape = currentPhoneme?.value || defaultShape;
  const config = mouthShapeConfig[currentShape];
  const shapeInfo = config?.info;

  if (!shapeInfo) {
    return null;
  }

  return (
    <div className="card-base overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#333333]">
        <h2 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider">Shape Editor</h2>
      </div>

      {/* Current shape - Horizontal compact layout */}
      <div className="p-4 border-b border-[#333333]">
        <div className="flex items-center gap-4">
          {/* Mouth image */}
          <div 
            className="rounded-xl overflow-hidden border-3 transition-all duration-100 shadow-lg flex-shrink-0"
            style={{ 
              borderColor: shapeInfo.color,
              boxShadow: `0 0 20px ${shapeInfo.color}30`,
            }}
          >
            {config?.images?.mouthUrl ? (
              <img
                src={config.images.mouthUrl}
                alt={`Mouth shape ${currentShape}: ${shapeInfo.name}`}
                className="bg-white object-contain w-[80px] h-[80px]"
              />
            ) : (
              <div className="w-[80px] h-[80px] bg-[#1a1a1a] flex items-center justify-center text-2xl font-bold text-[#6b6b6b]">
                {currentShape}
              </div>
            )}
          </div>

          {/* Shape info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ 
                  backgroundColor: `${shapeInfo.color}20`,
                  color: shapeInfo.color,
                  border: `2px solid ${shapeInfo.color}`,
                }}
              >
                {currentShape}
              </div>
              <div className="text-base font-semibold text-[#f5f5f5]">
                {shapeInfo.name}
              </div>
            </div>
            <div className="text-xs text-[#6b6b6b] mb-2">
              {shapeInfo.description}
            </div>
            
            {/* Timing info - inline */}
            {currentPhoneme && (
              <div className="flex items-center gap-4 text-xs">
                <span className="text-[#6b6b6b]">
                  <span className="text-[#8b5cf6] font-mono">{currentPhoneme.start.toFixed(2)}s</span> → <span className="text-[#8b5cf6] font-mono">{currentPhoneme.end.toFixed(2)}s</span>
                </span>
                <span className="text-[#6b6b6b]">
                  (<span className="text-[#8b5cf6] font-mono">{((currentPhoneme.end - currentPhoneme.start) * 1000).toFixed(0)}ms</span>)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All shapes grid */}
      <div className="p-4 bg-[#1a1a1a]">
        <div className="text-[10px] uppercase tracking-wider text-[#6b6b6b] mb-3">
          All Shapes
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(mouthShapeConfig) as MouthShape[]).map((shape) => {
            const shapeConfig = mouthShapeConfig[shape];
            if (!shapeConfig) return null;
            
            const info = shapeConfig.info;
            const isActive = shape === currentShape;
            
            return (
              <div
                key={shape}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-100 cursor-pointer hover:bg-[#2a2a2a]
                  ${isActive 
                    ? 'bg-[#8b5cf6]/15 ring-2 ring-[#8b5cf6]/50' 
                    : 'bg-[#242424]'
                  }
                `}
              >
                <div 
                  className="rounded-lg overflow-hidden border-2"
                  style={{ 
                    borderColor: isActive ? info.color : 'transparent',
                  }}
                >
                  {shapeConfig.images?.mouthUrl ? (
                    <img
                      src={shapeConfig.images.mouthUrl}
                      alt={`Shape ${shape}`}
                      className="bg-white object-contain w-[50px] h-[50px]"
                    />
                  ) : (
                    <div className="w-[50px] h-[50px] bg-[#1a1a1a] flex items-center justify-center text-lg font-bold text-[#6b6b6b]">
                      {shape}
                    </div>
                  )}
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: isActive ? `${info.color}30` : `${info.color}15`,
                    color: info.color,
                  }}
                >
                  {shape}
                </div>
                <span className={`text-[10px] truncate text-center ${isActive ? 'text-[#f5f5f5]' : 'text-[#6b6b6b]'}`}>
                  {info.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
