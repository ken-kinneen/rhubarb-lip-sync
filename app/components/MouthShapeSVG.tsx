"use client";

import React from 'react';
import { MouthShape } from '@/app/lib/types';

interface MouthShapeSVGProps {
  shape: MouthShape;
  size?: number;
  color?: string;
}

/**
 * SVG representations of Rhubarb mouth shapes
 * Based on the official Rhubarb Lip Sync documentation
 */
export function MouthShapeSVG({ shape, size = 120, color = '#8b5cf6' }: MouthShapeSVGProps) {
  const viewBox = "0 0 100 100";
  
  const renderMouth = () => {
    switch (shape) {
      case 'A': // Rest - closed mouth
        return (
          <>
            <ellipse cx="50" cy="70" rx="20" ry="3" fill={color} />
          </>
        );
      
      case 'B': // M/B/P - lips together
        return (
          <>
            <ellipse cx="50" cy="68" rx="22" ry="4" fill={color} />
            <ellipse cx="50" cy="72" rx="22" ry="4" fill={color} />
          </>
        );
      
      case 'C': // T/D/S - mouth slightly open
        return (
          <>
            <ellipse cx="50" cy="70" rx="18" ry="8" fill="none" stroke={color} strokeWidth="3" />
            <rect x="45" y="66" width="10" height="3" fill={color} opacity="0.6" />
          </>
        );
      
      case 'D': // Ah - mouth open (vowels)
        return (
          <>
            <ellipse cx="50" cy="70" rx="20" ry="15" fill="none" stroke={color} strokeWidth="3" />
            <ellipse cx="50" cy="70" rx="15" ry="10" fill={color} opacity="0.2" />
          </>
        );
      
      case 'E': // Ee - narrow opening
        return (
          <>
            <ellipse cx="50" cy="70" rx="25" ry="6" fill="none" stroke={color} strokeWidth="3" />
            <rect x="40" y="67" width="20" height="2" fill={color} opacity="0.6" />
          </>
        );
      
      case 'F': // F/V - teeth on lower lip
        return (
          <>
            <ellipse cx="50" cy="72" rx="20" ry="5" fill={color} opacity="0.3" />
            <rect x="40" y="64" width="20" height="3" fill={color} />
            <path d="M 40 67 Q 50 72 60 67" fill="none" stroke={color} strokeWidth="3" />
          </>
        );
      
      case 'G': // G/K - back of tongue
        return (
          <>
            <ellipse cx="50" cy="70" rx="18" ry="10" fill="none" stroke={color} strokeWidth="3" />
            <path d="M 45 70 Q 50 75 55 70" fill={color} opacity="0.4" />
          </>
        );
      
      case 'H': // Wide - wide open mouth
        return (
          <>
            <ellipse cx="50" cy="70" rx="25" ry="18" fill="none" stroke={color} strokeWidth="3" />
            <ellipse cx="50" cy="70" rx="20" ry="13" fill={color} opacity="0.2" />
            <ellipse cx="50" cy="60" rx="8" ry="3" fill={color} opacity="0.4" />
          </>
        );
      
      case 'X': // Silence - closed
        return (
          <>
            <line x1="35" y1="70" x2="65" y2="70" stroke={color} strokeWidth="3" strokeLinecap="round" />
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={viewBox}
      className="mouth-shape-svg"
    >
      {/* Face outline */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        opacity="0.2"
      />
      
      {/* Eyes */}
      <circle cx="35" cy="40" r="3" fill={color} opacity="0.4" />
      <circle cx="65" cy="40" r="3" fill={color} opacity="0.4" />
      
      {/* Mouth */}
      {renderMouth()}
    </svg>
  );
}



