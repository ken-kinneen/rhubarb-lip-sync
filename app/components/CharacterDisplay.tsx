"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { PhonemeData, MouthShape, MouthShapeConfig } from '@/app/lib/types';
import { loadMouthShapeConfig, getDefaultMouthShape } from '@/app/lib/mouth-shape-config';
import { loadCompositorConfig, CompositorConfig, compositeImages } from '@/app/lib/image-compositor';

interface CharacterDisplayProps {
  phonemes: PhonemeData[];
  currentTime: number;
  onPopOut?: () => void;
  isFloating?: boolean;
}

export function CharacterDisplay({ phonemes, currentTime, onPopOut, isFloating = false }: CharacterDisplayProps) {
  const [mouthShapeConfig, setMouthShapeConfig] = useState<Record<MouthShape, MouthShapeConfig>>({} as Record<MouthShape, MouthShapeConfig>);
  const [defaultShape, setDefaultShape] = useState<MouthShape>('X');
  const [compositorConfig, setCompositorConfig] = useState<CompositorConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [compositedImage, setCompositedImage] = useState<string | null>(null);
  const lastShapeRef = React.useRef<MouthShape | null>(null);
  
  // Load mouth shape configuration
  useEffect(() => {
    const loadConfig = () => {
      const mouthConfig = loadMouthShapeConfig();
      const defaultMouth = getDefaultMouthShape();
      const compConfig = loadCompositorConfig();
      
      console.log('[CharacterDisplay] Loading config:', {
        compositorEnabled: compConfig?.enabled,
        hasBaseImage: !!compConfig?.baseImageUrl,
        baseImageLength: compConfig?.baseImageUrl?.length,
        mouthPosition: compConfig?.mouthPosition,
      });
      
      setMouthShapeConfig(mouthConfig);
      setDefaultShape(defaultMouth);
      setCompositorConfig(compConfig);
      setConfigLoaded(true);
      // Reset composited image to force regeneration with new config
      setCompositedImage(null);
      lastShapeRef.current = null;
    };

    // Load on mount
    loadConfig();

    // Listen for config changes from Settings
    const handleConfigChange = () => {
      console.log('[CharacterDisplay] Config change event received');
      loadConfig();
    };

    window.addEventListener('mouthShapeConfigChanged', handleConfigChange);
    window.addEventListener('compositorConfigChanged', handleConfigChange);

    return () => {
      window.removeEventListener('mouthShapeConfigChanged', handleConfigChange);
      window.removeEventListener('compositorConfigChanged', handleConfigChange);
    };
  }, []);
  
  // Find current phoneme based on playback time
  const currentPhoneme = useMemo(() => {
    if (phonemes.length === 0) return null;
    return phonemes.find(p => currentTime >= p.start && currentTime < p.end);
  }, [phonemes, currentTime]);

  // Use the configurable default shape when no phoneme is active
  const currentShape = currentPhoneme?.value || defaultShape;
  const config = mouthShapeConfig[currentShape];
  const shapeInfo = config?.info;

  // Handle compositor mode - composite mouth onto base image
  // This useEffect must be called unconditionally (before any returns)
  useEffect(() => {
    // Don't run until config is loaded
    if (!configLoaded) {
      console.log('[CharacterDisplay] Compositor useEffect: waiting for config to load');
      return;
    }

    console.log('[CharacterDisplay] Compositor useEffect:', {
      configLoaded,
      enabled: compositorConfig?.enabled,
      hasBaseImage: !!compositorConfig?.baseImageUrl,
      currentShape,
      hasMouthUrl: !!config?.images?.mouthUrl,
    });

    if (!compositorConfig?.enabled || !compositorConfig.baseImageUrl) {
      console.log('[CharacterDisplay] Compositor disabled or no base image');
      setCompositedImage(null);
      return;
    }

    // Only recomposite if shape changed
    if (lastShapeRef.current === currentShape && compositedImage) {
      console.log('[CharacterDisplay] Shape unchanged, skipping recomposite');
      return;
    }
    lastShapeRef.current = currentShape;

    const mouthUrl = config?.images?.mouthUrl;
    if (!mouthUrl) {
      console.log('[CharacterDisplay] No mouth URL for shape:', currentShape);
      setCompositedImage(null);
      return;
    }

    console.log('[CharacterDisplay] Compositing images for shape:', currentShape);
    compositeImages(compositorConfig.baseImageUrl, mouthUrl, compositorConfig.mouthPosition)
      .then((result) => {
        console.log('[CharacterDisplay] Composite successful, result length:', result?.length);
        setCompositedImage(result);
      })
      .catch((err) => {
        console.error('[CharacterDisplay] Composite failed:', err);
        setCompositedImage(null);
      });
  }, [configLoaded, compositorConfig, currentShape, config?.images?.mouthUrl, compositedImage]);

  // Early return if no data to display
  if (phonemes.length === 0 || !mouthShapeConfig || Object.keys(mouthShapeConfig).length === 0) {
    return null;
  }

  if (!shapeInfo) {
    return null;
  }

  return (
    <div className="card-base overflow-hidden h-full flex flex-col">
      {/* Header - matches Load Media and Shape Editor */}
      <div className="px-4 py-3 border-b border-[#333333] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider">Player</h3>
        {onPopOut && !isFloating && (
          <button
            onClick={onPopOut}
            className="flex items-center gap-1 text-[#6b6b6b] hover:text-[#a8a8a8] transition-colors"
            title="Pop out to floating window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="text-xs">Pop Out</span>
          </button>
        )}
      </div>

      {/* Character display */}
      <div className="p-3 flex-1 flex items-center justify-center">
        <div className="relative pb-8">
          <div 
            className="rounded-xl overflow-hidden border-4 transition-all duration-100 shadow-xl"
            style={{ 
              borderColor: shapeInfo.color,
              boxShadow: `0 0 30px ${shapeInfo.color}30`,
            }}
          >
            {/* Use composited image if compositor is enabled, otherwise use character image */}
            {compositorConfig?.enabled && compositedImage ? (
              <img
                src={compositedImage}
                alt={`Character with mouth shape ${currentShape}`}
                className="bg-white object-contain w-[380px] h-[380px]"
              />
            ) : config?.images?.characterUrl ? (
              <img
                src={config.images.characterUrl}
                alt={`Character with mouth shape ${currentShape}`}
                className="bg-white object-contain w-[380px] h-[380px]"
              />
            ) : (
              <div className="w-[380px] h-[380px] bg-[#1a1a1a] flex items-center justify-center text-6xl font-bold text-[#6b6b6b]">
                {currentShape}
              </div>
            )}
          </div>

          {/* Shape indicator badge */}
          <div 
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-full shadow-lg border-2 flex items-center gap-2"
            style={{ 
              backgroundColor: '#1e1e1e',
              borderColor: shapeInfo.color,
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-base font-bold"
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
