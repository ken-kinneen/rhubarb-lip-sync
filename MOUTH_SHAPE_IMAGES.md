# Mouth Shape Image Configuration

This document explains how to configure custom mouth shape images for the Rhubarb Lip Sync application.

## Overview

Each of the 9 mouth shapes (A, B, C, D, E, F, G, H, X) can have two associated images:

1. **Character Image** - Full character with that mouth shape (displayed in the main editor)
2. **Mouth Only Image** - Just the mouth portion (for close-up views or overlays)

## Default Configuration

The application comes pre-configured with character images hosted on ImageKit:

| Shape | Name | Character Image URL |
|-------|------|-------------------|
| A | Rest | `https://ik.imagekit.io/mealify/PbP_GOOSE_LS_000_HEAD_Eu9lANGQqd.png` |
| B | M/B/P | `https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_BPM_CMNywj1eO.png` |
| C | T/D/S | `https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_T_S_W_Mh6GNP_.png` |
| D | Ah | `https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_AH_Xs6fIDXN8.png` |
| E | Ee | `https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_EH_Q68638FVT.png` |
| F | F/V | `https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_F_V_if_msolanS.png` |
| G | G/K | `https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_TH_StMuY7ZRB.png` |
| H | Wide | `https://ik.imagekit.io/mealify/PbP_GOOSE_LS_001_L_GEd5pk6mE.png` |
| X | Silence | `https://ik.imagekit.io/mealify/PbP_GOOSE_LS_000_HEAD_Eu9lANGQqd.png` |

## Customizing Images via Settings UI

1. Click the **Settings** button in the top-right corner
2. Navigate to the **"Mouth Shape Images"** tab
3. For each mouth shape, you can:
   - Update the **Full Character Image URL** - This is the main image displayed
   - Update the **Mouth Only Image URL** - Reserved for future features
4. Paste in your image URLs and they will be saved automatically
5. Preview thumbnails show your images immediately

## Programmatic Configuration

### Loading Configuration

```typescript
import { loadMouthShapeConfig } from '@/app/lib/mouth-shape-config';

const config = loadMouthShapeConfig();
// Returns: Record<MouthShape, MouthShapeConfig>
```

### Updating Individual Shapes

```typescript
import { updateMouthShapeImages } from '@/app/lib/mouth-shape-config';

// Update just the character image for shape 'A'
updateMouthShapeImages('A', {
  characterUrl: 'https://example.com/my-character-A.png'
});

// Update both images
updateMouthShapeImages('B', {
  characterUrl: 'https://example.com/character-B.png',
  mouthUrl: 'https://example.com/mouth-B.png'
});
```

### Resetting to Defaults

```typescript
import { resetMouthShapeConfig } from '@/app/lib/mouth-shape-config';

resetMouthShapeConfig();
```

Or use the **"Reset to Defaults"** button in the Settings UI.

## Data Persistence

- Custom configurations are saved to browser **localStorage**
- Key: `rhubarbLipSync_mouthShapeConfig`
- Changes persist across browser sessions
- Clearing browser data will reset to defaults

## Image Requirements

### Recommended Specifications

- **Format**: PNG, JPG, or WebP
- **Size**: 200x200px to 500x500px recommended
- **Aspect Ratio**: Square (1:1) works best
- **Background**: Transparent PNG recommended for character images
- **Hosting**: Any publicly accessible URL (ImageKit, Cloudinary, S3, etc.)

### Tips for Best Results

1. Use consistent character style across all mouth shapes
2. Ensure good contrast between mouth and face
3. Keep file sizes reasonable (< 500KB per image)
4. Use a CDN for faster loading
5. Test URLs before saving to ensure they're accessible

## Mouth Shape Mapping

The application maps Rhubarb phonemes to mouth shapes:

- **A** - Rest/closed mouth (default/silence)
- **B** - Lips pressed together (M, B, P sounds)
- **C** - Slightly open, tongue position (T, D, S sounds)
- **D** - Wide open for vowels (Ah sounds)
- **E** - Narrow opening (Ee sounds)
- **F** - Teeth on lower lip (F, V sounds)
- **G** - Back of tongue (G, K sounds) - *Extended shape*
- **H** - Wide mouth, tongue raised (L sounds) - *Extended shape*
- **X** - Complete silence/rest - *Extended shape*

## Troubleshooting

### Images Not Displaying

1. Check that URLs are publicly accessible
2. Verify CORS headers allow cross-origin loading
3. Open browser console for error messages
4. Try resetting to defaults to test functionality

### Broken Configuration

If configuration becomes corrupted:

1. Open browser console
2. Run: `localStorage.removeItem('rhubarbLipSync_mouthShapeConfig')`
3. Refresh the page

### Performance Issues

If images load slowly:

1. Reduce image file sizes
2. Use a CDN with better geographic coverage
3. Consider pre-loading images
4. Use WebP format for better compression

## Future Enhancements

Planned features for mouth shape images:

- [ ] Image upload directly in settings (vs. URL only)
- [ ] Multiple character sets (switch between characters)
- [ ] Mouth-only image overlay mode
- [ ] Export character image set as ZIP
- [ ] Import/export configuration JSON
- [ ] Animation preview with all shapes
