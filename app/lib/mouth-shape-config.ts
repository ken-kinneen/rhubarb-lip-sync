/**
 * Mouth shape image configuration
 * Maps each Rhubarb mouth shape to both mouth-only and full character images
 */

import { MouthShape, MouthShapeConfig } from './types';

/**
 * Default mouth shape configurations with ImageKit URLs
 * Each shape has:
 * - mouthUrl: Just the mouth portion (for close-up views)
 * - characterUrl: Full character with that mouth shape
 */
export const DEFAULT_MOUTH_SHAPE_CONFIGS: Record<MouthShape, MouthShapeConfig> = {
    A: {
        info: {
            name: 'P/B/M',
            description: 'Closed mouth for P, B, and M sounds',
            color: '#6b7280',
        },
        images: {
            mouthUrl: 'https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/img/lisa-A.png',
            characterUrl: 'https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_BPM_CMNywj1eO.png', // B/P/M sounds
        },
    },
    B: {
        info: {
            name: 'K/S/T',
            description: 'Slightly open mouth with clenched teeth',
            color: '#ef4444',
        },
        images: {
            mouthUrl: 'https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/img/lisa-B.png',
            characterUrl: 'https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_T_S_W_Mh6GNP_.png', // T/S sounds
        },
    },
    C: {
        info: {
            name: 'EH/AE',
            description: 'Open mouth for EH and AE vowels',
            color: '#f59e0b',
        },
        images: {
            mouthUrl: 'https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/img/lisa-C.png',
            characterUrl: 'https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_EH_Q68638FVT.png', // EH sound
        },
    },
    D: {
        info: {
            name: 'AA',
            description: 'Wide open mouth for AA vowels',
            color: '#eab308',
        },
        images: {
            mouthUrl: 'https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/img/lisa-D.png',
            characterUrl: 'https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_AH_Xs6fIDXN8.png', // AH sound
        },
    },
    E: {
        info: {
            name: 'AO/ER',
            description: 'Slightly rounded mouth for AO and ER',
            color: '#84cc16',
        },
        images: {
            mouthUrl: 'https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/img/lisa-E.png',
            characterUrl: 'https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_OH_amIToMBnnp.png', // OH sound
        },
    },
    F: {
        info: {
            name: 'UW/OW/W',
            description: 'Puckered lips for UW, OW, and W',
            color: '#22c55e',
        },
        images: {
            mouthUrl: 'https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/img/lisa-F.png',
            characterUrl: 'https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_OO_vJ_xUL4iZ.png', // OO sound
        },
    },
    G: {
        info: {
            name: 'F/V',
            description: 'Upper teeth touching lower lip',
            color: '#14b8a6',
        },
        images: {
            mouthUrl: 'https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/img/lisa-G.png',
            characterUrl: 'https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_F_V_if_msolanS.png', // F/V sounds
        },
    },
    H: {
        info: {
            name: 'L',
            description: 'Tongue raised behind upper teeth for L',
            color: '#06b6d4',
        },
        images: {
            mouthUrl: 'https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/img/lisa-H.png',
            characterUrl: 'https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_L_GEd5pk6mE.png', // L sound
        },
    },
    X: {
        info: {
            name: 'Rest',
            description: 'Idle position with relaxed lips',
            color: '#3b82f6',
        },
        images: {
            mouthUrl: 'https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/img/lisa-X.png',
            characterUrl: 'https://ik.imagekit.io/mealify/PbP_GOOSE_LS_000_HEAD_Eu9lANGQqd.png', // HEAD/rest
        },
    },
};

/**
 * Storage key for custom mouth shape configurations
 */
export const MOUTH_SHAPE_CONFIG_STORAGE_KEY = 'rhubarbLipSync_mouthShapeConfig';

/**
 * Load mouth shape configuration from localStorage or return defaults
 */
export function loadMouthShapeConfig(): Record<MouthShape, MouthShapeConfig> {
    if (typeof window === 'undefined') {
        return DEFAULT_MOUTH_SHAPE_CONFIGS;
    }

    try {
        const stored = localStorage.getItem(MOUTH_SHAPE_CONFIG_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to ensure all shapes are present
            return { ...DEFAULT_MOUTH_SHAPE_CONFIGS, ...parsed };
        }
    } catch (error) {
        console.error('Failed to load mouth shape config from localStorage:', error);
    }

    return DEFAULT_MOUTH_SHAPE_CONFIGS;
}

/**
 * Save mouth shape configuration to localStorage
 */
export function saveMouthShapeConfig(config: Record<MouthShape, MouthShapeConfig>): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(MOUTH_SHAPE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
        console.error('Failed to save mouth shape config to localStorage:', error);
    }
}

/**
 * Reset mouth shape configuration to defaults
 */
export function resetMouthShapeConfig(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.removeItem(MOUTH_SHAPE_CONFIG_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to reset mouth shape config:', error);
    }
}

/**
 * Update a single mouth shape's images
 */
export function updateMouthShapeImages(
    shape: MouthShape,
    images: Partial<{ mouthUrl: string; characterUrl: string }>
): Record<MouthShape, MouthShapeConfig> {
    const currentConfig = loadMouthShapeConfig();
    const updatedConfig = {
        ...currentConfig,
        [shape]: {
            ...currentConfig[shape],
            images: {
                ...currentConfig[shape].images,
                ...images,
            },
        },
    };
    saveMouthShapeConfig(updatedConfig);
    return updatedConfig;
}
