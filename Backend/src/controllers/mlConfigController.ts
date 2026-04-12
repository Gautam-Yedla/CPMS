import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

export class MLConfigController {
  /**
   * @route GET /api/ml/sync-layout/:cameraId
   * @desc Fetch the complete layout (zones, gates, slots) for a specific camera
   * @access Private (System/ML role)
   */
  static async getLayout(req: Request, res: Response) {
    try {
      const { cameraId } = req.params;

      if (!cameraId) {
        return res.status(400).json({ error: 'Camera ID required' });
      }

      // 1. Fetch Layout from DB
      const { data: gates } = await supabase.from('parking_gates').select('*').eq('camera_id', cameraId);
      const { data: zones } = await supabase.from('parking_zones').select('*').eq('camera_id', cameraId);
      const { data: slots } = await supabase.from('parking_slots').select('*').eq('camera_id', cameraId);
      
      const { data: camera, error: cameraError } = await supabase
        .from('cameras')
        .select('*')
        .eq('id', cameraId)
        .single();

      if (cameraError || !camera) {
        return res.status(404).json({ error: 'Camera connection not found' });
      }

      // 2. Format similar to config.yaml structure for easy ML consumption
      const config = {
        camera_id: camera.id,
        camera_name: camera.name,
        gates: gates?.map(g => ({
          id: g.id,
          name: g.name,
          type: g.type,
          start: g.line_coords[0],
          end: g.line_coords[1]
        })),
        zones: zones?.map(z => ({
          id: z.id,
          name: z.name,
          type: z.type,
          coordinates: z.coordinates,
          capacity: z.capacity
        })),
        parking_slots: slots?.map(s => ({
          id: s.id,
          slot_number: s.slot_number,
          coordinates: s.coordinates,
          zone_id: s.zone_id
        }))
      };

      return res.json(config);
    } catch (error: any) {
      console.error('ML Config Sync Error:', error.message);
      return res.status(500).json({ error: 'Failed to sync layout configuration' });
    }
  }
}
