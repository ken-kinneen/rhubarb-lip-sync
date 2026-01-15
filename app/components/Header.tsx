"use client";

import React from "react";
import { Loader2, HelpCircle, Settings } from "lucide-react";

interface HeaderProps {
    isProcessing: boolean;
    onSettingsClick?: () => void;
    rhubarbAvailable?: boolean | null;
}

export function Header({ isProcessing, onSettingsClick, rhubarbAvailable }: HeaderProps) {
    return (
        <header className='bg-[#1a1a1a] border-b border-[#333333] sticky top-0 z-40'>
            <div className='px-4 md:px-6 py-3 md:py-4'>
                <div className='flex items-center justify-end'>
                    {/* Actions */}
                    <div className='flex items-center gap-3'>
                        {/* Processing indicator */}
                        {isProcessing && (
                            <div className='flex items-center gap-2 text-[#8b5cf6] bg-[#8b5cf6]/10 px-3 py-1.5 rounded-lg'>
                                <Loader2 className='w-4 h-4 animate-spin' />
                                <span className='text-sm font-medium hidden sm:inline'>Processing...</span>
                            </div>
                        )}

                        {/* Settings button */}
                        {onSettingsClick && (
                            <button onClick={onSettingsClick} className='btn-ghost p-2' title='Settings'>
                                <Settings className='w-5 h-5' />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
