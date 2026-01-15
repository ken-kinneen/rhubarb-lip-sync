# Rhubarb Lip Sync

A web-based tool for extracting lip sync phoneme timestamps from audio recordings. Built with Next.js, TypeScript, and the Web Audio API.

## Features

- 🎤 **Audio Recording**: Record audio directly in your browser using your microphone
- 🔊 **Client-Side Processing**: Process audio using Web Audio API without server uploads
- 📊 **Visual Timeline**: Interactive waveform visualization with phoneme markers
- 👄 **Mouth Shape Display**: Real-time mouth shape visualization during playback
- 📥 **JSON Export**: Download phoneme data in JSON format for use in your projects
- 💾 **Session History**: Automatic saving of processed recordings to localStorage
- 🎨 **Modern UI**: Beautiful dark theme with responsive design

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A modern web browser with microphone access

### Installation

1. Navigate to the project directory:
```bash
cd ClientWorkflowSites/RhubarbLipSync
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### 1. Record Audio
- Click "Start Recording" to begin recording from your microphone
- Speak clearly into your microphone
- Click "Stop & Process" when finished

### 2. View Results
- The timeline shows your audio waveform with phoneme markers
- The mouth shape display shows the current phoneme during playback
- Click anywhere on the timeline to seek to that position

### 3. Export Data
- Click "Download" to save the phoneme data as JSON
- Click "Copy JSON" to copy the data to your clipboard
- Use the JSON data in your animation or game project

### 4. Session History
- All processed recordings are automatically saved
- Click "History" to view previous recordings
- Click any history item to reload it
- Delete individual items or clear all history

## Mouth Shapes

Rhubarb outputs 9 different mouth shapes (phonemes):

| Shape | Name | Description |
|-------|------|-------------|
| A | Rest | Closed mouth (rest position) |
| B | M/B/P | Lips together (m, b, p sounds) |
| C | T/D/S | Mouth slightly open (t, d, s, z sounds) |
| D | Ah | Mouth open (vowels like "ah") |
| E | Ee | "Ee" sound (narrow opening) |
| F | F/V | "F" sound (teeth on lower lip) |
| G | G/K | "G" sound (back of tongue) |
| H | Wide | Wide open mouth |
| X | Silence | Closed (silence) |

## JSON Output Format

The exported JSON follows this structure:

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
    },
    {
      "start": 0.150,
      "end": 0.300,
      "value": "B"
    }
    // ... more phonemes
  ]
}
```

## Technical Details

### Architecture

- **Framework**: Next.js 13.5.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Audio Processing**: Web Audio API
- **UI Components**: Radix UI primitives with shadcn/ui

### Audio Processing

The app uses a simplified phoneme detection algorithm based on audio energy analysis:

1. Audio is decoded using Web Audio API
2. The signal is analyzed in 20ms windows
3. RMS energy is calculated for each window
4. Energy levels are mapped to mouth shapes
5. Post-processing merges short phonemes and adds variation

**Note**: This is a simplified implementation for demonstration purposes. For production use, consider integrating the actual Rhubarb Lip Sync library (C++ binary or WASM build).

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.5+)
- Opera: Full support

Requires:
- `MediaRecorder` API for audio recording
- `AudioContext` for audio processing
- `Canvas` API for waveform visualization

## Development

### Project Structure

```
RhubarbLipSync/
├── app/
│   ├── components/          # React components
│   │   ├── AudioRecorder.tsx
│   │   ├── Timeline.tsx
│   │   ├── MouthShapeDisplay.tsx
│   │   ├── ResultsPanel.tsx
│   │   ├── SessionHistory.tsx
│   │   └── Header.tsx
│   ├── lib/                 # Utilities and logic
│   │   ├── types.ts
│   │   ├── rhubarb-processor.ts
│   │   ├── audio-utils.ts
│   │   └── waveform-generator.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/ui/           # shadcn/ui components
├── lib/
│   └── utils.ts
└── public/
```

### Building for Production

```bash
npm run build
npm start
```

## Future Enhancements

- [ ] File upload support (in addition to recording)
- [ ] Integration with actual Rhubarb Lip Sync WASM
- [ ] Advanced audio preprocessing (noise reduction, normalization)
- [ ] Export to multiple formats (CSV, XML, etc.)
- [ ] Batch processing of multiple files
- [ ] Visual mouth shape animation preview
- [ ] Timeline editing (manual phoneme adjustment)
- [ ] Audio trimming and editing

## License

This project is part of the Comfy Workflows suite.

## Credits

- Inspired by [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync) by Daniel Wolf
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## Support

For issues or questions, please refer to the main Comfy Workflows documentation.



