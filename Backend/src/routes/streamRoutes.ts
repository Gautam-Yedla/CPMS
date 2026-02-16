import { Router } from 'express';
import multer from 'multer';
import { MLBridgeService } from '../services/mlBridge.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createClient } from '@supabase/supabase-js';
import { processingQueue } from '../services/processingQueue.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const getSupabase = (req: any) => {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: req.headers.authorization! } }
  });
};

// POST /api/stream/upload - Handle multiple file uploads
router.post('/upload', authMiddleware, upload.array('media', 10), async (req: any, res) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const { location = 'Manual Batch' } = req.body;
  const batchId = uuidv4();
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  // Queue all files for background processing
  files.forEach(file => {
    processingQueue.addJob({
      id: batchId,
      filename: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype,
      location,
      userId: req.user.id,
      token
    });
  });

  res.json({ 
    message: `Enqueued ${files.length} files for processing`, 
    batchId,
    queueStatus: processingQueue.getQueueStatus()
  });
});

// POST /api/stream/process - Receive frame from FE and process
router.post('/process', authMiddleware, async (req: any, res) => {
  const { image, cameraId, timestamp } = req.body;

  if (!image || !cameraId) {
    return res.status(400).json({ error: 'Image and Camera ID are required' });
  }

  const supabase = getSupabase(req);

  try {
    // 1. Process with ML
    const mlResults = await MLBridgeService.processFrame(image, timestamp);

    // 2. Log detection to database
    const { error: logError } = await supabase
      .from('camera_detections')
      .insert({
        camera_id: cameraId,
        source_type: 'Live',
        results: mlResults.detections,
        metadata: {
          count: mlResults.count,
          timestamp: mlResults.timestamp
        }
      });

    if (logError) {
      console.warn('Failed to log detections to DB:', logError.message);
    }

    // 3. Update Camera Heartbeat
    await supabase
      .from('cameras')
      .update({ 
        status: 'Online', 
        last_heartbeat: new Date().toISOString() 
      })
      .eq('id', cameraId);

    res.json(mlResults);
  } catch (error: any) {
    console.error('Streaming Process Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stream/health - Check ML service status
router.get('/health', authMiddleware, async (req: any, res) => {
  const isHealthy = await MLBridgeService.checkHealth();
  res.json({ mlService: isHealthy ? 'Online' : 'Offline' });
});

export default router;
