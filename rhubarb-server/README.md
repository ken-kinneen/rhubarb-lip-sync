# Rhubarb Server

A simple Express API that wraps the Rhubarb Lip Sync binary.

## Deploy to Railway (Recommended - Free Tier)

1. **Create a Railway account** at https://railway.app

2. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **Deploy**:
   ```bash
   cd rhubarb-server
   railway init
   railway up
   ```

4. **Get your URL**:
   ```bash
   railway domain
   ```
   
   Your URL will look like: `https://rhubarb-server-xxx.up.railway.app`

5. **Update your Vercel app** with this URL (see below)

## Deploy to Render (Alternative)

1. Create account at https://render.com
2. New → Web Service → Connect your repo
3. Set Root Directory to `rhubarb-server`
4. Docker runtime is auto-detected
5. Deploy!

## Deploy to Fly.io (Alternative)

```bash
cd rhubarb-server
fly launch
fly deploy
```

## API Endpoints

### `GET /`
Health check. Returns `{ status: 'ok' }`

### `GET /version`
Check Rhubarb version. Returns `{ available: true, version: '...' }`

### `POST /process`
Process audio and return phonemes.

**Form Data:**
- `audio` - Audio file (WAV, MP3, OGG)

**OR JSON Body:**
- `audio` - Base64 encoded audio
- `extendedShapes` - Optional: 'GHX', 'GX', 'G', etc.
- `dialog` - Optional: Text transcript for better accuracy

**Response:**
```json
{
  "metadata": {
    "soundFile": "audio.wav",
    "duration": 2.5
  },
  "mouthCues": [
    { "start": 0.0, "end": 0.1, "value": "X" },
    { "start": 0.1, "end": 0.3, "value": "B" }
  ],
  "processingTime": 0.45
}
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `RHUBARB_PATH` - Path to rhubarb binary (default: /usr/local/bin/rhubarb)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

## Local Development

```bash
# Make sure Rhubarb is installed locally
rhubarb --version

# Install and run
npm install
npm start
```



