# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies (Already Done! ✅)
The dependencies have been installed. You're ready to go!

### Step 2: Start the Development Server
```bash
cd "ClientWorkflowSites/RhubarbLipSync"
npm run dev
```

### Step 3: Open in Browser
1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Allow microphone access when prompted
3. Click "Start Recording" and speak into your microphone
4. Click "Stop & Process" to analyze the audio
5. View the phoneme timeline and mouth shapes
6. Download the JSON data for your project

## ✅ What's Included

- ✅ Audio recording with Web Audio API
- ✅ Real-time waveform visualization
- ✅ Phoneme detection and timeline
- ✅ Mouth shape display with playback sync
- ✅ JSON export functionality
- ✅ Session history with localStorage
- ✅ Responsive dark theme UI

## 🎤 Using the App

### Recording Audio
1. Click "Start Recording"
2. Speak clearly into your microphone
3. Click "Pause" to pause recording (optional)
4. Click "Stop & Process" when done
5. The audio will be automatically processed

### Viewing Results
- **Timeline**: Shows waveform with colored phoneme markers
- **Mouth Shape Display**: Shows current mouth shape during playback
- **Results Panel**: Displays statistics and JSON output

### Playback Controls
- Click anywhere on the timeline to seek
- Use Play/Pause button to control playback
- Click "Restart" to go back to the beginning

### Exporting Data
- Click "Download" to save JSON file
- Click "Copy JSON" to copy to clipboard
- Use the JSON in your animation/game project

### Session History
- Click "History" button in header
- View all processed recordings
- Click any item to reload it
- Delete individual items or clear all

## 📊 Understanding the Output

### Mouth Shapes (Phonemes)
The app detects 9 different mouth shapes:

- **A** - Rest position (closed mouth)
- **B** - M, B, P sounds (lips together)
- **C** - T, D, S sounds (slightly open)
- **D** - Ah sounds (open mouth)
- **E** - Ee sounds (narrow opening)
- **F** - F, V sounds (teeth on lip)
- **G** - G, K sounds (back of tongue)
- **H** - Wide open mouth
- **X** - Silence

### JSON Format
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

## 🐛 Troubleshooting

### Microphone Not Working
- Check browser permissions (click lock icon in address bar)
- Ensure microphone is connected and not muted
- Try refreshing the page

### Processing Takes Too Long
- Shorter recordings process faster
- Try closing other browser tabs
- Ensure your device isn't under heavy load

### Audio Not Playing
- Check browser audio isn't muted
- Try a different browser
- Ensure audio output device is working

### History Not Saving
- Check browser localStorage isn't disabled
- Try clearing browser cache
- Ensure you're not in incognito/private mode

## 💡 Tips

- **Best Audio Quality**: Record in a quiet environment
- **Clear Speech**: Speak clearly and at a moderate pace
- **Recording Length**: Keep recordings under 30 seconds for best performance
- **Browser Support**: Works best in Chrome, Edge, Firefox, and Safari

## 🎯 Use Cases

- **Game Development**: Generate lip sync data for character dialogue
- **Animation**: Create mouth animations for animated characters
- **Video Production**: Add lip sync to animated videos
- **Education**: Learn about phonemes and speech processing
- **Prototyping**: Quickly test lip sync ideas

## 📚 Next Steps

- Explore the session history feature
- Try different speaking styles and speeds
- Export JSON and integrate with your project
- Check out the full README.md for technical details

## ✨ You're All Set!

The Rhubarb Lip Sync app is ready to use. Start recording and generating phoneme data for your projects!

---

**Need Help?** Check the README.md for more detailed information and technical documentation.



