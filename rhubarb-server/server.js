const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Enable CORS for your Vercel app
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '50mb' }));

/**
 * Detect audio format from buffer magic bytes
 */
function detectAudioFormat(buffer) {
  if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WAVE') {
    return 'wav';
  }
  if (buffer.slice(0, 3).toString() === 'ID3' || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0)) {
    return 'mp3';
  }
  if (buffer.slice(0, 4).toString() === 'OggS') {
    return 'ogg';
  }
  if (buffer.slice(0, 4).toString() === 'fLaC') {
    return 'flac';
  }
  if (buffer.slice(4, 8).toString() === 'ftyp') {
    return 'm4a';
  }
  return 'unknown';
}

/**
 * Convert audio to WAV using ffmpeg
 */
async function convertToWav(inputPath, outputPath) {
  const cmd = `ffmpeg -y -i "${inputPath}" -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}"`;
  console.log('[FFmpeg] Converting:', cmd);
  await execAsync(cmd, { timeout: 30000 });
  console.log('[FFmpeg] Conversion successful');
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'rhubarb-server' });
});

// Version check
app.get('/version', async (req, res) => {
  try {
    const rhubarbPath = process.env.RHUBARB_PATH || 'rhubarb';
    const { stdout } = await execAsync(`${rhubarbPath} --version`);
    
    // Check ffmpeg too
    let ffmpegAvailable = false;
    try {
      await execAsync('ffmpeg -version');
      ffmpegAvailable = true;
    } catch {}
    
    res.json({ 
      available: true, 
      version: stdout.trim(),
      ffmpegAvailable,
    });
  } catch (error) {
    res.json({ available: false, error: error.message });
  }
});

// Process audio with Rhubarb
app.post('/process', upload.single('audio'), async (req, res) => {
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  
  let originalPath = null;
  let wavPath = null;
  let outputPath = null;
  let dialogPath = null;

  try {
    // Handle file upload or base64 data
    let audioBuffer;
    if (req.file) {
      audioBuffer = req.file.buffer;
    } else if (req.body.audio) {
      audioBuffer = Buffer.from(req.body.audio, 'base64');
    } else {
      return res.status(400).json({ error: 'No audio provided' });
    }

    // Detect format
    const format = detectAudioFormat(audioBuffer);
    console.log('[Rhubarb] Detected format:', format);

    // Set up file paths
    originalPath = path.join(tempDir, `rhubarb-${timestamp}-original.${format === 'unknown' ? 'audio' : format}`);
    wavPath = path.join(tempDir, `rhubarb-${timestamp}.wav`);
    outputPath = path.join(tempDir, `rhubarb-${timestamp}.json`);
    dialogPath = req.body.dialog ? path.join(tempDir, `rhubarb-${timestamp}.txt`) : null;

    // Write original audio
    await fs.writeFile(originalPath, audioBuffer);

    // Convert to WAV if needed
    let audioPathForRhubarb = wavPath;
    if (format !== 'wav') {
      console.log('[Rhubarb] Converting to WAV...');
      await convertToWav(originalPath, wavPath);
    } else {
      audioPathForRhubarb = originalPath;
    }

    // Write dialog if provided
    if (dialogPath && req.body.dialog) {
      await fs.writeFile(dialogPath, req.body.dialog, 'utf8');
    }

    // Build Rhubarb command
    const rhubarbPath = process.env.RHUBARB_PATH || 'rhubarb';
    const extendedShapes = req.body.extendedShapes || 'GHX';

    const cmd = [
      rhubarbPath,
      '-f json',
      `--extendedShapes ${extendedShapes}`,
      `-o "${outputPath}"`,
      dialogPath ? `-d "${dialogPath}"` : '',
      `"${audioPathForRhubarb}"`,
    ].filter(Boolean).join(' ');

    console.log(`[Rhubarb] Executing: ${cmd}`);
    const startTime = Date.now();

    // Run Rhubarb (60 second timeout)
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stderr) {
      console.warn('[Rhubarb] stderr:', stderr);
    }

    // Read result
    const resultData = await fs.readFile(outputPath, 'utf8');
    const result = JSON.parse(resultData);

    const processingTime = (Date.now() - startTime) / 1000;

    console.log(`[Rhubarb] Success: ${result.mouthCues?.length || 0} phonemes in ${processingTime.toFixed(2)}s`);

    res.json({
      ...result,
      processingTime,
    });

  } catch (error) {
    console.error('[Rhubarb] Error:', error);
    
    if (error.code === 'ENOENT') {
      return res.status(500).json({
        error: 'Rhubarb binary not found. Please install Rhubarb.',
      });
    }

    res.status(500).json({
      error: `Rhubarb processing failed: ${error.message}`,
    });

  } finally {
    // Cleanup
    if (originalPath) await fs.unlink(originalPath).catch(() => {});
    if (wavPath) await fs.unlink(wavPath).catch(() => {});
    if (outputPath) await fs.unlink(outputPath).catch(() => {});
    if (dialogPath) await fs.unlink(dialogPath).catch(() => {});
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Rhubarb Server running on port ${PORT}`);
});
