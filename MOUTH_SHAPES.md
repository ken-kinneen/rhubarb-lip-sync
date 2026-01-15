# Rhubarb Lip Sync Mouth Shapes

This document describes the mouth shapes used by Rhubarb Lip Sync, based on the [official Rhubarb documentation](https://github.com/DanielSWolf/rhubarb-lip-sync).

## Shape Sets

Rhubarb supports two modes:

### Basic Shapes (6 shapes: A-F)
The minimal set required for lip sync animation:

- **A** - Rest position (closed mouth)
- **B** - M, B, P sounds (lips together)
- **C** - T, D, S sounds (mouth slightly open)
- **D** - Ah sounds (mouth open for vowels)
- **E** - Ee sounds (narrow opening)
- **F** - F, V sounds (teeth on lower lip)

### Extended Shapes (+ 3 additional: G, H, X)
Additional shapes for more detailed animation:

- **G** - G, K, NG sounds (back of tongue)
- **H** - Wide open mouth (vowels)
- **X** - Silence (closed mouth, alternative to A)

## Usage in This Application

By default, this application uses **all 9 shapes** (A-F + G, H, X) for the most detailed lip sync animation.

You can adjust which shapes are used in the **Settings** panel:

1. Click the ⚙️ settings icon in the header
2. Navigate to the "Mouth Shapes" section
3. Toggle "Use Extended Shapes" to switch between 6 and 9 shapes
4. When extended shapes are enabled, you can individually enable/disable G, H, and X

## Presets

The application includes several presets:

- **Default**: All 9 shapes, balanced settings
- **Detailed**: All 9 shapes, more frequent changes
- **Stable**: All 9 shapes, longer segments
- **Basic (6 shapes)**: Only A-F shapes, simpler animation

## Official Rhubarb Command-Line Equivalent

This web application mimics the behavior of the official Rhubarb command-line tool:

- **9 shapes (default)**: `rhubarb input.wav` (uses all shapes by default)
- **6 shapes only**: `rhubarb input.wav --extendedShapes ""` (empty string = no extended shapes)
- **Custom extended shapes**: `rhubarb input.wav --extendedShapes GX` (only G and X extended shapes)

## References

- [Official Rhubarb Lip Sync Repository](https://github.com/DanielSWolf/rhubarb-lip-sync)
- [Rhubarb Documentation](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/master/README.adoc)



