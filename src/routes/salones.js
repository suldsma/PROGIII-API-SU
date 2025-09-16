import express from 'express';
const router = express.Router();

import SalonesController from '../controllers/salonesController.js';
import { verifyToken, requireRole, ROLES } from '../middlewares/auth.js';
import { handleValidationErrors } from '../middlewares/errorHandler.js';
// Importa el objeto completo de validaciones
import validations from '../middlewares/validation.js';

// Middleware de autenticación y rol para todas las rutas
router.use(verifyToken);
router.use(requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]));

// Rutas específicas PRIMERO
router.get('/stats/most-reserved',
    // Usamos '...' para propagar el array de validaciones
    ...validations.validateStatsQuery,
    handleValidationErrors,
    SalonesController.getMostReserved
);

// BREAD Routes
router.get('/',
    // Usamos '...' para cada array de validaciones
    ...validations.validatePagination,
    ...validations.validateOptionalBoolean,
    handleValidationErrors,
    SalonesController.getAll
);

router.get('/:id/availability',
    // Usamos '...' para propagar el array de validaciones
    ...validations.validateSalonAvailability,
    handleValidationErrors,
    SalonesController.checkAvailability
);

router.get('/:id',
    // Usamos '...' para propagar el array de validaciones
    ...validations.validateId,
    handleValidationErrors,
    SalonesController.getById
);

router.post('/',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    // Usamos '...' para propagar el array de validaciones
    ...validations.validateSalonCreate,
    handleValidationErrors,
    SalonesController.create
);

router.put('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    // Usamos '...' para propagar ambos arrays de validaciones
    ...validations.validateId,
    ...validations.validateSalonUpdate,
    handleValidationErrors,
    SalonesController.update
);

router.patch('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    // Usamos '...' para propagar el array de validaciones
    ...validations.validateSalonPartialUpdate,
    handleValidationErrors,
    SalonesController.partialUpdate
);

router.delete('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    // Usamos '...' para propagar el array de validaciones
    ...validations.validateId,
    handleValidationErrors,
    SalonesController.delete
);

router.patch('/:id/restore',
    requireRole([ROLES.ADMINISTRADOR]),
    // Usamos '...' para propagar el array de validaciones
    ...validations.validateId,
    handleValidationErrors,
    SalonesController.restore
);

export default router;
