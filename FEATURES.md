# Rhubarb Lip Sync - Features Documentation

## Overview

Rhubarb Lip Sync is a client-side web application that extracts phoneme (mouth shape) timestamps from audio recordings. It's designed for game developers, animators, and content creators who need lip sync data for character animation.

## Core Features

### 1. Audio Recording 🎤

**Location**: Top of the page

**Capabilities**:
- Record audio directly from your microphone
- Pause and resume recording
- Real-time duration display
- Discard unwanted recordings
- Automatic processing when recording stops

**Technical Details**:
- Uses Web Audio API's `MediaRecorder`
- Supports multiple audio codecs (WebM, Ogg, MP4)
- Echo cancellation and noise suppression enabled
- Auto-gain control for consistent volume

**User Flow**:
1. Click "Start Recording"
2. Grant microphone permissions (first time only)
3. Speak into microphone
4. Click "Stop & Process" to analyze
5. Audio is automatically processed

### 2. Audio Processing 🔊

**Processing Engine**:
- Client-side processing (no server uploads)
- Web Audio API for audio analysis
- RMS energy-based phoneme detection
- Post-processing for smooth transitions

**Algorithm**:
1. Decode audio buffer
2. Analyze in 20ms windows
3. Calculate RMS energy per window
4. Map energy levels to mouth shapes
5. Merge short phonemes
6. Add variation for realism

**Performance**:
- Processing time: ~0.5-2 seconds for typical recordings
- Handles recordings up to several minutes
- Real-time progress indication

### 3. Visual Timeline 📊

**Location**: Main content area (left side on desktop)

**Features**:
- Interactive waveform visualization
- Color-coded phoneme markers
- Playback scrubber
- Click-to-seek functionality
- Time display (current/total)

**Waveform Details**:
- Canvas-based rendering
- Responsive width
- Progress indication (purple highlight)
- Smooth animations

**Phoneme Markers**:
- Top bar shows phoneme sequence
- Each phoneme has unique color
- Phoneme label displayed when wide enough
- Vertical lines mark boundaries

**Playback Controls**:
- Play/Pause button
- Restart button
- Volume indicator
- Keyboard shortcuts (planned)

### 4. Mouth Shape Display 👄

**Location**: Right side on desktop, below timeline on mobile

**Features**:
- Large current mouth shape indicator
- Real-time sync with audio playback
- All mouth shapes reference grid
- Current phoneme details (start, end, duration)

**Mouth Shape Visualization**:
- Large circular badge with phoneme letter
- Color-coded by phoneme type
- Shape name and description
- Smooth transitions during playback

**Reference Grid**:
- Shows all 9 mouth shapes
- Highlights currently active shape
- Quick reference for each phoneme
- Color-coded for easy identification

### 5. Results Panel 📥

**Location**: Bottom of page after processing

**Statistics Display**:
- Total phonemes count
- Audio duration
- Processing time
- Average phoneme length

**Phoneme Distribution**:
- Count of each phoneme type
- Sorted by frequency
- Visual grid layout

**JSON Output**:
- Formatted, syntax-highlighted display
- Full phoneme data with timestamps
- Metadata included (duration, timestamp, etc.)

**Export Options**:
- Download as JSON file
- Copy to clipboard
- Timestamped filename

**JSON Format**:
```json
{
  "metadata": {
    "soundFile": "audio.wav",
    "duration": "5.234",
    "generator": "Rhubarb Lip Sync (Web)",
    "generatedAt": "2025-01-01T12:00:00.000Z"
  },
  "mouthCues": [
    {
      "start": 0.000,
      "end": 0.150,
      "value": "X"
    }
  ]
}
```

### 6. Session History 💾

**Location**: Right sidebar panel

**Features**:
- Automatic saving to localStorage
- List of all processed recordings
- Click to reload previous results
- Delete individual items
- Clear all history
- Persistent across page reloads

**History Item Display**:
- Recording timestamp
- Duration
- Phoneme count
- Processing time
- Currently viewing indicator

**Storage**:
- Uses browser localStorage
- Stores phoneme data and metadata
- Audio URLs preserved
- No size limit (browser dependent)

### 7. User Interface 🎨

**Design System**:
- Dark theme optimized for long sessions
- Purple accent color (#8b5cf6)
- Consistent spacing and typography
- Smooth animations and transitions

**Responsive Design**:
- Desktop: Multi-column layout
- Tablet: Adapted grid
- Mobile: Single column stack
- Touch-friendly controls

**Accessibility**:
- Semantic HTML
- ARIA labels
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Mouth Shapes Reference

### The 9 Phonemes

| Shape | Name | Description | Example Sounds | Color |
|-------|------|-------------|----------------|-------|
| **A** | Rest | Closed mouth (rest position) | Silence, neutral | Gray |
| **B** | M/B/P | Lips together | "mom", "baby", "pop" | Red |
| **C** | T/D/S | Mouth slightly open | "top", "dog", "sit" | Orange |
| **D** | Ah | Mouth open (vowels) | "father", "hot" | Yellow |
| **E** | Ee | Narrow opening | "see", "eat", "feet" | Light Green |
| **F** | F/V | Teeth on lower lip | "fox", "very" | Green |
| **G** | G/K | Back of tongue | "go", "key" | Teal |
| **H** | Wide | Wide open mouth | "how", "wow" | Cyan |
| **X** | Silence | Closed (silence) | Pauses, gaps | Blue |

### Phoneme Transitions

The algorithm automatically handles smooth transitions between phonemes:
- Minimum phoneme duration: 50ms
- Short phonemes merged with neighbors
- Long phonemes split for variation
- Related shapes preferred for transitions

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 13.5.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Audio Processing
- **Recording**: MediaRecorder API
- **Analysis**: Web Audio API
- **Format**: WebM/Ogg/MP4 (browser dependent)

### State Management
- **React Hooks**: useState, useEffect, useRef
- **Local Storage**: Session history persistence
- **Audio Player**: Custom class with callbacks

### Performance Optimizations
- Canvas-based waveform rendering
- Efficient audio buffer processing
- Debounced resize handlers
- Lazy state updates
- Memoized computations

## Browser Support

### Fully Supported
- Chrome 80+
- Edge 80+
- Firefox 75+
- Safari 14.5+
- Opera 67+

### Required APIs
- MediaRecorder API
- Web Audio API
- Canvas API
- LocalStorage API
- ES6+ JavaScript

### Mobile Support
- iOS Safari 14.5+
- Chrome Mobile
- Firefox Mobile
- Samsung Internet

## Use Cases

### Game Development
- Generate lip sync data for NPCs
- Create dialogue systems
- Animate cutscenes
- Voice-over synchronization

### Animation
- Character mouth animation
- Cartoon lip sync
- 2D/3D animation sync
- Motion graphics

### Video Production
- Animated character dialogue
- Educational videos
- Explainer videos
- Marketing content

### Education
- Phonetics learning
- Speech analysis
- Language learning
- Audio visualization

## Limitations & Considerations

### Current Limitations
1. **Simplified Algorithm**: Uses energy-based detection, not true phoneme recognition
2. **No File Upload**: Only microphone recording (planned feature)
3. **No Editing**: Can't manually adjust phonemes (planned feature)
4. **Browser Only**: Requires modern web browser
5. **Client-Side Only**: Processing happens in browser

### Performance Considerations
- Longer recordings take more time to process
- Large audio files may impact performance
- Browser tab must remain active during processing
- Mobile devices may be slower

### Privacy & Security
- All processing happens client-side
- No data sent to servers
- Audio not stored permanently
- LocalStorage can be cleared anytime

## Future Enhancements

### Planned Features
- [ ] File upload support
- [ ] Batch processing
- [ ] Manual phoneme editing
- [ ] Visual mouth animation preview
- [ ] Export to multiple formats (CSV, XML)
- [ ] Audio trimming/editing
- [ ] Advanced audio preprocessing
- [ ] Integration with actual Rhubarb WASM
- [ ] Keyboard shortcuts
- [ ] Dark/light theme toggle

### Potential Improvements
- [ ] Machine learning-based phoneme detection
- [ ] Support for multiple languages
- [ ] Cloud storage integration
- [ ] Collaboration features
- [ ] API for external integration
- [ ] Plugin system for extensibility

## Troubleshooting

### Common Issues

**Microphone not working**
- Check browser permissions
- Ensure microphone is connected
- Try different browser
- Check system audio settings

**Processing fails**
- Try shorter recording
- Check browser console for errors
- Ensure audio is valid
- Try different browser

**History not saving**
- Check localStorage isn't disabled
- Not in incognito/private mode
- Browser storage not full
- Try clearing cache

**Poor results**
- Record in quiet environment
- Speak clearly and slowly
- Check microphone quality
- Adjust microphone position

## Credits & Attribution

- Inspired by [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync)
- UI components styled with Tailwind CSS
- Icons from [Lucide](https://lucide.dev/)
- Built with Next.js and React

## License

Part of the Comfy Workflows project suite.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready



