import express from 'express';
const router = express.Router();

import SalonesController from '../controllers/salonesController.js';
import { verifyToken, requireRole, ROLES } from '../middlewares/auth.js';
import { handleValidationErrors } from '../middlewares/errorHandler.js';
import {
    validateSalonCreate,
    validateSalonUpdate,
    validateSalonId,
    validatePagination,
} from '../middlewares/validation.js';

// Middleware de autenticación para todas las rutas de salones
router.use(verifyToken);

/**
 * @swagger
 * tags:
 * - name: Salones
 * description: Gestión de salones de eventos
 */

/**
 * @swagger
 * /api/salones:
 * get:
 * summary: Obtiene la lista de salones
 * tags: [Salones]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: page
 * schema:
 * type: integer
 * example: 1
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * example: 10
 * - in: query
 * name: includeInactive
 * schema:
 * type: boolean
 * example: false
 * responses:
 * 200:
 * description: Lista de salones obtenida exitosamente
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 */
router.get('/',
    requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
    validatePagination,
    handleValidationErrors,
    SalonesController.getAll
);

/**
 * @swagger
 * /api/salones/{id}:
 * get:
 * summary: Obtiene un salón por ID
 * tags: [Salones]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID del salón
 * responses:
 * 200:
 * description: Salón obtenido exitosamente
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 403:
 * $ref: '#/components/responses/Forbidden'
 * 404:
 * $ref: '#/components/responses/NotFound'
 */
router.get('/:id',
    validateSalonId,
    handleValidationErrors,
    SalonesController.getById
);

/**
 * @swagger
 * /api/salones:
 * post:
 * summary: Crea un nuevo salón
 * tags: [Salones]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - nombre
 * - direccion
 * - capacidad
 * - importe_alquiler
 * properties:
 * nombre:
 * type: string
 * example: "Salón de Eventos Central"
 * direccion:
 * type: string
 * example: "Av. Principal 1234"
 * latitud:
 * type: number
 * format: float
 * example: -32.3868
 * longitud:
 * type: number
 * format: float
 * example: -58.0039
 * capacidad:
 * type: integer
 * example: 200
 * importe_alquiler:
 * type: number
 * format: float
 * example: 5000.50
 * responses:
 * 201:
 * description: Salón creado exitosamente
 * 400:
 * $ref: '#/components/responses/ValidationError'
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 403:
 * $ref: '#/components/responses/Forbidden'
 */
router.post('/',
    requireRole([ROLES.ADMINISTRADOR]),
    validateSalonCreate,
    handleValidationErrors,
    SalonesController.create
);

/**
 * @swagger
 * /api/salones/{id}:
 * put:
 * summary: Actualiza un salón por ID
 * tags: [Salones]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID del salón
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Salon'
 * responses:
 * 200:
 * description: Salón actualizado exitosamente
 * 400:
 * $ref: '#/components/responses/ValidationError'
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 403:
 * $ref: '#/components/responses/Forbidden'
 * 404:
 * $ref: '#/components/responses/NotFound'
 */
router.put('/:id',
    requireRole([ROLES.ADMINISTRADOR]),
    validateSalonId,
    validateSalonUpdate,
    handleValidationErrors,
    SalonesController.update
);

/**
 * @swagger
 * /api/salones/{id}:
 * delete:
 * summary: Elimina un salón (soft delete) por ID
 * tags: [Salones]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID del salón
 * responses:
 * 200:
 * description: Salón eliminado exitosamente
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 403:
 * $ref: '#/components/responses/Forbidden'
 * 404:
 * $ref: '#/components/responses/NotFound'
 */
router.delete('/:id',
    requireRole([ROLES.ADMINISTRADOR]),
    validateSalonId,
    handleValidationErrors,
    SalonesController.softDelete
);

/**
 * @swagger
 * /api/salones/{id}/restore:
 * patch:
 * summary: Restaura un salón eliminado (soft delete) por ID
 * tags: [Salones]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID del salón
 * responses:
 * 200:
 * description: Salón restaurado exitosamente
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 403:
 * $ref: '#/components/responses/Forbidden'
 * 404:
 * $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/restore',
    requireRole([ROLES.ADMINISTRADOR]),
    validateSalonId,
    handleValidationErrors,
    SalonesController.restore
);

export default router;