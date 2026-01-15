# Rhubarb Lip Sync - Setup Guide

This app uses the **real Rhubarb Lip Sync** binary for accurate phoneme detection.

## Requirements

1. **Rhubarb** - The lip sync binary
2. **FFmpeg** - For automatic audio conversion (MP3, OGG → WAV)

## Quick Setup (macOS)

```bash
# 1. Install FFmpeg (if not already installed)
brew install ffmpeg

# 2. Download Rhubarb
cd ~/Downloads
curl -L -o rhubarb.zip https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-macOS.zip

# 3. Unzip
unzip rhubarb.zip

# 4. Move to your PATH
sudo cp Rhubarb-Lip-Sync-1.13.0-macOS/rhubarb /usr/local/bin/

# 5. Test both work
rhubarb --version
ffmpeg -version
```

## Alternative: Custom Location

If you install Rhubarb elsewhere, set the `RHUBARB_PATH` environment variable:

```bash
# In your .env.local file:
RHUBARB_PATH=/path/to/rhubarb
```

Or export it before running the app:

```bash
export RHUBARB_PATH=/path/to/rhubarb
npm run dev
```

## How It Works

1. **Frontend**: User uploads/records audio → sent to server as base64
2. **Server Action**: Writes temp file → runs `rhubarb` binary → reads JSON output
3. **Response**: Phoneme data returned to frontend for visualization

## Troubleshooting

### "Rhubarb Not Installed" warning

-   Check: `rhubarb --version` in terminal
-   If not found, follow the setup steps above
-   Make sure `/usr/local/bin` is in your PATH

### "Rhubarb processing failed"

-   Audio file might be unsupported format
-   Try converting to WAV: `ffmpeg -i input.mp3 output.wav`
-   Check server logs for detailed error

### macOS Security

If macOS blocks the binary:

```bash
xattr -d com.apple.quarantine /usr/local/bin/rhubarb
```

## Supported Audio Formats

With FFmpeg installed, the app automatically converts any format to WAV:

-   **WAV** (native, no conversion)
-   **MP3** (auto-converted)
-   **OGG** (auto-converted)
-   **M4A/AAC** (auto-converted)
-   **FLAC** (auto-converted)

If FFmpeg is not installed, only WAV files are supported.

## Server Action Location

The server action is at `app/actions/rhubarb.ts`. It:

-   Decodes base64 audio to temp file
-   Runs `rhubarb -f json --extendedShapes GHX -o output.json audio.wav`
-   Parses JSON and returns phoneme data
-   Cleans up temp files
