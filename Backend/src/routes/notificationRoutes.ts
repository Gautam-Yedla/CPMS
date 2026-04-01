import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, notificationController.getUserNotifications);
router.get('/all', authMiddleware, checkPermission('notifications.view.all'), notificationController.getAllNotifications);
router.post('/:id/read', authMiddleware, notificationController.markAsRead);
router.post('/read-all', authMiddleware, notificationController.markAllAsRead);
router.post('/trigger', authMiddleware, notificationController.triggerNotification);

export default router;
