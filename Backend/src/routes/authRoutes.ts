import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Roles
router.get('/roles', authMiddleware, authController.getRoles);
router.post('/roles', authMiddleware, authController.createRole);
router.put('/roles/:id', authMiddleware, authController.updateRole);
router.delete('/roles/:id', authMiddleware, authController.deleteRole);

// Permissions
router.get('/permissions', authMiddleware, authController.getPermissions);
router.post('/permissions', authMiddleware, authController.createPermission);

// Role Permissions
router.get('/roles/:roleId/permissions', authMiddleware, authController.getRolePermissions);
router.post('/roles/:roleId/permissions', authMiddleware, authController.assignPermissionToRole);
router.delete('/roles/:roleId/permissions/:permissionId', authMiddleware, authController.removePermissionFromRole);

// User Roles
router.get('/users', authMiddleware, authController.getAllUsers); // Helper to get all users for assignment
router.get('/users/:userId/roles', authMiddleware, authController.getUserRoles);
router.post('/users/:userId/roles', authMiddleware, authController.assignRoleToUser);
router.delete('/users/:userId/roles/:roleId', authMiddleware, authController.removeRoleFromUser);

export default router;
