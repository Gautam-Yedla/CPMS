import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', authMiddleware, notificationController.getUserNotifications);
router.post('/:id/read', authMiddleware, notificationController.markAsRead);
router.post('/read-all', authMiddleware, notificationController.markAllAsRead);

export default router;
