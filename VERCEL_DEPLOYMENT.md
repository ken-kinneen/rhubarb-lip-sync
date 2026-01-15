# Deploying to Vercel

Since Vercel's serverless functions can't run native binaries, you need to deploy the Rhubarb server separately.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Vercel    │────▶│  Rhubarb Server  │────▶│ Rhubarb Binary  │
│  (Next.js)  │     │ (Railway/Render) │     │   (in Docker)   │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

## Step 1: Deploy Rhubarb Server

### Option A: Railway (Recommended - Easy + Free Tier)

1. **Create Railway account**: https://railway.app

2. **Deploy via CLI**:

    ```bash
    cd rhubarb-server
    npm install -g @railway/cli
    railway login
    railway init
    railway up
    ```

3. **Get your URL**:
    ```bash
    railway domain
    # Example: https://rhubarb-server-production-xxxx.up.railway.app
    ```

### Option B: Render (Alternative)

1. Create account at https://render.com
2. New → Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `rhubarb-server`
5. Render auto-detects the Dockerfile
6. Deploy and copy the URL

### Option C: Fly.io (Alternative)

```bash
cd rhubarb-server
fly launch --name rhubarb-server
fly deploy
# URL: https://rhubarb-server.fly.dev
```

## Step 2: Deploy Next.js to Vercel

1. **Set environment variable** in Vercel:

    - Go to your project → Settings → Environment Variables
    - Add: `NEXT_PUBLIC_RHUBARB_API_URL` = `https://your-rhubarb-server.up.railway.app`

2. **Deploy**:
    ```bash
    vercel
    # or via GitHub integration
    ```

## Step 3: Test

1. Open your Vercel URL
2. Upload an audio file
3. Should see "✓ Ready" badge and process correctly

## Environment Variables Summary

| Variable                      | Where          | Value                          |
| ----------------------------- | -------------- | ------------------------------ |
| `NEXT_PUBLIC_RHUBARB_API_URL` | Vercel         | Your Rhubarb server URL        |
| `ALLOWED_ORIGINS`             | Railway/Render | Your Vercel app URL (for CORS) |

## Cost Estimates

-   **Railway**: Free tier includes 500 hours/month (enough for light use)
-   **Render**: Free tier spins down after inactivity (slower first request)
-   **Fly.io**: Free tier includes 3 shared VMs

## Troubleshooting

### "Rhubarb Not Installed" on Vercel

-   You forgot to set `NEXT_PUBLIC_RHUBARB_API_URL` environment variable
-   The Rhubarb server isn't running
-   Check the Rhubarb server logs on Railway/Render

### CORS Errors

-   Set `ALLOWED_ORIGINS=https://your-vercel-app.vercel.app` on the Rhubarb server

### Slow First Request

-   Free tier services "spin down" when idle
-   First request takes 10-30 seconds to wake up
-   Upgrade to paid tier for always-on

## Local Development

For local development, you can:

1. **Run Rhubarb server locally**:

    ```bash
    cd rhubarb-server
    npm install
    npm start
    ```

    Then set `NEXT_PUBLIC_RHUBARB_API_URL=http://localhost:3001`

2. **Or use Server Actions** (requires Rhubarb installed):
    - Don't set `NEXT_PUBLIC_RHUBARB_API_URL`
    - Install Rhubarb locally: see `REAL_RHUBARB_INTEGRATION.md`


