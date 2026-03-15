import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const getSupabase = (req: any) => {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: req.headers.authorization! } }
  });
};

// Get the absolute path to the status.json file
// Note: In production, this should be configurable via env variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATUS_FILE_PATH = path.resolve(__dirname, '../../../ML/data/processed/status.json');

router.get('/status', authMiddleware, async (req, res) => {
  try {
    if (!fs.existsSync(STATUS_FILE_PATH)) {
      return res.status(404).json({ 
        error: 'Status file not found', 
        message: 'The ML pipeline may not be running or output path is incorrect.' 
      });
    }

    const data = fs.readFileSync(STATUS_FILE_PATH, 'utf8');
    const status = JSON.parse(data);
    
    // Fetch Active Violations
    let active_violations = 0;
    try {
      const supabase = getSupabase(req);
      const { data: vData, error } = await supabase
        .from('violations')
        .select('id', { count: 'exact' })
        .eq('status', 'Unpaid');
      
      if (!error && vData) {
        active_violations = vData.length;
      }
    } catch (dbErr) {
      console.error('Failed to fetch violations:', dbErr);
    }

    res.json({ ...status, active_violations });
  } catch (error) {
    console.error('Error reading ML status:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to read ML status data' 
    });
  }
});

export default router;
