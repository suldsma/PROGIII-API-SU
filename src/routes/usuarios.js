import express from 'express';
const router = express.Router();

import UsuariosController from '../controllers/usuariosController.js';
import { verifyToken, requireRole, ROLES } from '../middlewares/auth.js';
import { handleValidationErrors } from '../middlewares/errorHandler.js';
import validations from '../middlewares/validation.js';

// Rutas accesibles sin autenticación
router.post('/register',
  validations.validateUserRegistration,
  handleValidationErrors,
  UsuariosController.register
);

router.post('/forgot-password',
  validations.validateForgotPassword,
  handleValidationErrors,
  UsuariosController.forgotPassword
);

router.post('/reset-password',
  validations.validateResetPassword,
  handleValidationErrors,
  UsuariosController.resetPassword
);

// Middleware de autenticación para todas las rutas siguientes
router.use(verifyToken);

// Rutas específicas PRIMERO
router.get('/profile',
  UsuariosController.getProfile
);

router.get('/stats/most-active',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validateStatsQuery,
  handleValidationErrors,
  UsuariosController.getMostActiveUsers
);

// BREAD Routes
router.get('/',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validatePagination,
  handleValidationErrors,
  UsuariosController.getAll
);

router.get('/:id',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validateId,
  handleValidationErrors,
  UsuariosController.getById
);

router.post('/',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validateUserCreate,
  handleValidationErrors,
  UsuariosController.create
);

router.put('/:id',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validateUserUpdate,
  handleValidationErrors,
  UsuariosController.update
);

router.patch('/:id/change-password',
  validations.validateChangePassword,
  handleValidationErrors,
  UsuariosController.changePassword
);

router.patch('/:id/activate',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validateId,
  handleValidationErrors,
  UsuariosController.activateUser
);

router.patch('/:id/deactivate',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validateId,
  handleValidationErrors,
  UsuariosController.deactivateUser
);

router.patch('/:id/role',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validateUserRoleUpdate,
  handleValidationErrors,
  UsuariosController.updateRole
);

router.delete('/:id',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validateId,
  handleValidationErrors,
  UsuariosController.delete
);

router.patch('/:id/restore',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validateId,
  handleValidationErrors,
  UsuariosController.restore
);

export default router;