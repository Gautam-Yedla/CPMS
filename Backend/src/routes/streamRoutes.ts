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

  const { location = 'Manual Batch', detectionType = 'all' } = req.body;
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
      token,
      detectionType
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

    // 1.5. Resolve Camera ID to UUID
    let actualCameraId = cameraId;
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    
    if (!uuidRegex.test(actualCameraId)) {
      const { data: existingCam } = await supabase.from('cameras').select('id').eq('name', cameraId).single();
      if (existingCam?.id) {
        actualCameraId = existingCam.id;
      } else {
        const { data: newCam } = await supabase.from('cameras').insert({ name: cameraId, location: 'Virtual', status: 'Online' }).select('id').single();
        if (newCam?.id) {
          actualCameraId = newCam.id;
        } else {
          actualCameraId = null; // Couldn't resolve, skip logging
        }
      }
    }

    // 2. Log detection to database (if valid UUID)
    if (actualCameraId) {
      const { error: logError } = await supabase
        .from('camera_detections')
        .insert({
          camera_id: actualCameraId,
          source_type: 'Live',
          results: mlResults.vehicles,
          metadata: {
            count: mlResults.vehicles ? mlResults.vehicles.length : 0,
            timestamp: timestamp || new Date().toISOString()
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
        .eq('id', actualCameraId);
    }

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
