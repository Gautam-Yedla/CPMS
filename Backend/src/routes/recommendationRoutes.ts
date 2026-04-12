import express from 'express';
import { RecommendationController } from '../controllers/recommendationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/recommendation/best-slot
 * @desc Get the best parking slot recommendation based on role, distance, and congestion
 * @access Private
 */
router.get('/best-slot', authMiddleware, RecommendationController.getRecommendation);

export default router;
