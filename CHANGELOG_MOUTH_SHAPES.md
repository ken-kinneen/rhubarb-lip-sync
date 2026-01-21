# Mouth Shape Updates Changelog

## Summary

Updated the application to support **both mouth-only and full character images** for each mouth shape, with all character images now using the ImageKit URLs provided.

## What Changed

### 1. New Type Definitions (`app/lib/types.ts`)

Added new interfaces to support dual image types:

```typescript
export interface MouthShapeImages {
  mouthUrl: string;      // URL to just the mouth image
  characterUrl: string;  // URL to full character with this mouth shape
}

export interface MouthShapeConfig {
  info: MouthShapeInfo;
  images: MouthShapeImages;
}
```

### 2. New Configuration System (`app/lib/mouth-shape-config.ts`)

**NEW FILE** - Centralized configuration for all mouth shape images:

- `DEFAULT_MOUTH_SHAPE_CONFIGS` - Pre-configured with ImageKit URLs
- `loadMouthShapeConfig()` - Loads from localStorage or returns defaults
- `saveMouthShapeConfig()` - Persists to localStorage
- `updateMouthShapeImages()` - Update individual mouth shapes
- `resetMouthShapeConfig()` - Reset to defaults

**Default ImageKit URLs:**
- A (Rest): `PbP_GOOSE_LS_000_HEAD_Eu9lANGQqd.png`
- B (M/B/P): `PbP_GOOSE_LS_001_BPM_CMNywj1eO.png`
- C (T/D/S): `PbP_GOOSE_LS_001_T_S_W_Mh6GNP_.png`
- D (Ah): `PbP_GOOSE_LS_001_AH_Xs6fIDXN8.png`
- E (Ee): `PbP_GOOSE_LS_001_EH_Q68638FVT.png`
- F (F/V): `PbP_GOOSE_LS_001_F_V_if_msolanS.png`
- G (G/K): `PbP_GOOSE_LS_001_TH_StMuY7ZRB.png`
- H (Wide): `PbP_GOOSE_LS_001_L_GEd5pk6mE.png`
- X (Silence): `PbP_GOOSE_LS_000_HEAD_Eu9lANGQqd.png`

### 3. Enhanced Settings Component (`app/components/Settings.tsx`)

**Major Updates:**

- Added **tabbed interface**: "Phoneme Detection" and "Mouth Shape Images"
- **Mouth Shape Images tab** allows editing URLs for all 9 mouth shapes
- Each shape can have both a character URL and mouth-only URL
- Live preview thumbnails show images as you edit
- "Reset to Defaults" button to restore ImageKit URLs
- Increased modal width to `max-w-4xl` for better editing experience
- Added overflow scrolling for long content

### 4. Updated Mouth Shape Display (`app/components/MouthShapeDisplay.tsx`)

**Changes:**

- Now loads configuration from `loadMouthShapeConfig()`
- Displays character images from configuration instead of local files
- Falls back to placeholder if image URL is missing
- Uses regular `<img>` tags instead of Next.js `<Image>` for external URLs
- All 9 mouth shapes in the grid now display character images

### 5. New Documentation

- **MOUTH_SHAPE_IMAGES.md** - Complete guide for customizing mouth shape images
- Includes:
  - Configuration instructions
  - Default URL mapping table
  - Programmatic API examples
  - Image requirements and tips
  - Troubleshooting guide

## Breaking Changes

**None** - All changes are backward compatible. Old code using `MOUTH_SHAPE_INFO` still works.

## Migration Notes

If you had local images in `/public/mouth-shapes/`, they are no longer used by default. You can:

1. Keep using defaults (ImageKit URLs)
2. Update URLs in Settings to point to your own hosted images
3. Update URLs to point to your local public folder: `/mouth-shapes/your-image.png`

## How to Use

### Via UI (Recommended)

1. Open the app
2. Click **Settings** (gear icon in top-right)
3. Switch to **"Mouth Shape Images"** tab
4. Paste your character image URLs
5. Changes save automatically to localStorage

### Via Code

```typescript
import { updateMouthShapeImages } from '@/app/lib/mouth-shape-config';

// Update shape A
updateMouthShapeImages('A', {
  characterUrl: 'https://your-cdn.com/character-A.png',
  mouthUrl: 'https://your-cdn.com/mouth-A.png'
});
```

## Testing

All updated files have been checked for linter errors:
- ✅ `app/lib/types.ts`
- ✅ `app/lib/mouth-shape-config.ts`
- ✅ `app/components/Settings.tsx`
- ✅ `app/components/MouthShapeDisplay.tsx`

## Future Enhancements

Potential improvements:
- Direct image upload (vs URL only)
- Multiple character sets
- Import/export configuration as JSON
- Bulk URL update tools
