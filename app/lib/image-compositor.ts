/**
 * Image compositor for overlaying mouth shapes on a base character image
 */

import { MouthShape } from './types';

export interface MouthPosition {
    x: number;      // X position as percentage (0-100)
    y: number;      // Y position as percentage (0-100)
    scale: number;  // Scale as percentage of base image width (0-100), maintains aspect ratio
}

export interface CompositorConfig {
    baseImageUrl: string;
    mouthPosition: MouthPosition;
    enabled: boolean;
}

const COMPOSITOR_CONFIG_KEY = 'rhubarbLipSync_compositorConfig';

const DEFAULT_MOUTH_POSITION: MouthPosition = {
    x: 50,      // Center horizontally
    y: 65,      // Lower third of face
    scale: 20,  // 20% of image width, height scales proportionally
};

const DEFAULT_COMPOSITOR_CONFIG: CompositorConfig = {
    baseImageUrl: '',
    mouthPosition: DEFAULT_MOUTH_POSITION,
    enabled: false,
};

/**
 * Load compositor configuration from localStorage
 */
export function loadCompositorConfig(): CompositorConfig {
    if (typeof window === 'undefined') {
        return DEFAULT_COMPOSITOR_CONFIG;
    }

    try {
        const stored = localStorage.getItem(COMPOSITOR_CONFIG_KEY);
        console.log('[loadCompositorConfig] Raw stored value exists:', !!stored, 'length:', stored?.length);
        if (stored) {
            const parsed = JSON.parse(stored);
            console.log('[loadCompositorConfig] Parsed config:', {
                enabled: parsed.enabled,
                hasBaseImage: !!parsed.baseImageUrl,
                baseImageLength: parsed.baseImageUrl?.length,
                mouthPosition: parsed.mouthPosition,
            });
            return { ...DEFAULT_COMPOSITOR_CONFIG, ...parsed };
        }
    } catch (error) {
        console.error('Failed to load compositor config:', error);
    }

    console.log('[loadCompositorConfig] Returning default config');
    return DEFAULT_COMPOSITOR_CONFIG;
}

/**
 * Save compositor configuration to localStorage
 */
export function saveCompositorConfig(config: CompositorConfig): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        console.log('[saveCompositorConfig] Saving config:', {
            enabled: config.enabled,
            hasBaseImage: !!config.baseImageUrl,
            baseImageLength: config.baseImageUrl?.length,
            mouthPosition: config.mouthPosition,
        });
        localStorage.setItem(COMPOSITOR_CONFIG_KEY, JSON.stringify(config));
        // Dispatch event to notify components of config change
        console.log('[saveCompositorConfig] Dispatching compositorConfigChanged event');
        window.dispatchEvent(new CustomEvent('compositorConfigChanged'));
    } catch (error) {
        console.error('Failed to save compositor config:', error);
    }
}

/**
 * Reset compositor configuration
 */
export function resetCompositorConfig(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.removeItem(COMPOSITOR_CONFIG_KEY);
    } catch (error) {
        console.error('Failed to reset compositor config:', error);
    }
}

/**
 * Composite a mouth image onto a base image
 * Returns a data URL of the composited image
 */
export async function compositeImages(
    baseImageUrl: string,
    mouthImageUrl: string,
    position: MouthPosition
): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        const baseImage = new Image();
        baseImage.crossOrigin = 'anonymous';
        
        baseImage.onload = () => {
            // Set canvas size to match base image
            canvas.width = baseImage.width;
            canvas.height = baseImage.height;
            
            // Draw base image
            ctx.drawImage(baseImage, 0, 0);
            
            // Load and draw mouth image
            const mouthImage = new Image();
            mouthImage.crossOrigin = 'anonymous';
            
            mouthImage.onload = () => {
                // Calculate mouth size maintaining aspect ratio
                // Scale is based on percentage of base image width
                const mouthWidth = (position.scale / 100) * canvas.width;
                // Calculate height based on mouth image's aspect ratio
                const aspectRatio = mouthImage.height / mouthImage.width;
                const mouthHeight = mouthWidth * aspectRatio;
                
                // Calculate position (x, y is the center point)
                const mouthX = (position.x / 100) * canvas.width - mouthWidth / 2;
                const mouthY = (position.y / 100) * canvas.height - mouthHeight / 2;
                
                // Draw mouth image
                ctx.drawImage(mouthImage, mouthX, mouthY, mouthWidth, mouthHeight);
                
                // Return composited image as data URL
                resolve(canvas.toDataURL('image/png'));
            };
            
            mouthImage.onerror = () => {
                // If mouth image fails, just return base image
                resolve(canvas.toDataURL('image/png'));
            };
            
            mouthImage.src = mouthImageUrl;
        };
        
        baseImage.onerror = () => {
            reject(new Error('Failed to load base image'));
        };
        
        baseImage.src = baseImageUrl;
    });
}

/**
 * Create a preview canvas element for real-time compositing
 */
export class CompositorCanvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private baseImage: HTMLImageElement | null = null;
    private mouthImages: Map<MouthShape, HTMLImageElement> = new Map();
    private position: MouthPosition;
    private isReady: boolean = false;

    constructor(canvas: HTMLCanvasElement, position: MouthPosition = DEFAULT_MOUTH_POSITION) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        this.ctx = ctx;
        this.position = position;
    }

    /**
     * Load the base image
     */
    async loadBaseImage(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.baseImage = img;
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.isReady = true;
                resolve();
            };
            
            img.onerror = () => reject(new Error('Failed to load base image'));
            img.src = url;
        });
    }

    /**
     * Preload a mouth image for a specific shape
     */
    async loadMouthImage(shape: MouthShape, url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.mouthImages.set(shape, img);
                resolve();
            };
            
            img.onerror = () => reject(new Error(`Failed to load mouth image for shape ${shape}`));
            img.src = url;
        });
    }

    /**
     * Update mouth position
     */
    setPosition(position: MouthPosition): void {
        this.position = position;
    }

    /**
     * Render the composite with a specific mouth shape
     */
    render(shape: MouthShape): void {
        if (!this.isReady || !this.baseImage) return;

        // Clear and draw base image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.baseImage, 0, 0);

        // Draw mouth if available
        const mouthImage = this.mouthImages.get(shape);
        if (mouthImage) {
            // Calculate mouth size maintaining aspect ratio
            const mouthWidth = (this.position.scale / 100) * this.canvas.width;
            const aspectRatio = mouthImage.height / mouthImage.width;
            const mouthHeight = mouthWidth * aspectRatio;
            
            // Calculate position (x, y is the center point)
            const mouthX = (this.position.x / 100) * this.canvas.width - mouthWidth / 2;
            const mouthY = (this.position.y / 100) * this.canvas.height - mouthHeight / 2;
            
            this.ctx.drawImage(mouthImage, mouthX, mouthY, mouthWidth, mouthHeight);
        }
    }

    /**
     * Get the canvas element
     */
    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    /**
     * Check if ready to render
     */
    ready(): boolean {
        return this.isReady;
    }
}
