import express from 'express';
const router = express.Router();

import ServiciosController from '../controllers/serviciosController.js';
import { verifyToken, requireRole, ROLES } from '../middlewares/auth.js';
import { handleValidationErrors } from '../middlewares/errorHandler.js';
import validations from '../middlewares/validation.js';

// Middleware de autenticación para todas las rutas de servicios
router.use(verifyToken);

// IMPORTANTE: Rutas específicas PRIMERO antes que las parametrizadas
router.get('/stats/most-used',
    validations.validateStatsQuery,
    handleValidationErrors,
    ServiciosController.getMostUsed
);

router.get('/',
    validations.validatePagination,
    handleValidationErrors,
    ServiciosController.getAll
);

router.get('/:id',
    validations.validateServicioId,
    handleValidationErrors,
    ServiciosController.getById
);

router.post('/',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validateServicioCreate,
    handleValidationErrors,
    ServiciosController.create
);

router.put('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validateServicioUpdate,
    handleValidationErrors,
    ServiciosController.update
);

router.patch('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validatePartialUpdate,
    handleValidationErrors,
    ServiciosController.partialUpdate
);

router.delete('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validateServicioId,
    handleValidationErrors,
    ServiciosController.delete
);

router.patch('/:id/restore',
    requireRole([ROLES.ADMINISTRADOR]),
    validations.validateServicioId,
    handleValidationErrors,
    ServiciosController.restore
);

export default router;