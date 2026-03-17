"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Settings as SettingsIcon, X, Info, Upload, RotateCcw } from "lucide-react";
import { MouthShape, MouthShapeConfig } from "@/app/lib/types";
import { loadMouthShapeConfig, updateMouthShapeImages, resetMouthShapeConfig, getDefaultMouthShape, setDefaultMouthShape } from "@/app/lib/mouth-shape-config";
import { loadCompositorConfig, saveCompositorConfig, resetCompositorConfig, compositeImages, CompositorConfig, MouthPosition } from "@/app/lib/image-compositor";

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
    const [activeTab, setActiveTab] = useState<'phonemes' | 'images' | 'compositor'>('phonemes');
    const [defaultShape, setDefaultShapeState] = useState<MouthShape>('X');
    const [compositorConfig, setCompositorConfig] = useState<CompositorConfig>({
        baseImageUrl: '',
        mouthPosition: { x: 50, y: 65, scale: 20 },
        enabled: false,
    });
    
    // Live preview state for compositor
    const [previewShape, setPreviewShape] = useState<MouthShape>('A');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    
    // Load mouth shape configuration on mount
    useEffect(() => {
        setMouthShapeConfig(loadMouthShapeConfig());
        setDefaultShapeState(getDefaultMouthShape());
        setCompositorConfig(loadCompositorConfig());
    }, []);

    const handleDefaultShapeChange = (shape: MouthShape) => {
        setDefaultShapeState(shape);
        setDefaultMouthShape(shape);
    };

    const handleCompositorChange = (updates: Partial<CompositorConfig>) => {
        const newConfig = { ...compositorConfig, ...updates };
        setCompositorConfig(newConfig);
        saveCompositorConfig(newConfig);
    };

    const handleMouthPositionChange = (updates: Partial<MouthPosition>) => {
        const newPosition = { ...compositorConfig.mouthPosition, ...updates };
        handleCompositorChange({ mouthPosition: newPosition });
    };

    const handleCompositorBaseImageUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('Image file must be less than 10MB');
            return;
        }

        return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                if (dataUrl) {
                    handleCompositorChange({ baseImageUrl: dataUrl });
                }
                resolve();
            };
            reader.readAsDataURL(file);
        });
    };

    const handleResetCompositor = () => {
        if (confirm('Reset compositor settings? This will clear your base image.')) {
            resetCompositorConfig();
            setCompositorConfig(loadCompositorConfig());
            setPreviewImage(null);
        }
    };

    // Generate live preview when compositor config or preview shape changes
    useEffect(() => {
        if (!compositorConfig.baseImageUrl) {
            setPreviewImage(null);
            return;
        }

        const mouthUrl = mouthShapeConfig[previewShape]?.images?.mouthUrl;
        if (!mouthUrl) {
            setPreviewImage(null);
            return;
        }

        setIsGeneratingPreview(true);
        compositeImages(compositorConfig.baseImageUrl, mouthUrl, compositorConfig.mouthPosition)
            .then((result) => {
                setPreviewImage(result);
            })
            .catch((err) => {
                console.error('Failed to generate preview:', err);
                setPreviewImage(null);
            })
            .finally(() => {
                setIsGeneratingPreview(false);
            });
    }, [compositorConfig.baseImageUrl, compositorConfig.mouthPosition, previewShape, mouthShapeConfig]);

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

    // Handle file upload and convert to base64 data URL
    const handleFileUpload = async (shape: MouthShape, type: 'mouth' | 'character', file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Limit file size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert('Image file must be less than 5MB');
            return;
        }

        return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                if (dataUrl) {
                    handleUrlChange(shape, type, dataUrl);
                }
                resolve();
            };
            reader.readAsDataURL(file);
        });
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
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'phonemes'
                                ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-[#8b5cf6]/5'
                                : 'text-[#6b6b6b] hover:text-[#f5f5f5] hover:bg-[#242424]'
                        }`}
                    >
                        Phoneme Detection
                    </button>
                    <button
                        onClick={() => setActiveTab('images')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'images'
                                ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-[#8b5cf6]/5'
                                : 'text-[#6b6b6b] hover:text-[#f5f5f5] hover:bg-[#242424]'
                        }`}
                    >
                        Mouth Shape Images
                    </button>
                    <button
                        onClick={() => setActiveTab('compositor')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'compositor'
                                ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-[#8b5cf6]/5'
                                : 'text-[#6b6b6b] hover:text-[#f5f5f5] hover:bg-[#242424]'
                        }`}
                    >
                        Custom Character
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

                            {/* Default Mouth Shape */}
                            <div>
                                <div className='flex items-center gap-2 mb-4'>
                                    <h3 className='text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider'>Default Neutral Mouth</h3>
                                    <div className='group relative'>
                                        <Info className='w-4 h-4 text-[#6b6b6b] cursor-help' />
                                        <div className='absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-[#242424] border border-[#333333] rounded-lg text-xs text-[#a8a8a8] z-10'>
                                            This shape is shown when the character is not speaking (between words or during silence).
                                        </div>
                                    </div>
                                </div>

                                <div className='bg-[#242424] rounded-lg p-4 border border-[#333333]'>
                                    <p className='text-xs text-[#6b6b6b] mb-4'>
                                        Select the mouth shape to display when no phoneme is active (silence/between words):
                                    </p>
                                    <div className='grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2'>
                                        {(Object.keys(mouthShapeConfig) as MouthShape[]).map((shape) => {
                                            const config = mouthShapeConfig[shape];
                                            if (!config) return null;
                                            const isSelected = shape === defaultShape;
                                            
                                            return (
                                                <button
                                                    key={shape}
                                                    onClick={() => handleDefaultShapeChange(shape)}
                                                    className={`
                                                        flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                                                        ${isSelected 
                                                            ? 'bg-[#8b5cf6]/20 ring-2 ring-[#8b5cf6]' 
                                                            : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
                                                        }
                                                    `}
                                                >
                                                    <div 
                                                        className='w-10 h-10 rounded-lg overflow-hidden border-2'
                                                        style={{ borderColor: isSelected ? config.info.color : 'transparent' }}
                                                    >
                                                        {config.images?.mouthUrl ? (
                                                            <img
                                                                src={config.images.mouthUrl}
                                                                alt={`Shape ${shape}`}
                                                                className='w-full h-full object-contain bg-white'
                                                            />
                                                        ) : (
                                                            <div className='w-full h-full flex items-center justify-center text-[#6b6b6b] bg-[#1a1a1a]'>
                                                                {shape}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span 
                                                        className={`text-xs font-mono font-bold ${isSelected ? 'text-[#8b5cf6]' : 'text-[#6b6b6b]'}`}
                                                    >
                                                        {shape}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className='text-xs text-[#4a4a4a] mt-3'>
                                        Currently set to: <span className='text-[#8b5cf6] font-mono font-bold'>{defaultShape}</span> ({mouthShapeConfig[defaultShape]?.info.name || 'Unknown'})
                                    </p>
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
                                                        Full Character Image
                                                    </label>
                                                    <div className='space-y-2'>
                                                        {/* File Upload Button */}
                                                        <div className='flex gap-2'>
                                                            <label className='flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 rounded-lg text-sm text-[#8b5cf6] cursor-pointer hover:bg-[#8b5cf6]/30 transition-colors'>
                                                                <Upload className='w-4 h-4' />
                                                                Upload Image
                                                                <input
                                                                    type='file'
                                                                    accept='image/*'
                                                                    className='hidden'
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleFileUpload(shape, 'character', file);
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                        {/* URL Input */}
                                                        <input
                                                            type='text'
                                                            value={config.images.characterUrl}
                                                            onChange={(e) => handleUrlChange(shape, 'character', e.target.value)}
                                                            className='w-full px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-sm text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]'
                                                            placeholder='Or paste URL...'
                                                        />
                                                        {config.images.characterUrl && (
                                                            <div className='w-full h-24 bg-[#1a1a1a] rounded-lg overflow-hidden relative group'>
                                                                <img
                                                                    src={config.images.characterUrl}
                                                                    alt={`${shape} character`}
                                                                    className='w-full h-full object-contain'
                                                                />
                                                                {config.images.characterUrl.startsWith('data:') && (
                                                                    <div className='absolute top-1 right-1 px-1.5 py-0.5 bg-[#22c55e]/80 rounded text-[10px] text-white'>
                                                                        Uploaded
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Mouth Only Image */}
                                                <div>
                                                    <label className='block text-xs font-medium text-[#a8a8a8] mb-2'>
                                                        Mouth Only Image
                                                    </label>
                                                    <div className='space-y-2'>
                                                        {/* File Upload Button */}
                                                        <div className='flex gap-2'>
                                                            <label className='flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 rounded-lg text-sm text-[#8b5cf6] cursor-pointer hover:bg-[#8b5cf6]/30 transition-colors'>
                                                                <Upload className='w-4 h-4' />
                                                                Upload Image
                                                                <input
                                                                    type='file'
                                                                    accept='image/*'
                                                                    className='hidden'
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleFileUpload(shape, 'mouth', file);
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                        {/* URL Input */}
                                                        <input
                                                            type='text'
                                                            value={config.images.mouthUrl}
                                                            onChange={(e) => handleUrlChange(shape, 'mouth', e.target.value)}
                                                            className='w-full px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-sm text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]'
                                                            placeholder='Or paste URL...'
                                                        />
                                                        {config.images.mouthUrl && (
                                                            <div className='w-full h-24 bg-[#1a1a1a] rounded-lg overflow-hidden relative'>
                                                                <img
                                                                    src={config.images.mouthUrl}
                                                                    alt={`${shape} mouth`}
                                                                    className='w-full h-full object-contain'
                                                                />
                                                                {config.images.mouthUrl.startsWith('data:') && (
                                                                    <div className='absolute top-1 right-1 px-1.5 py-0.5 bg-[#22c55e]/80 rounded text-[10px] text-white'>
                                                                        Uploaded
                                                                    </div>
                                                                )}
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

                    {activeTab === 'compositor' && (
                        <>
                            {/* Enable/Disable toggle */}
                            <div className='bg-[#242424] rounded-lg p-4 border border-[#333333]'>
                                <label className='flex items-center justify-between cursor-pointer'>
                                    <div>
                                        <div className='font-semibold text-[#f5f5f5]'>Enable Custom Character Mode</div>
                                        <p className='text-xs text-[#6b6b6b] mt-1'>
                                            Composite mouth shapes onto a static base image instead of using pre-rendered character images
                                        </p>
                                    </div>
                                    <div className='relative'>
                                        <input
                                            type='checkbox'
                                            checked={compositorConfig.enabled}
                                            onChange={(e) => handleCompositorChange({ enabled: e.target.checked })}
                                            className='sr-only peer'
                                        />
                                        <div className='w-11 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b5cf6]'></div>
                                    </div>
                                </label>
                            </div>

                            {/* Base Image Upload */}
                            <div>
                                <div className='flex items-center gap-2 mb-4'>
                                    <h3 className='text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider'>Base Character Image</h3>
                                    <div className='group relative'>
                                        <Info className='w-4 h-4 text-[#6b6b6b] cursor-help' />
                                        <div className='absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-[#242424] border border-[#333333] rounded-lg text-xs text-[#a8a8a8] z-10'>
                                            Upload a static image of your character. Mouth shapes will be overlaid on top of this image.
                                        </div>
                                    </div>
                                </div>

                                <div className='bg-[#242424] rounded-lg p-4 border border-[#333333]'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        {/* Upload area */}
                                        <div>
                                            <label className='flex flex-col items-center justify-center gap-3 p-6 bg-[#1a1a1a] border-2 border-dashed border-[#333333] rounded-lg cursor-pointer hover:border-[#8b5cf6]/50 transition-colors'>
                                                <Upload className='w-8 h-8 text-[#6b6b6b]' />
                                                <div className='text-center'>
                                                    <div className='text-sm text-[#f5f5f5]'>Upload Base Image</div>
                                                    <div className='text-xs text-[#6b6b6b] mt-1'>PNG, JPG up to 10MB</div>
                                                </div>
                                                <input
                                                    type='file'
                                                    accept='image/*'
                                                    className='hidden'
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleCompositorBaseImageUpload(file);
                                                    }}
                                                />
                                            </label>
                                            
                                            {compositorConfig.baseImageUrl && (
                                                <button
                                                    onClick={() => handleCompositorChange({ baseImageUrl: '' })}
                                                    className='mt-2 w-full btn-secondary text-sm'
                                                >
                                                    Remove Image
                                                </button>
                                            )}
                                        </div>

                                        {/* Preview */}
                                        <div>
                                            {compositorConfig.baseImageUrl ? (
                                                <div className='w-full h-48 bg-[#1a1a1a] rounded-lg overflow-hidden'>
                                                    <img
                                                        src={compositorConfig.baseImageUrl}
                                                        alt='Base character'
                                                        className='w-full h-full object-contain'
                                                    />
                                                </div>
                                            ) : (
                                                <div className='w-full h-48 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-[#6b6b6b] text-sm'>
                                                    No image uploaded
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mouth Position Controls */}
                            <div>
                                <div className='flex items-center gap-2 mb-4'>
                                    <h3 className='text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider'>Mouth Position</h3>
                                </div>

                                <div className='bg-[#242424] rounded-lg p-4 border border-[#333333]'>
                                    <p className='text-xs text-[#6b6b6b] mb-4'>
                                        Adjust where the mouth shapes will be positioned on your base image (values are percentages)
                                    </p>

                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                        <div>
                                            <label className='block text-xs font-medium text-[#a8a8a8] mb-2'>
                                                X Position (%)
                                            </label>
                                            <input
                                                type='range'
                                                min='0'
                                                max='100'
                                                value={compositorConfig.mouthPosition.x}
                                                onChange={(e) => handleMouthPositionChange({ x: Number(e.target.value) })}
                                                className='w-full h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#8b5cf6]'
                                            />
                                            <div className='flex justify-between mt-1'>
                                                <span className='text-xs text-[#6b6b6b]'>Left</span>
                                                <span className='text-xs text-[#8b5cf6] font-mono'>{compositorConfig.mouthPosition.x}%</span>
                                                <span className='text-xs text-[#6b6b6b]'>Right</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className='block text-xs font-medium text-[#a8a8a8] mb-2'>
                                                Y Position (%)
                                            </label>
                                            <input
                                                type='range'
                                                min='0'
                                                max='100'
                                                value={compositorConfig.mouthPosition.y}
                                                onChange={(e) => handleMouthPositionChange({ y: Number(e.target.value) })}
                                                className='w-full h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#8b5cf6]'
                                            />
                                            <div className='flex justify-between mt-1'>
                                                <span className='text-xs text-[#6b6b6b]'>Top</span>
                                                <span className='text-xs text-[#8b5cf6] font-mono'>{compositorConfig.mouthPosition.y}%</span>
                                                <span className='text-xs text-[#6b6b6b]'>Bottom</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className='block text-xs font-medium text-[#a8a8a8] mb-2'>
                                                Scale (%)
                                            </label>
                                            <input
                                                type='range'
                                                min='5'
                                                max='80'
                                                value={compositorConfig.mouthPosition.scale}
                                                onChange={(e) => handleMouthPositionChange({ scale: Number(e.target.value) })}
                                                className='w-full h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#8b5cf6]'
                                            />
                                            <div className='flex justify-between mt-1'>
                                                <span className='text-xs text-[#6b6b6b]'>Small</span>
                                                <span className='text-xs text-[#8b5cf6] font-mono'>{compositorConfig.mouthPosition.scale}%</span>
                                                <span className='text-xs text-[#6b6b6b]'>Large</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='mt-4 flex justify-end'>
                                        <button
                                            onClick={handleResetCompositor}
                                            className='btn-secondary flex items-center gap-2'
                                        >
                                            <RotateCcw className='w-4 h-4' />
                                            Reset Compositor
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Section */}
                            {compositorConfig.baseImageUrl && (
                                <div>
                                    <div className='flex items-center gap-2 mb-4'>
                                        <h3 className='text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider'>Live Preview</h3>
                                        {isGeneratingPreview && (
                                            <span className='text-xs text-[#8b5cf6] animate-pulse'>Generating...</span>
                                        )}
                                    </div>

                                    <div className='bg-[#242424] rounded-lg p-4 border border-[#333333]'>
                                        <p className='text-xs text-[#6b6b6b] mb-4'>
                                            Select a mouth shape to preview how it will look on your character:
                                        </p>

                                        {/* Shape selector for preview */}
                                        <div className='flex gap-2 flex-wrap mb-4'>
                                            {(Object.keys(mouthShapeConfig) as MouthShape[]).map((shape) => {
                                                const config = mouthShapeConfig[shape];
                                                if (!config) return null;
                                                const isSelected = shape === previewShape;
                                                
                                                return (
                                                    <button
                                                        key={shape}
                                                        onClick={() => setPreviewShape(shape)}
                                                        className={`
                                                            w-10 h-10 rounded-lg flex items-center justify-center
                                                            font-mono font-bold text-sm transition-all
                                                            ${isSelected 
                                                                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#242424] scale-110' 
                                                                : 'hover:scale-105'
                                                            }
                                                        `}
                                                        style={{ 
                                                            backgroundColor: config.info.color,
                                                            color: 'white',
                                                        }}
                                                        title={`${shape}: ${config.info.name}`}
                                                    >
                                                        {shape}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Preview comparison */}
                                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                            {/* Base image */}
                                            <div className='text-center'>
                                                <div className='text-xs text-[#6b6b6b] mb-2'>Base Image</div>
                                                <div className='w-full aspect-square bg-[#1a1a1a] rounded-lg overflow-hidden'>
                                                    <img
                                                        src={compositorConfig.baseImageUrl}
                                                        alt='Base character'
                                                        className='w-full h-full object-contain'
                                                    />
                                                </div>
                                            </div>

                                            {/* Mouth shape */}
                                            <div className='text-center'>
                                                <div className='text-xs text-[#6b6b6b] mb-2'>
                                                    Mouth Shape: <span className='text-[#8b5cf6] font-bold'>{previewShape}</span>
                                                </div>
                                                <div className='w-full aspect-square bg-[#1a1a1a] rounded-lg overflow-hidden flex items-center justify-center'>
                                                    {mouthShapeConfig[previewShape]?.images?.mouthUrl ? (
                                                        <img
                                                            src={mouthShapeConfig[previewShape].images.mouthUrl}
                                                            alt={`Mouth shape ${previewShape}`}
                                                            className='w-1/2 h-1/2 object-contain'
                                                        />
                                                    ) : (
                                                        <div className='text-[#6b6b6b] text-sm'>
                                                            No mouth image
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Composited result */}
                                            <div className='text-center'>
                                                <div className='text-xs text-[#6b6b6b] mb-2'>
                                                    Result {isGeneratingPreview && <span className='animate-pulse'>...</span>}
                                                </div>
                                                <div className='w-full aspect-square bg-[#1a1a1a] rounded-lg overflow-hidden border-2 border-[#8b5cf6]'>
                                                    {previewImage ? (
                                                        <img
                                                            src={previewImage}
                                                            alt='Composited preview'
                                                            className='w-full h-full object-contain'
                                                        />
                                                    ) : (
                                                        <div className='w-full h-full flex items-center justify-center text-[#6b6b6b] text-sm p-4 text-center'>
                                                            {mouthShapeConfig[previewShape]?.images?.mouthUrl 
                                                                ? 'Generating preview...'
                                                                : 'Upload mouth images in the "Mouth Shape Images" tab'
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Position indicator on preview */}
                                        <div className='mt-4 p-3 bg-[#1a1a1a] rounded-lg'>
                                            <div className='text-xs text-[#6b6b6b]'>
                                                <strong className='text-[#f5f5f5]'>Current Position:</strong>{' '}
                                                X: {compositorConfig.mouthPosition.x}%, Y: {compositorConfig.mouthPosition.y}%, 
                                                Scale: {compositorConfig.mouthPosition.scale}%
                                            </div>
                                            <div className='text-xs text-[#4a4a4a] mt-1'>
                                                Tip: Use the sliders above to adjust position and scale. The mouth aspect ratio is preserved automatically.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Info box */}
                            <div className='bg-[#1a1a1a] rounded-lg p-4 border border-[#333333]'>
                                <div className='flex items-start gap-3'>
                                    <Info className='w-5 h-5 text-[#8b5cf6] flex-shrink-0 mt-0.5' />
                                    <div className='text-xs text-[#a8a8a8]'>
                                        <p className='mb-2'>
                                            <strong className='text-[#f5f5f5]'>How Custom Character Mode works:</strong>
                                        </p>
                                        <ol className='list-decimal list-inside space-y-1'>
                                            <li>Upload a base image of your character (without a mouth, or with a neutral mouth)</li>
                                            <li>Upload mouth-only images in the "Mouth Shape Images" tab</li>
                                            <li>Adjust the position and size to align the mouth correctly</li>
                                            <li>The system will composite the mouth onto your base image in real-time</li>
                                        </ol>
                                    </div>
                                </div>
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
