"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Settings as SettingsIcon, X, Info, Upload, RotateCcw } from "lucide-react";
import { MouthShape, MouthShapeConfig } from "@/app/lib/types";
import { loadMouthShapeConfig, updateMouthShapeImages, resetMouthShapeConfig } from "@/app/lib/mouth-shape-config";

interface SettingsProps {
    extendedShapes: string;
    onSettingsChange: (extendedShapes: string) => void;
    onClose: () => void;
}

const SHAPE_INFO = {
    G: {
        name: "F/V Sounds",
        description: 'Upper teeth touching lower lip for "F" and "V" sounds',
    },
    H: {
        name: "L Sounds",
        description: 'Tongue raised behind upper teeth for long "L" sounds',
    },
    X: {
        name: "Silence/Rest",
        description: "Idle position during pauses in speech",
    },
};

export function Settings({ extendedShapes, onSettingsChange, onClose }: SettingsProps) {
    const [localShapes, setLocalShapes] = useState({
        G: extendedShapes.includes("G"),
        H: extendedShapes.includes("H"),
        X: extendedShapes.includes("X"),
    });
    
    const [mouthShapeConfig, setMouthShapeConfig] = useState<Record<MouthShape, MouthShapeConfig>>({} as Record<MouthShape, MouthShapeConfig>);
    const [activeTab, setActiveTab] = useState<'phonemes' | 'images'>('phonemes');
    
    // Load mouth shape configuration on mount
    useEffect(() => {
        setMouthShapeConfig(loadMouthShapeConfig());
    }, []);

    const handleShapeToggle = (shape: "G" | "H" | "X") => {
        setLocalShapes((prev) => ({ ...prev, [shape]: !prev[shape] }));
    };

    const handleApply = () => {
        let shapes = "";
        if (localShapes.G) shapes += "G";
        if (localShapes.H) shapes += "H";
        if (localShapes.X) shapes += "X";
        onSettingsChange(shapes);
        onClose();
    };
    
    const handleUrlChange = (shape: MouthShape, type: 'mouth' | 'character', url: string) => {
        const updates = type === 'mouth' ? { mouthUrl: url } : { characterUrl: url };
        const updatedConfig = updateMouthShapeImages(shape, updates);
        setMouthShapeConfig(updatedConfig);
    };
    
    const handleResetConfig = () => {
        if (confirm('Reset all mouth shape images to defaults? This cannot be undone.')) {
            resetMouthShapeConfig();
            setMouthShapeConfig(loadMouthShapeConfig());
        }
    };

    return (
        <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
            <div className='bg-[#1e1e1e] border border-[#333333] rounded-xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]'>
                {/* Header */}
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#333333]'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center'>
                            <SettingsIcon className='w-5 h-5 text-[#8b5cf6]' />
                        </div>
                        <div>
                            <h2 className='text-xl font-semibold text-[#f5f5f5]'>Rhubarb Settings</h2>
                            <p className='text-xs text-[#6b6b6b]'>Configure phoneme detection and mouth shape images</p>
                        </div>
                    </div>
                    <button onClick={onClose} className='btn-ghost p-2' title='Close'>
                        <X className='w-5 h-5' />
                    </button>
                </div>

                {/* Tabs */}
                <div className='flex border-b border-[#333333]'>
                    <button
                        onClick={() => setActiveTab('phonemes')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'phonemes'
                                ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-[#8b5cf6]/5'
                                : 'text-[#6b6b6b] hover:text-[#f5f5f5] hover:bg-[#242424]'
                        }`}
                    >
                        Phoneme Detection
                    </button>
                    <button
                        onClick={() => setActiveTab('images')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'images'
                                ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-[#8b5cf6]/5'
                                : 'text-[#6b6b6b] hover:text-[#f5f5f5] hover:bg-[#242424]'
                        }`}
                    >
                        Mouth Shape Images
                    </button>
                </div>

                {/* Content */}
                <div className='p-6 space-y-6 overflow-y-auto flex-1'>
                    {activeTab === 'phonemes' && (
                        <>
                            {/* Extended Shapes */}
                            <div>
                                <div className='flex items-center gap-2 mb-4'>
                                    <h3 className='text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider'>Extended Mouth Shapes</h3>
                                    <div className='group relative'>
                                        <Info className='w-4 h-4 text-[#6b6b6b] cursor-help' />
                                        <div className='absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-[#242424] border border-[#333333] rounded-lg text-xs text-[#a8a8a8] z-10'>
                                            Extended shapes provide more detailed lip sync but require more mouth drawings in your animation.
                                        </div>
                                    </div>
                                </div>

                                <div className='space-y-3'>
                                    {(["G", "H", "X"] as const).map((shape) => {
                                        const config = mouthShapeConfig[shape];
                                        return (
                                            <label
                                                key={shape}
                                                className='flex items-center gap-4 p-4 bg-[#242424] rounded-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors'
                                            >
                                                <input
                                                    type='checkbox'
                                                    checked={localShapes[shape]}
                                                    onChange={() => handleShapeToggle(shape)}
                                                    className='w-5 h-5 rounded border-[#444444] text-[#8b5cf6] focus:ring-[#8b5cf6] bg-[#1a1a1a]'
                                                />
                                                <div className='flex-shrink-0 w-12 h-12 bg-[#1a1a1a] rounded-lg overflow-hidden'>
                                                    {config?.images?.characterUrl ? (
                                                        <img
                                                            src={config.images.characterUrl}
                                                            alt={`Mouth shape ${shape}`}
                                                            width={48}
                                                            height={48}
                                                            className='object-cover w-full h-full'
                                                        />
                                                    ) : (
                                                        <div className='w-full h-full flex items-center justify-center text-[#6b6b6b]'>
                                                            {shape}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className='flex-1'>
                                                    <div className='flex items-center gap-2'>
                                                        <span className='font-mono font-bold text-[#8b5cf6]'>{shape}</span>
                                                        <span className='font-medium text-[#f5f5f5]'>{SHAPE_INFO[shape].name}</span>
                                                    </div>
                                                    <p className='text-xs text-[#6b6b6b] mt-0.5'>{SHAPE_INFO[shape].description}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Basic shapes info */}
                            <div className='bg-[#1a1a1a] rounded-lg p-4 border border-[#333333]'>
                                <div className='text-xs text-[#6b6b6b] mb-3'>Basic shapes (A-F) are always included:</div>
                                <div className='flex gap-2 flex-wrap'>
                                    {(["A", "B", "C", "D", "E", "F"] as MouthShape[]).map((shape) => {
                                        const config = mouthShapeConfig[shape];
                                        return (
                                            <div key={shape} className='w-10 h-10 bg-[#242424] rounded-lg overflow-hidden'>
                                                {config?.images?.characterUrl ? (
                                                    <img
                                                        src={config.images.characterUrl}
                                                        alt={`Mouth shape ${shape}`}
                                                        width={40}
                                                        height={40}
                                                        className='object-cover w-full h-full'
                                                    />
                                                ) : (
                                                    <div className='w-full h-full flex items-center justify-center text-[#6b6b6b] text-xs'>
                                                        {shape}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'images' && (
                        <>
                            {/* Reset button */}
                            <div className='flex justify-end'>
                                <button
                                    onClick={handleResetConfig}
                                    className='btn-secondary flex items-center gap-2'
                                >
                                    <RotateCcw className='w-4 h-4' />
                                    Reset to Defaults
                                </button>
                            </div>

                            {/* Image configuration for all shapes */}
                            <div className='space-y-4'>
                                {(Object.keys(mouthShapeConfig) as MouthShape[]).map((shape) => {
                                    const config = mouthShapeConfig[shape];
                                    if (!config) return null;

                                    return (
                                        <div key={shape} className='bg-[#242424] rounded-lg p-4 border border-[#333333]'>
                                            <div className='flex items-center gap-3 mb-4'>
                                                <div
                                                    className='w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold'
                                                    style={{
                                                        backgroundColor: `${config.info.color}20`,
                                                        color: config.info.color,
                                                        border: `2px solid ${config.info.color}`,
                                                    }}
                                                >
                                                    {shape}
                                                </div>
                                                <div>
                                                    <div className='font-semibold text-[#f5f5f5]'>{config.info.name}</div>
                                                    <div className='text-xs text-[#6b6b6b]'>{config.info.description}</div>
                                                </div>
                                            </div>

                                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                                {/* Character Image */}
                                                <div>
                                                    <label className='block text-xs font-medium text-[#a8a8a8] mb-2'>
                                                        Full Character Image URL
                                                    </label>
                                                    <div className='space-y-2'>
                                                        <input
                                                            type='text'
                                                            value={config.images.characterUrl}
                                                            onChange={(e) => handleUrlChange(shape, 'character', e.target.value)}
                                                            className='w-full px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-sm text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]'
                                                            placeholder='https://...'
                                                        />
                                                        {config.images.characterUrl && (
                                                            <div className='w-full h-24 bg-[#1a1a1a] rounded-lg overflow-hidden'>
                                                                <img
                                                                    src={config.images.characterUrl}
                                                                    alt={`${shape} character`}
                                                                    className='w-full h-full object-contain'
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Mouth Only Image */}
                                                <div>
                                                    <label className='block text-xs font-medium text-[#a8a8a8] mb-2'>
                                                        Mouth Only Image URL
                                                    </label>
                                                    <div className='space-y-2'>
                                                        <input
                                                            type='text'
                                                            value={config.images.mouthUrl}
                                                            onChange={(e) => handleUrlChange(shape, 'mouth', e.target.value)}
                                                            className='w-full px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-sm text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]'
                                                            placeholder='https://...'
                                                        />
                                                        {config.images.mouthUrl && (
                                                            <div className='w-full h-24 bg-[#1a1a1a] rounded-lg overflow-hidden'>
                                                                <img
                                                                    src={config.images.mouthUrl}
                                                                    alt={`${shape} mouth`}
                                                                    className='w-full h-full object-contain'
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-[#333333] bg-[#1a1a1a]'>
                    <button onClick={onClose} className='btn-secondary'>
                        Cancel
                    </button>
                    <button onClick={handleApply} className='btn-primary'>
                        Apply & Reprocess
                    </button>
                </div>
            </div>
        </div>
    );
}
