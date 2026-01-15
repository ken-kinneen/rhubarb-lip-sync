const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rhubarb-api' });
});

// Process audio with Rhubarb
app.post('/api/process', upload.single('audio'), async (req, res) => {
  let audioPath = null;
  let outputPath = null;
  let dialogPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    audioPath = req.file.path;
    outputPath = `${audioPath}.json`;

    // Optional: dialog text for better accuracy
    const dialog = req.body.dialog;
    if (dialog) {
      dialogPath = `${audioPath}.txt`;
      await fs.writeFile(dialogPath, dialog, 'utf8');
    }

    // Build Rhubarb command
    const rhubarbPath = process.env.RHUBARB_PATH || 'rhubarb';
    const extendedShapes = req.body.extendedShapes || 'GHX';
    
    const cmd = [
      rhubarbPath,
      '-f json',
      `--extendedShapes ${extendedShapes}`,
      `-o ${outputPath}`,
      dialogPath ? `-d ${dialogPath}` : '',
      audioPath,
    ].filter(Boolean).join(' ');

    console.log('[Rhubarb] Running command:', cmd);

    // Execute Rhubarb
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 60000, // 60 second timeout
    });

    if (stderr) {
      console.warn('[Rhubarb] stderr:', stderr);
    }

    // Read result
    const resultData = await fs.readFile(outputPath, 'utf8');
    const result = JSON.parse(resultData);

    console.log('[Rhubarb] Processing complete:', {
      phonemes: result.mouthCues?.length || 0,
      duration: result.metadata?.duration,
    });

    res.json(result);
  } catch (error) {
    console.error('[Rhubarb] Error:', error);
    res.status(500).json({
      error: 'Failed to process audio',
      message: error.message,
      details: error.stderr || error.stdout,
    });
  } finally {
    // Cleanup files
    try {
      if (audioPath) await fs.unlink(audioPath);
      if (outputPath) await fs.unlink(outputPath);
      if (dialogPath) await fs.unlink(dialogPath);
    } catch (cleanupError) {
      console.error('[Cleanup] Error:', cleanupError);
    }
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('[Server] Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎤 Rhubarb API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/process`);
});



