# Setting Up Real Rhubarb Lip Sync

This guide shows you how to enable real Rhubarb processing using Next.js Server Actions.

## Quick Start

### 1. Install Rhubarb Binary

Download from: https://github.com/DanielSWolf/rhubarb-lip-sync/releases

#### macOS:
```bash
cd ~/Downloads
wget https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-macOS.zip
unzip Rhubarb-Lip-Sync-1.13.0-macOS.zip
sudo cp rhubarb /usr/local/bin/
chmod +x /usr/local/bin/rhubarb
```

#### Linux:
```bash
wget https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip
unzip Rhubarb-Lip-Sync-1.13.0-Linux.zip
sudo cp rhubarb /usr/local/bin/
chmod +x /usr/local/bin/rhubarb
```

#### Windows:
```powershell
# Download from releases page
# Extract rhubarb.exe
# Add to PATH or set RHUBARB_PATH environment variable
```

### 2. Verify Installation

```bash
rhubarb --version
# Should output: Rhubarb Lip Sync v1.13.0
```

### 3. Set Environment Variable (Optional)

If Rhubarb is not in your PATH:

```bash
# .env.local
RHUBARB_PATH=/path/to/rhubarb
```

### 4. Test the Server Action

The app will automatically detect if Rhubarb is available and offer to use it.

## How It Works

### Architecture

```
Browser (Client)
    ↓
    Audio Blob → Base64
    ↓
Next.js Server Action (app/actions/rhubarb.ts)
    ↓
    Writes temp file
    ↓
Rhubarb CLI (real binary)
    ↓
    Generates JSON
    ↓
Server Action returns result
    ↓
Browser displays phonemes
```

### Files Created

1. **`app/actions/rhubarb.ts`** - Server Action that runs Rhubarb
2. **`app/lib/rhubarb-api.ts`** - Client-side wrapper
3. This setup guide

### Usage in Code

```typescript
import { processAudioWithRealRhubarb, isRhubarbAvailable } from '@/app/lib/rhubarb-api';

// Check if available
const available = await isRhubarbAvailable();

if (available) {
  // Use real Rhubarb
  const phonemes = await processAudioWithRealRhubarb(audioBlob, {
    dialog: 'Hello world', // Optional: improves accuracy
    extendedShapes: true,  // Use all 9 shapes
  });
} else {
  // Fall back to client-side detection
  const phonemes = await processAudioClientSide(audioBlob);
}
```

## Integrating with the UI

### Option 1: Auto-detect and Use

Modify `app/hooks/useAudioProcessor.ts` to automatically use real Rhubarb when available:

```typescript
import { isRhubarbAvailable, processAudioWithRealRhubarb } from '@/app/lib/rhubarb-api';

// In processAudio function:
const useRealRhubarb = await isRhubarbAvailable();

if (useRealRhubarb) {
  const phonemes = await processAudioWithRealRhubarb(blob);
  // ... rest of processing
} else {
  // Use client-side detection
  const processor = getRhubarbProcessor(settings);
  const result = await processor.processAudio(blob);
}
```

### Option 2: Let User Choose

Add a toggle in Settings to choose between client-side and server-side processing.

## Deployment

### Vercel / Netlify

⚠️ **Serverless functions have limitations:**
- 10-50 second timeout
- Cannot install system binaries easily
- Need to include Rhubarb in deployment

**Solution**: Use Docker or VM-based hosting instead.

### Docker

```dockerfile
FROM node:18

# Install Rhubarb
RUN apt-get update && apt-get install -y wget unzip
RUN wget https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip
RUN unzip Rhubarb-Lip-Sync-1.13.0-Linux.zip -d /usr/local/bin
RUN chmod +x /usr/local/bin/rhubarb

# Copy app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### VPS (DigitalOcean, AWS EC2, etc.)

1. Install Rhubarb on the server
2. Deploy Next.js app
3. Server Actions will automatically use Rhubarb

## Troubleshooting

### "Rhubarb binary not found"

```bash
# Check if installed
which rhubarb

# If not found, install or set RHUBARB_PATH
export RHUBARB_PATH=/path/to/rhubarb
```

### "Permission denied"

```bash
chmod +x /usr/local/bin/rhubarb
```

### "Timeout"

Increase timeout in `app/actions/rhubarb.ts`:

```typescript
const { stdout, stderr } = await execAsync(cmd, {
  timeout: 120000, // 2 minutes instead of 1
});
```

### Large Files

Audio files over 5MB may be too large for Server Actions. Consider:
1. Compress audio before sending
2. Use a separate API endpoint
3. Process in chunks

## Performance

| Method | Speed | Accuracy | Cost |
|--------|-------|----------|------|
| Client-side (current) | Fast (instant) | Low (~60%) | Free |
| Real Rhubarb (server) | Slow (2-10s) | High (~95%) | Server costs |

## Next Steps

1. ✅ Install Rhubarb binary
2. ✅ Test with `rhubarb --version`
3. ⬜ Integrate into UI
4. ⬜ Add user toggle for real vs. client-side
5. ⬜ Deploy to server with Rhubarb installed

## Questions?

- Real Rhubarb Docs: https://github.com/DanielSWolf/rhubarb-lip-sync
- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions



