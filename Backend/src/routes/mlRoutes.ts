import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createClient } from '@supabase/supabase-js';
import { MLBridgeService } from '../services/mlBridge.js';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATUS_FILE_PATH = path.resolve(__dirname, '../../../ML/data/processed/status.json');

router.get('/status', authMiddleware, async (req: any, res) => {
  const supabase = req.supabase;
  try {
    // Fetch live status from ML Bridge if possible
    const isHealthy = await MLBridgeService.checkHealth();
    
    // Default fallback stats if local file missing (common in Cloud)
    let status: any = {
      timestamp: new Date().toISOString(),
      online: isHealthy,
      zones: [] // Occupancy data requires a persistent pipeline or database
    };

    // Try to read local file if it exists (for local dev)
    if (fs.existsSync(STATUS_FILE_PATH)) {
      try {
        const data = fs.readFileSync(STATUS_FILE_PATH, 'utf8');
        status = { ...status, ...JSON.parse(data) };
      } catch (err) {
        console.warn('Failed to parse local status file:', err);
      }
    }

    // Fetch Active Violations from Supabase
    let active_violations = 0;
    try {
      const { data: vData, error } = await supabase
        .from('violations')
        .select('id', { count: 'exact' })
        .eq('status', 'Unpaid');
      
      if (!error && vData) {
        active_violations = (vData as any[]).length;
      }
    } catch (dbErr) {
      console.error('Failed to fetch violations:', dbErr);
    }

    res.json({ ...status, active_violations, healthy: isHealthy });
  } catch (error) {
    console.error('Error in ML status route:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to retrieve ML status' 
    });
  }
});

export default router;
