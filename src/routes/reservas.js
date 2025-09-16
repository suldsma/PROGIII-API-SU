import express from 'express';
const router = express.Router();

import ReservasController from '../controllers/reservasController.js';
import { verifyToken, requireRole, ROLES } from '../middlewares/auth.js';
import { handleValidationErrors } from '../middlewares/errorHandler.js';
// Importación corregida para el objeto completo de validaciones
import validations from '../middlewares/validation.js';

// Middleware de autenticación para todas las rutas
router.use(verifyToken);
router.use(requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]));

// Rutas
router.post('/check-availability',
    validations.validateAvailabilityCheck,
    handleValidationErrors,
    ReservasController.checkAvailability
);

router.get('/stats/monthly-reservations',
    validations.validateStatsMonthly,
    handleValidationErrors,
    ReservasController.getMonthlyReservations
);

router.get('/stats/upcoming',
    validations.validateUpcoming,
    handleValidationErrors,
    ReservasController.getUpcomingReservations
);

router.get('/stats/most-reserved-month',
    ReservasController.getMostReservedMonth
);

router.get('/',
    validations.validatePagination,
    validations.validateOptionalBoolean,
    handleValidationErrors,
    ReservasController.getAll
);

router.get('/:id',
    validations.validateId,
    handleValidationErrors,
    ReservasController.getById
);

router.post('/',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO, ROLES.CLIENTE]),
    validations.validateReservaCreate,
    handleValidationErrors,
    ReservasController.create
);

router.put('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validateReservaUpdate,
    handleValidationErrors,
    ReservasController.update
);

router.patch('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validateReservaPartialUpdate,
    handleValidationErrors,
    ReservasController.partialUpdate
);

router.delete('/:id',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validations.validateId,
    handleValidationErrors,
    ReservasController.delete
);

router.patch('/:id/restore',
    requireRole([ROLES.ADMINISTRADOR]),
    validations.validateId,
    handleValidationErrors,
    ReservasController.restore
);

export default router;