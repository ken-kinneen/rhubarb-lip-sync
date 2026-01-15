"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import { PhonemeData, MOUTH_SHAPE_INFO, MouthShape } from '@/app/lib/types';
import { MouthShapeSVG } from './MouthShapeSVG';

interface MouthShapeDisplayProps {
  phonemes: PhonemeData[];
  currentTime: number;
  duration: number;
}

export function MouthShapeDisplay({ phonemes, currentTime }: MouthShapeDisplayProps) {
  // Find current phoneme based on playback time
  const currentPhoneme = useMemo(() => {
    if (phonemes.length === 0) return null;
    return phonemes.find(p => currentTime >= p.start && currentTime < p.end) || phonemes[0];
  }, [phonemes, currentTime]);

  if (phonemes.length === 0) {
    return null;
  }

  const currentShape = currentPhoneme?.value || 'X';
  const shapeInfo = MOUTH_SHAPE_INFO[currentShape];

  return (
    <div className="card-base overflow-hidden h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#333333]">
        <h2 className="text-lg font-semibold text-[#f5f5f5]">Current Shape</h2>
      </div>

      {/* Large mouth shape display */}
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-6">
          {/* Official Rhubarb mouth shape image */}
          <div className="mb-4 relative">
            <div 
              className="rounded-2xl overflow-hidden border-4 transition-all duration-100 shadow-2xl"
              style={{ 
                borderColor: shapeInfo.color,
                boxShadow: `0 0 40px ${shapeInfo.color}40`,
              }}
            >
              <Image
                src={`/mouth-shapes/lisa-${currentShape}.png`}
                alt={`Mouth shape ${currentShape}: ${shapeInfo.name}`}
                width={200}
                height={200}
                className="bg-white"
                priority
              />
            </div>
          </div>

          {/* Letter badge */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold transition-all duration-100 shadow-lg"
            style={{ 
              backgroundColor: `${shapeInfo.color}20`,
              color: shapeInfo.color,
              border: `3px solid ${shapeInfo.color}`,
              boxShadow: `0 0 20px ${shapeInfo.color}30`,
            }}
          >
            {currentShape}
          </div>
          
          <div className="mt-4 text-center">
            <div className="text-xl font-semibold text-[#f5f5f5]">
              {shapeInfo.name}
            </div>
            <div className="text-sm text-[#6b6b6b] mt-1">
              {shapeInfo.description}
            </div>
          </div>
        </div>

        {/* Current phoneme timing */}
        {currentPhoneme && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-[#1e1e1e] rounded-xl mt-4">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#6b6b6b] mb-1">Start</div>
              <div className="text-sm font-mono text-[#8b5cf6]">
                {currentPhoneme.start.toFixed(2)}s
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#6b6b6b] mb-1">End</div>
              <div className="text-sm font-mono text-[#8b5cf6]">
                {currentPhoneme.end.toFixed(2)}s
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#6b6b6b] mb-1">Length</div>
              <div className="text-sm font-mono text-[#8b5cf6]">
                {((currentPhoneme.end - currentPhoneme.start) * 1000).toFixed(0)}ms
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All shapes grid */}
      <div className="px-6 py-4 border-t border-[#333333] bg-[#1a1a1a]">
        <div className="text-[10px] uppercase tracking-wider text-[#6b6b6b] mb-3">
          All Shapes
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(MOUTH_SHAPE_INFO) as MouthShape[]).map((shape) => {
            const info = MOUTH_SHAPE_INFO[shape];
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
                  <Image
                    src={`/mouth-shapes/lisa-${shape}.png`}
                    alt={`Shape ${shape}`}
                    width={50}
                    height={50}
                    className="bg-white"
                  />
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
