# Rhubarb Settings Guide

## Important Note

This is a **client-side implementation** of Rhubarb Lip Sync that uses energy-based phoneme detection. The official [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync) uses PocketSphinx for actual speech recognition, which is more accurate but requires server-side processing.

Our implementation provides a good approximation for real-time, client-side lip sync generation.

## Presets

### Default (Recommended)

**Best for**: Most use cases, balanced quality and stability

-   Window: 50ms with 25ms hop
-   Min Duration: 150ms
-   Shape Hold: 75%
-   Smoothing: 85%
-   Thresholds: Calibrated for typical speech

**When to use**: Start here for most audio. Works well for clear speech at normal volume.

### Detailed

**Best for**: Capturing subtle articulation, fast speech

-   Window: 30ms with 15ms hop (more responsive)
-   Min Duration: 80ms (shorter segments)
-   Shape Hold: 60% (more changes)
-   Smoothing: 70% (less smoothing)
-   Thresholds: More sensitive

**When to use**: When you need to capture rapid mouth movements or subtle phoneme changes. May be jittery with noisy audio.

### Stable

**Best for**: Smooth animation, reducing jitter

-   Window: 60ms with 30ms hop (more averaging)
-   Min Duration: 250ms (longer segments)
-   Shape Hold: 85% (very stable)
-   Smoothing: 90% (heavy smoothing)
-   Thresholds: Less sensitive

**When to use**: When you want smooth, flowing animation with fewer rapid changes. Good for stylized or cartoon animation.

### Sensitive

**Best for**: Quiet audio, soft speech, ASMR

-   Thresholds: Very low (detects quiet sounds)
-   Otherwise similar to Default

**When to use**: When your audio is recorded at low volume or contains soft speech. Will detect phonemes in quiet audio that other presets might miss.

### Basic (6 shapes)

**Best for**: Simple animation, limited art assets

-   Uses only A-F shapes (no G, H, X)
-   Same timing as Default

**When to use**: When you only have 6 mouth shapes in your character art, or want simpler animation.

## Parameter Explanations

### Window Size (20-100ms)

-   **What it does**: Size of audio chunk analyzed at once
-   **Smaller = More detail** but noisier
-   **Larger = Smoother** but less responsive
-   **Recommended**: 40-60ms for speech

### Hop Size (10-50ms)

-   **What it does**: Time between analysis windows
-   **Smaller = More frequent updates** (smoother timeline)
-   **Larger = Fewer updates** (more stable)
-   **Recommended**: 50% of window size

### Min Phoneme Duration (0.05-0.5s)

-   **What it does**: Minimum length of each mouth shape
-   **Shorter = More changes** (detailed but potentially jittery)
-   **Longer = Fewer changes** (stable but may miss details)
-   **Recommended**: 0.12-0.2s

### Shape Hold Probability (0-100%)

-   **What it does**: Chance to keep the previous shape
-   **Lower = More changes** (responsive but jittery)
-   **Higher = Fewer changes** (stable but less responsive)
-   **Recommended**: 70-80%

### Energy Smoothing (0-100%)

-   **What it does**: How much to smooth energy readings over time
-   **Lower = More responsive** to changes
-   **Higher = More stable** but slower to react
-   **Recommended**: 80-90%

### Energy Thresholds

These determine which mouth shapes are used based on audio energy:

-   **Silence** (0.001-0.05): Below this = X (silence) or A (rest)
-   **Low** (0.01-0.15): Low energy = A, B shapes (quiet consonants)
-   **Medium** (0.05-0.3): Medium energy = C, D, E shapes (vowels)
-   **High**: Above medium = F, G, H shapes (loud vowels, emphasis)

**Tip**: If you're getting too much silence (X), lower the thresholds. If everything is detected as loud speech, raise them.

## Troubleshooting

### Too many silence (X) shapes

-   **Solution**: Lower all thresholds
-   Try the "Sensitive" preset

### Too jittery/flickering

-   **Solution**: Increase min phoneme duration
-   Increase shape hold probability
-   Increase energy smoothing
-   Try the "Stable" preset

### Missing phonemes in fast speech

-   **Solution**: Decrease window size
-   Decrease hop size
-   Decrease min phoneme duration
-   Try the "Detailed" preset

### Audio is loud but detected as quiet

-   **Solution**: Lower the "low" and "medium" thresholds
-   Check if audio is normalized

## Best Practices

1. **Start with Default**: It's calibrated for typical speech
2. **Test with your audio**: Different recording setups need different settings
3. **Adjust incrementally**: Change one parameter at a time
4. **Use the timeline**: Watch how changes affect the phoneme detection
5. **Consider your art style**: Cartoon characters may work better with "Stable", realistic characters with "Detailed"

## Comparison with Official Rhubarb

| Feature     | Official Rhubarb                    | This Implementation  |
| ----------- | ----------------------------------- | -------------------- |
| Recognition | PocketSphinx (phoneme-based)        | Energy-based         |
| Accuracy    | High                                | Moderate             |
| Speed       | Slower (server-side)                | Fast (client-side)   |
| Dialog file | Supported (improves accuracy)       | Not supported        |
| Languages   | English (best), others via phonetic | Language-agnostic    |
| Processing  | Offline                             | Real-time in browser |

For production use with high accuracy requirements, consider using the [official Rhubarb Lip Sync tool](https://github.com/DanielSWolf/rhubarb-lip-sync) on your server.


