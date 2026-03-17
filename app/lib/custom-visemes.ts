/**
 * Custom viseme set management
 * Allows users to define their own viseme sets beyond the standard 9 Rhubarb shapes
 */

import { 
    CustomVisemeSet, 
    CustomVisemeDefinition, 
    StandardMouthShape, 
    STANDARD_MOUTH_SHAPES,
    MouthShapeInfo 
} from './types';

const CUSTOM_VISEME_SETS_KEY = 'rhubarbLipSync_customVisemeSets';
const ACTIVE_VISEME_SET_KEY = 'rhubarbLipSync_activeVisemeSet';

/**
 * Generate a unique color for a viseme based on index
 */
function generateVisemeColor(index: number): string {
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
        '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
        '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#ec4899', '#f43f5e',
    ];
    return colors[index % colors.length];
}

/**
 * Create a default identity mapping (each standard shape maps to itself)
 */
function createIdentityMapping(): Record<StandardMouthShape, string> {
    const mapping: Record<StandardMouthShape, string> = {} as Record<StandardMouthShape, string>;
    STANDARD_MOUTH_SHAPES.forEach(shape => {
        mapping[shape] = shape;
    });
    return mapping;
}

/**
 * Load all custom viseme sets from localStorage
 */
export function loadCustomVisemeSets(): CustomVisemeSet[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const stored = localStorage.getItem(CUSTOM_VISEME_SETS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load custom viseme sets:', error);
    }

    return [];
}

/**
 * Save custom viseme sets to localStorage
 */
export function saveCustomVisemeSets(sets: CustomVisemeSet[]): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(CUSTOM_VISEME_SETS_KEY, JSON.stringify(sets));
    } catch (error) {
        console.error('Failed to save custom viseme sets:', error);
    }
}

/**
 * Get the active viseme set ID
 */
export function getActiveVisemeSetId(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return localStorage.getItem(ACTIVE_VISEME_SET_KEY);
    } catch (error) {
        console.error('Failed to get active viseme set:', error);
        return null;
    }
}

/**
 * Set the active viseme set ID
 */
export function setActiveVisemeSetId(setId: string | null): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        if (setId) {
            localStorage.setItem(ACTIVE_VISEME_SET_KEY, setId);
        } else {
            localStorage.removeItem(ACTIVE_VISEME_SET_KEY);
        }
    } catch (error) {
        console.error('Failed to set active viseme set:', error);
    }
}

/**
 * Get the active viseme set (or null if using standard shapes)
 */
export function getActiveVisemeSet(): CustomVisemeSet | null {
    const setId = getActiveVisemeSetId();
    if (!setId) return null;

    const sets = loadCustomVisemeSets();
    return sets.find(s => s.id === setId) || null;
}

/**
 * Create a new custom viseme set
 */
export function createCustomVisemeSet(name: string, description?: string): CustomVisemeSet {
    const now = Date.now();
    const newSet: CustomVisemeSet = {
        id: `custom-${now}`,
        name,
        description,
        visemes: STANDARD_MOUTH_SHAPES.map((shape, index) => ({
            id: shape,
            name: shape,
            description: `Custom viseme ${shape}`,
            color: generateVisemeColor(index),
            mappedFrom: [shape],
        })),
        mapping: createIdentityMapping(),
        createdAt: now,
        updatedAt: now,
    };

    const sets = loadCustomVisemeSets();
    sets.push(newSet);
    saveCustomVisemeSets(sets);

    return newSet;
}

/**
 * Update an existing custom viseme set
 */
export function updateCustomVisemeSet(setId: string, updates: Partial<CustomVisemeSet>): CustomVisemeSet | null {
    const sets = loadCustomVisemeSets();
    const index = sets.findIndex(s => s.id === setId);
    
    if (index === -1) return null;

    sets[index] = {
        ...sets[index],
        ...updates,
        updatedAt: Date.now(),
    };

    saveCustomVisemeSets(sets);
    return sets[index];
}

/**
 * Delete a custom viseme set
 */
export function deleteCustomVisemeSet(setId: string): void {
    const sets = loadCustomVisemeSets();
    const filtered = sets.filter(s => s.id !== setId);
    saveCustomVisemeSets(filtered);

    // Clear active set if it was the deleted one
    if (getActiveVisemeSetId() === setId) {
        setActiveVisemeSetId(null);
    }
}

/**
 * Add a new viseme to a custom set
 */
export function addVisemeToSet(setId: string, viseme: Omit<CustomVisemeDefinition, 'id'>): CustomVisemeDefinition | null {
    const sets = loadCustomVisemeSets();
    const set = sets.find(s => s.id === setId);
    
    if (!set) return null;

    const newViseme: CustomVisemeDefinition = {
        ...viseme,
        id: `v-${Date.now()}`,
    };

    set.visemes.push(newViseme);
    set.updatedAt = Date.now();
    saveCustomVisemeSets(sets);

    return newViseme;
}

/**
 * Update a viseme in a custom set
 */
export function updateVisemeInSet(
    setId: string, 
    visemeId: string, 
    updates: Partial<CustomVisemeDefinition>
): CustomVisemeDefinition | null {
    const sets = loadCustomVisemeSets();
    const set = sets.find(s => s.id === setId);
    
    if (!set) return null;

    const visemeIndex = set.visemes.findIndex(v => v.id === visemeId);
    if (visemeIndex === -1) return null;

    set.visemes[visemeIndex] = {
        ...set.visemes[visemeIndex],
        ...updates,
    };
    set.updatedAt = Date.now();
    saveCustomVisemeSets(sets);

    return set.visemes[visemeIndex];
}

/**
 * Remove a viseme from a custom set
 */
export function removeVisemeFromSet(setId: string, visemeId: string): void {
    const sets = loadCustomVisemeSets();
    const set = sets.find(s => s.id === setId);
    
    if (!set) return;

    set.visemes = set.visemes.filter(v => v.id !== visemeId);
    set.updatedAt = Date.now();
    saveCustomVisemeSets(sets);
}

/**
 * Update the mapping for a custom viseme set
 */
export function updateVisemeMapping(
    setId: string, 
    mapping: Record<StandardMouthShape, string>
): void {
    const sets = loadCustomVisemeSets();
    const set = sets.find(s => s.id === setId);
    
    if (!set) return;

    set.mapping = mapping;
    set.updatedAt = Date.now();
    saveCustomVisemeSets(sets);
}

/**
 * Map a standard Rhubarb shape to a custom viseme using the active set
 */
export function mapToCustomViseme(standardShape: StandardMouthShape): string {
    const activeSet = getActiveVisemeSet();
    if (!activeSet) return standardShape;

    return activeSet.mapping[standardShape] || standardShape;
}

/**
 * Get viseme info for display (works with both standard and custom visemes)
 */
export function getVisemeInfo(visemeId: string): MouthShapeInfo | null {
    const activeSet = getActiveVisemeSet();
    
    if (activeSet) {
        const viseme = activeSet.visemes.find(v => v.id === visemeId);
        if (viseme) {
            return {
                name: viseme.name,
                description: viseme.description,
                color: viseme.color,
            };
        }
    }

    // Fall back to standard shapes
    const standardInfo: Record<string, MouthShapeInfo> = {
        A: { name: 'P/B/M', description: 'Closed mouth for P, B, M', color: '#6b7280' },
        B: { name: 'K/S/T', description: 'Slightly open, clenched teeth', color: '#ef4444' },
        C: { name: 'EH/AE', description: 'Open mouth for vowels', color: '#f59e0b' },
        D: { name: 'AA', description: 'Wide open mouth', color: '#eab308' },
        E: { name: 'AO/ER', description: 'Slightly rounded', color: '#84cc16' },
        F: { name: 'UW/OW/W', description: 'Puckered lips', color: '#22c55e' },
        G: { name: 'F/V', description: 'Upper teeth on lower lip', color: '#14b8a6' },
        H: { name: 'L', description: 'Tongue raised', color: '#06b6d4' },
        X: { name: 'Rest', description: 'Idle/relaxed', color: '#3b82f6' },
    };

    return standardInfo[visemeId] || null;
}

/**
 * Get all available visemes (custom set or standard)
 */
export function getAvailableVisemes(): Array<{ id: string; info: MouthShapeInfo }> {
    const activeSet = getActiveVisemeSet();
    
    if (activeSet) {
        return activeSet.visemes.map(v => ({
            id: v.id,
            info: {
                name: v.name,
                description: v.description,
                color: v.color,
            },
        }));
    }

    // Return standard shapes
    return STANDARD_MOUTH_SHAPES.map(shape => ({
        id: shape,
        info: getVisemeInfo(shape)!,
    }));
}
