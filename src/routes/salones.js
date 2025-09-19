import express from 'express';
const router = express.Router();

import SalonesController from '../controllers/salonesController.js';
import { verifyToken, requireRole, ROLES } from '../middlewares/auth.js';
import { handleValidationErrors } from '../middlewares/errorHandler.js';
import validations from '../middlewares/validation.js';

// Middleware de autenticación y rol para todas las rutas
router.use(verifyToken);
router.use(requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]));

// Rutas específicas PRIMERO
router.get('/stats/most-reserved',
    validations.validateStatsQuery,
    handleValidationErrors,
    SalonesController.getMostUsed   // <-- corregido
);

// BREAD Routes
router.get('/',
    validations.validatePagination,
    validations.validateOptionalBoolean,
    handleValidationErrors,
    SalonesController.getAll
);

router.get('/:id/availability',
    validations.validateSalonAvailability,
    handleValidationErrors,
    SalonesController.checkAvailability
);

router.get('/:id',
    validations.validateId,
    handleValidationErrors,
    SalonesController.getById
);

router.post('/',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validateSalonCreate,
    handleValidationErrors,
    SalonesController.create
);

router.put('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validateId,
    validations.validateSalonUpdate,
    handleValidationErrors,
    SalonesController.update
);

router.patch('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validateSalonPartialUpdate,
    handleValidationErrors,
    SalonesController.partialUpdate
);

router.delete('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validateId,
    handleValidationErrors,
    SalonesController.softDelete    // <-- ojo: tu controller usa "softDelete"
);

router.patch('/:id/restore',
    requireRole([ROLES.ADMINISTRADOR]),
    validations.validateId,
    handleValidationErrors,
    SalonesController.restore
);

export default router;
