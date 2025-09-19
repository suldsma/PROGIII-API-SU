import express from 'express';
const router = express.Router();

import TurnosController from '../controllers/turnosController.js';
import { verifyToken, requireRole, ROLES } from '../middlewares/auth.js';
import { handleValidationErrors } from '../middlewares/errorHandler.js';
import validations from '../middlewares/validation.js';

// Middleware de autenticación para todas las rutas
router.use(verifyToken);
router.use(requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]));

// Rutas específicas PRIMERO
router.get('/active',
  TurnosController.getAllActive
);

router.get('/stats/most-used',
  validations.validateStatsQuery,
  handleValidationErrors,
  TurnosController.getMostUsed
);

// BREAD Routes
router.get('/',
  validations.validatePagination,
  handleValidationErrors,
  TurnosController.getAll
);

router.get('/:id/availability',
  validations.validateTurnoAvailability,
  handleValidationErrors,
  TurnosController.checkAvailability
);

router.get('/:id',
  validations.validateId,
  handleValidationErrors,
  TurnosController.getById
);

router.post('/',
  requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
  validations.validateTurnoCreate,
  handleValidationErrors,
  TurnosController.create
);

router.put('/:id',
  requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
  validations.validateTurnoUpdate,
  handleValidationErrors,
  TurnosController.update
);

router.patch('/:id',
  requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
  validations.validateTurnoPartialUpdate,
  handleValidationErrors,
  TurnosController.partialUpdate
);

router.delete('/:id',
  requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
  validations.validateId,
  handleValidationErrors,
  TurnosController.delete
);

router.patch('/:id/restore',
  requireRole([ROLES.ADMINISTRADOR]),
  validations.validateId,
  handleValidationErrors,
  TurnosController.restore
);

export default router;