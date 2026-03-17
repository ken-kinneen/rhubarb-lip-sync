"use client";

import React, { useCallback } from 'react';
import { MouthShape, MOUTH_SHAPE_INFO } from '@/app/lib/types';

interface ShapePaletteProps {
    onShapeDragStart?: (shape: MouthShape) => void;
    onShapeDragEnd?: () => void;
    onShapeClick?: (shape: MouthShape) => void;
    selectedShape?: MouthShape | null;
    compact?: boolean;
}

const ALL_SHAPES: MouthShape[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'];

export function ShapePalette({ 
    onShapeDragStart, 
    onShapeDragEnd, 
    onShapeClick,
    selectedShape,
    compact = false 
}: ShapePaletteProps) {
    const handleDragStart = useCallback((e: React.DragEvent, shape: MouthShape) => {
        e.dataTransfer.setData('application/x-mouth-shape', shape);
        e.dataTransfer.effectAllowed = 'copy';
        
        // Create a custom drag image
        const dragImage = document.createElement('div');
        dragImage.className = 'fixed pointer-events-none';
        dragImage.style.cssText = `
            width: 48px;
            height: 48px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: monospace;
            font-weight: bold;
            font-size: 20px;
            color: white;
            background-color: ${MOUTH_SHAPE_INFO[shape].color};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        dragImage.textContent = shape;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 24, 24);
        
        // Clean up the drag image after a short delay
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);
        
        onShapeDragStart?.(shape);
    }, [onShapeDragStart]);

    const handleDragEnd = useCallback(() => {
        onShapeDragEnd?.();
    }, [onShapeDragEnd]);

    const handleClick = useCallback((shape: MouthShape) => {
        onShapeClick?.(shape);
    }, [onShapeClick]);

    if (compact) {
        return (
            <div className="flex gap-1 flex-wrap">
                {ALL_SHAPES.map((shape) => {
                    const info = MOUTH_SHAPE_INFO[shape];
                    const isSelected = selectedShape === shape;
                    
                    return (
                        <button
                            key={shape}
                            draggable
                            onDragStart={(e) => handleDragStart(e, shape)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleClick(shape)}
                            className={`
                                w-8 h-8 rounded flex items-center justify-center
                                font-mono font-bold text-sm text-white
                                transition-all cursor-grab active:cursor-grabbing
                                hover:scale-110 hover:shadow-lg
                                ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[#1a1a1a]' : ''}
                            `}
                            style={{ backgroundColor: info.color }}
                            title={`${shape}: ${info.name} - Drag to insert`}
                        >
                            {shape}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="card-base overflow-hidden">
            <div className="px-4 py-3 border-b border-[#333333]">
                <h3 className="text-sm font-semibold text-[#f5f5f5]">Shape Palette</h3>
                <p className="text-xs text-[#6b6b6b] mt-1">Drag shapes to timeline to insert</p>
            </div>
            
            <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                    {ALL_SHAPES.map((shape) => {
                        const info = MOUTH_SHAPE_INFO[shape];
                        const isSelected = selectedShape === shape;
                        
                        return (
                            <button
                                key={shape}
                                draggable
                                onDragStart={(e) => handleDragStart(e, shape)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleClick(shape)}
                                className={`
                                    flex flex-col items-center gap-1 p-2 rounded-lg
                                    transition-all cursor-grab active:cursor-grabbing
                                    hover:scale-105 hover:shadow-lg
                                    ${isSelected 
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]' 
                                        : 'hover:ring-1 hover:ring-white/30'
                                    }
                                `}
                                style={{ backgroundColor: `${info.color}20` }}
                                title={`${shape}: ${info.name} - Drag to insert`}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-lg text-white shadow-md"
                                    style={{ backgroundColor: info.color }}
                                >
                                    {shape}
                                </div>
                                <span className="text-[10px] text-[#a8a8a8] truncate w-full text-center">
                                    {info.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className="px-4 py-2 bg-[#1a1a1a] border-t border-[#333333]">
                <p className="text-[10px] text-[#6b6b6b] text-center">
                    Tip: Click to select, drag to insert at playhead
                </p>
            </div>
        </div>
    );
}
