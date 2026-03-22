import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

/**
 * GET /api/reports/analytics
 * Query params: table, groupBy, timeframe, dateField, filters
 */
router.get('/analytics', authMiddleware, checkPermission('reports.view'), reportController.getAnalytics);

export default router;
