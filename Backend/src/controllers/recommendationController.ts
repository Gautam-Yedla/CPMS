import type { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendationService.js';

export class RecommendationController {
  static async getRecommendation(req: Request, res: Response) {
    try {
      // Use the profile role attached by authMiddleware
      const userRole = (req as any).user?.role || 'student';
      
      const recommendation = await RecommendationService.getBestSlot(userRole);

      if (!recommendation) {
        return res.status(404).json({ error: 'No available slots found across all connections' });
      }

      return res.json(recommendation);
    } catch (error: any) {
      console.error('Recommendation Controller Error:', error.message);
      return res.status(500).json({ error: 'Failed to generate recommendation' });
    }
  }
}
