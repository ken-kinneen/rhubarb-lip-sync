"use client";

import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Minimize2, Maximize2, Move } from 'lucide-react';

interface Position {
    x: number;
    y: number;
}

interface Size {
    width: number;
    height: number;
}

interface FloatingWindowProps {
    children: ReactNode;
    title?: string;
    isOpen: boolean;
    onClose: () => void;
    defaultPosition?: Position;
    defaultSize?: Size;
    minWidth?: number;
    minHeight?: number;
    storageKey?: string;
}

const STORAGE_PREFIX = 'rhubarbLipSync_floatingWindow_';

export function FloatingWindow({
    children,
    title = 'Preview',
    isOpen,
    onClose,
    defaultPosition = { x: 100, y: 100 },
    defaultSize = { width: 450, height: 500 },
    minWidth = 200,
    minHeight = 200,
    storageKey = 'default',
}: FloatingWindowProps) {
    const [position, setPosition] = useState<Position>(defaultPosition);
    const [size, setSize] = useState<Size>(defaultSize);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    const windowRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
    const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

    // Load saved position/size from localStorage
    useEffect(() => {
        setMounted(true);
        
        if (typeof window === 'undefined') return;

        try {
            const savedPosition = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}_position`);
            const savedSize = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}_size`);
            
            if (savedPosition) {
                const parsed = JSON.parse(savedPosition);
                // Ensure window is within viewport
                const maxX = window.innerWidth - 100;
                const maxY = window.innerHeight - 100;
                setPosition({
                    x: Math.min(Math.max(0, parsed.x), maxX),
                    y: Math.min(Math.max(0, parsed.y), maxY),
                });
            }
            
            if (savedSize) {
                setSize(JSON.parse(savedSize));
            }
        } catch (error) {
            console.error('Failed to load floating window state:', error);
        }
    }, [storageKey]);

    // Save position/size to localStorage
    useEffect(() => {
        if (typeof window === 'undefined' || !mounted) return;

        try {
            localStorage.setItem(`${STORAGE_PREFIX}${storageKey}_position`, JSON.stringify(position));
            localStorage.setItem(`${STORAGE_PREFIX}${storageKey}_size`, JSON.stringify(size));
        } catch (error) {
            console.error('Failed to save floating window state:', error);
        }
    }, [position, size, storageKey, mounted]);

    // Handle drag start
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            posX: position.x,
            posY: position.y,
        };
    }, [position]);

    // Handle resize start
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
        };
    }, [size]);

    // Handle mouse move for drag/resize
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && dragStartRef.current) {
                const deltaX = e.clientX - dragStartRef.current.x;
                const deltaY = e.clientY - dragStartRef.current.y;
                
                // Keep window within viewport bounds
                const maxX = window.innerWidth - 100;
                const maxY = window.innerHeight - 50;
                
                setPosition({
                    x: Math.min(Math.max(0, dragStartRef.current.posX + deltaX), maxX),
                    y: Math.min(Math.max(0, dragStartRef.current.posY + deltaY), maxY),
                });
            }
            
            if (isResizing && resizeStartRef.current) {
                const deltaX = e.clientX - resizeStartRef.current.x;
                const deltaY = e.clientY - resizeStartRef.current.y;
                
                setSize({
                    width: Math.max(minWidth, resizeStartRef.current.width + deltaX),
                    height: Math.max(minHeight, resizeStartRef.current.height + deltaY),
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            dragStartRef.current = null;
            resizeStartRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, minWidth, minHeight]);

    // Toggle minimize
    const toggleMinimize = useCallback(() => {
        setIsMinimized(prev => !prev);
    }, []);

    if (!isOpen || !mounted) return null;

    const windowContent = (
        <div
            ref={windowRef}
            className={`
                fixed z-50 bg-[#1e1e1e] border border-[#333333] rounded-xl shadow-2xl
                overflow-hidden flex flex-col
                ${isDragging ? 'cursor-grabbing' : ''}
                ${isResizing ? 'cursor-se-resize' : ''}
            `}
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: isMinimized ? 'auto' : size.height,
            }}
        >
            {/* Title bar */}
            <div
                className={`
                    flex items-center justify-between px-4 py-3 border-b border-[#333333]
                    bg-[#242424] select-none
                    ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                `}
                onMouseDown={handleDragStart}
            >
                <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-[#6b6b6b]" />
                    <span className="text-sm font-semibold text-[#f5f5f5]">{title}</span>
                </div>
                
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleMinimize}
                        className="p-1.5 rounded hover:bg-[#333333] transition-colors"
                        title={isMinimized ? 'Restore' : 'Minimize'}
                    >
                        {isMinimized ? (
                            <Maximize2 className="w-4 h-4 text-[#a8a8a8]" />
                        ) : (
                            <Minimize2 className="w-4 h-4 text-[#a8a8a8]" />
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
                        title="Close (Dock)"
                    >
                        <X className="w-4 h-4 text-[#a8a8a8] hover:text-red-400" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            )}

            {/* Resize handle */}
            {!isMinimized && (
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    onMouseDown={handleResizeStart}
                >
                    <svg
                        className="w-full h-full text-[#4a4a4a]"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                    >
                        <path d="M14 14H10V10H14V14ZM14 8H12V6H14V8ZM8 14H6V12H8V14Z" />
                    </svg>
                </div>
            )}
        </div>
    );

    // Use portal to render at document body level
    return createPortal(windowContent, document.body);
}
