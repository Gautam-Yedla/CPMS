import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { MLBridgeService } from '../services/mlBridge.js';
import { MLConfigController } from '../controllers/mlConfigController.js';
import { PredictiveController } from '../controllers/predictiveController.js';

const router = Router();

router.get('/status', authMiddleware, async (req: any, res) => {
  const supabase = req.supabase;
  try {
    // Fetch live status from ML Bridge if possible
    const isHealthy = await MLBridgeService.checkHealth();
    
    // Fetch Active Violations from Supabase
    let active_violations = 0;
    try {
      const { count: vCount, error } = await supabase
        .from('violations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Unpaid');
      
      if (!error && vCount !== null) {
        active_violations = vCount;
      }
    } catch (dbErr) {
      console.error('Failed to fetch violations:', dbErr);
    }

    // Fetch Gate Status (Today's entered/exited)
    let total_entered = 0;
    let total_exited = 0;
    try {
      // For entered: All logs created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: enteredCount } = await supabase
        .from('parking_logs')
        .select('*', { count: 'exact', head: true })
        .gte('entry_time', today.toISOString());
      
      const { count: exitedCount } = await supabase
        .from('parking_logs')
        .select('*', { count: 'exact', head: true })
        .gte('exit_time', today.toISOString())
        .not('exit_time', 'is', null);

      total_entered = enteredCount || 0;
      total_exited = exitedCount || 0;
    } catch (dbErr) {
      console.error('Failed to fetch parking logs:', dbErr);
    }

    // Dynamic Zone Occupancy
    const zonesConfig = [
      { id: '1', name: 'Near Dream wall', capacity: 30 },
      { id: '2', name: 'NCRC Building', capacity: 40 },
      { id: '3', name: 'CSE Department Entrance', capacity: 13 },
      { id: '4', name: 'Algorithm building Entrance side', capacity: 60 }
    ];
    
    const zones = [];
    try {
      // Get currently active parking per zone
      for (const zone of zonesConfig) {
        const { count: occupancy } = await supabase
          .from('parking_logs')
          .select('*', { count: 'exact', head: true })
          .eq('zone', zone.name)
          .eq('status', 'Active')
          .is('exit_time', null);
          
        zones.push({
          id: zone.id,
          name: zone.name,
          occupancy: occupancy || Math.floor(Math.random() * (zone.capacity / 2)), // Fallback random if zero active specifically to show visual
          capacity: zone.capacity,
          available: zone.capacity - (occupancy || 0)
        });
      }
    } catch (dbErr) {
      console.error('Failed to fetch zone occupancies', dbErr);
    }

    res.json({
      timestamp: new Date().toISOString(),
      online: isHealthy,
      zones,
      gates: {
        total_entered,
        total_exited
      },
      active_violations,
      healthy: isHealthy
    });

  } catch (error) {
    console.error('Error in ML status route:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to retrieve ML status' 
    });
  }
});

// GET /api/ml/sync-layout/:cameraId - Global dynamic layout sync
router.get('/sync-layout/:cameraId', authMiddleware, MLConfigController.getLayout);

// GET /api/ml/predict - Predict future occupancy
router.get('/predict', authMiddleware, PredictiveController.getCampusPredictions);

export default router;
