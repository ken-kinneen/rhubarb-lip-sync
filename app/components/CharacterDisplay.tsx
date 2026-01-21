"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { PhonemeData, MouthShape, MouthShapeConfig } from '@/app/lib/types';
import { loadMouthShapeConfig } from '@/app/lib/mouth-shape-config';

interface CharacterDisplayProps {
  phonemes: PhonemeData[];
  currentTime: number;
}

export function CharacterDisplay({ phonemes, currentTime }: CharacterDisplayProps) {
  const [mouthShapeConfig, setMouthShapeConfig] = useState<Record<MouthShape, MouthShapeConfig>>({} as Record<MouthShape, MouthShapeConfig>);
  
  // Load mouth shape configuration
  useEffect(() => {
    setMouthShapeConfig(loadMouthShapeConfig());
  }, []);
  
  // Find current phoneme based on playback time
  const currentPhoneme = useMemo(() => {
    if (phonemes.length === 0) return null;
    return phonemes.find(p => currentTime >= p.start && currentTime < p.end) || phonemes[0];
  }, [phonemes, currentTime]);

  if (phonemes.length === 0 || !mouthShapeConfig || Object.keys(mouthShapeConfig).length === 0) {
    return null;
  }

  const currentShape = currentPhoneme?.value || 'X';
  const config = mouthShapeConfig[currentShape];
  const shapeInfo = config?.info;

  if (!shapeInfo) {
    return null;
  }

  return (
    <div className="card-base overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#333333]">
        <h2 className="text-lg font-semibold text-[#f5f5f5]">Character Animation</h2>
      </div>

      {/* Large character display */}
      <div className="p-6 flex items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#1e1e1e]">
        <div className="relative">
          <div 
            className="rounded-2xl overflow-hidden border-4 transition-all duration-100 shadow-2xl"
            style={{ 
              borderColor: shapeInfo.color,
              boxShadow: `0 0 40px ${shapeInfo.color}40`,
            }}
          >
            {config?.images?.characterUrl ? (
              <img
                src={config.images.characterUrl}
                alt={`Character with mouth shape ${currentShape}`}
                className="bg-white object-contain"
                style={{ 
                  width: '400px',
                  height: '400px',
                  maxWidth: '100%',
                }}
              />
            ) : (
              <div className="w-[400px] h-[400px] bg-[#1a1a1a] flex items-center justify-center text-6xl font-bold text-[#6b6b6b]">
                {currentShape}
              </div>
            )}
          </div>

          {/* Shape indicator badge */}
          <div 
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg border-2 flex items-center gap-2"
            style={{ 
              backgroundColor: '#1e1e1e',
              borderColor: shapeInfo.color,
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ 
                backgroundColor: `${shapeInfo.color}30`,
                color: shapeInfo.color,
              }}
            >
              {currentShape}
            </div>
            <span className="text-sm font-medium text-[#f5f5f5]">
              {shapeInfo.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
