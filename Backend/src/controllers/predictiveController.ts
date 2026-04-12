import type { Request, Response } from 'express';
import { PredictionService } from '../services/predictionService.js';

export class PredictiveController {
  /**
   * @route GET /api/ml/predict
   * @desc Get predicted occupancy for all parking zones based on historical time-series data
   * @access Private 
   */
  static async getCampusPredictions(req: Request, res: Response) {
    try {
      // Default to 30 minutes ahead, allow query param override
      const minutesAhead = parseInt(req.query.minutes as string) || 30;
      
      const predictions = await PredictionService.getPredictionsForCampus(minutesAhead);
      
      return res.json({
          timestamp: new Date().toISOString(),
          predictingMinutesAhead: minutesAhead,
          predictions: predictions
      });
      
    } catch (error: any) {
      console.error('Prediction API Error:', error.message);
      return res.status(500).json({ error: 'Failed to generate parking predictions' });
    }
  }
}
