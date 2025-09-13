import express from 'express';
const router = express.Router();

import AuthController from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';
import { handleValidationErrors } from '../middlewares/errorHandler.js';
import { validateLogin } from '../middlewares/validation.js';

// POST /api/auth/login - Iniciar sesión
router.post('/login',
  validateLogin,
  handleValidationErrors,
  AuthController.login
);

// GET /api/auth/me - Obtiene perfil del usuario actual (requiere autenticación)
router.get('/me',
  verifyToken,
  AuthController.getProfile
);

// POST /api/auth/refresh - Renovar token (requiere autenticación)
router.post('/refresh',
  verifyToken,
  AuthController.refreshToken
);

export default router;