"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Settings as SettingsIcon, X, Info } from "lucide-react";

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

    return (
        <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
            <div className='bg-[#1e1e1e] border border-[#333333] rounded-xl max-w-lg w-full overflow-hidden flex flex-col'>
                {/* Header */}
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#333333]'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center'>
                            <SettingsIcon className='w-5 h-5 text-[#8b5cf6]' />
                        </div>
                        <div>
                            <h2 className='text-xl font-semibold text-[#f5f5f5]'>Rhubarb Settings</h2>
                            <p className='text-xs text-[#6b6b6b]'>Configure phoneme detection</p>
                        </div>
                    </div>
                    <button onClick={onClose} className='btn-ghost p-2' title='Close'>
                        <X className='w-5 h-5' />
                    </button>
                </div>

                {/* Content */}
                <div className='p-6 space-y-6'>
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
                            {(["G", "H", "X"] as const).map((shape) => (
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
                                        <Image
                                            src={`/examples/lisa-${shape}.png`}
                                            alt={`Mouth shape ${shape}`}
                                            width={48}
                                            height={48}
                                            className='object-contain'
                                        />
                                    </div>
                                    <div className='flex-1'>
                                        <div className='flex items-center gap-2'>
                                            <span className='font-mono font-bold text-[#8b5cf6]'>{shape}</span>
                                            <span className='font-medium text-[#f5f5f5]'>{SHAPE_INFO[shape].name}</span>
                                        </div>
                                        <p className='text-xs text-[#6b6b6b] mt-0.5'>{SHAPE_INFO[shape].description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Basic shapes info */}
                    <div className='bg-[#1a1a1a] rounded-lg p-4 border border-[#333333]'>
                        <div className='text-xs text-[#6b6b6b] mb-3'>Basic shapes (A-F) are always included:</div>
                        <div className='flex gap-2 flex-wrap'>
                            {["A", "B", "C", "D", "E", "F"].map((shape) => (
                                <div key={shape} className='w-10 h-10 bg-[#242424] rounded-lg overflow-hidden'>
                                    <Image
                                        src={`/examples/lisa-${shape}.png`}
                                        alt={`Mouth shape ${shape}`}
                                        width={40}
                                        height={40}
                                        className='object-contain'
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
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
