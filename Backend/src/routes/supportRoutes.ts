import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as supportController from '../controllers/supportController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', supportController.getTickets);
router.post('/', supportController.createTicket);
router.put('/:id', supportController.updateTicket);

export default router;
