import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

// Get the absolute path to the status.json file
// Note: In production, this should be configurable via env variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATUS_FILE_PATH = path.resolve(__dirname, '../../../ML/data/processed/status.json');

router.get('/status', (req, res) => {
  try {
    if (!fs.existsSync(STATUS_FILE_PATH)) {
      return res.status(404).json({ 
        error: 'Status file not found', 
        message: 'The ML pipeline may not be running or output path is incorrect.' 
      });
    }

    const data = fs.readFileSync(STATUS_FILE_PATH, 'utf8');
    const status = JSON.parse(data);
    
    res.json(status);
  } catch (error) {
    console.error('Error reading ML status:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to read ML status data' 
    });
  }
});

export default router;
