import express from 'express';
import ReservasController from '../controllers/reservasController.js';

// Crear una instancia del router de Express
const router = express.Router();

/**
 * @swagger
 * /api/reservas:
 * get:
 * summary: Obtener la lista de reservas
 * tags: [Reservas]
 * parameters:
 * - in: query
 * name: page
 * schema:
 * type: integer
 * default: 1
 * description: Número de página para la paginación.
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * default: 10
 * description: Cantidad de reservas por página.
 * - in: query
 * name: search
 * schema:
 * type: string
 * description: Término de búsqueda para filtrar reservas.
 * responses:
 * 200:
 * description: Lista de reservas obtenida exitosamente.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: success
 * data:
 * type: object
 * properties:
 * reservas:
 * type: array
 * items:
 * $ref: '#/components/schemas/Reserva'
 * pagination:
 * $ref: '#/components/schemas/Pagination'
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 500:
 * $ref: '#/components/responses/InternalServerError'
 */
router.get('/', ReservasController.getAll);

/**
 * @swagger
 * /api/reservas/{id}:
 * get:
 * summary: Obtener una reserva por su ID
 * tags: [Reservas]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ID de la reserva.
 * responses:
 * 200:
 * description: Reserva encontrada.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: success
 * data:
 * $ref: '#/components/schemas/Reserva'
 * 404:
 * $ref: '#/components/responses/NotFound'
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 500:
 * $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', ReservasController.getById);

/**
 * @swagger
 * /api/reservas:
 * post:
 * summary: Crear una nueva reserva
 * tags: [Reservas]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ReservaInput'
 * responses:
 * 201:
 * description: Reserva creada exitosamente.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/SuccessResponse'
 * 400:
 * $ref: '#/components/responses/ValidationError'
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 500:
 * $ref: '#/components/responses/InternalServerError'
 */
router.post('/', ReservasController.create);

/**
 * @swagger
 * /api/reservas/{id}:
 * put:
 * summary: Actualizar una reserva existente
 * tags: [Reservas]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ID de la reserva a actualizar.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ReservaInput'
 * responses:
 * 200:
 * description: Reserva actualizada exitosamente.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/SuccessResponse'
 * 400:
 * $ref: '#/components/responses/ValidationError'
 * 404:
 * $ref: '#/components/responses/NotFound'
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 500:
 * $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', ReservasController.update);

/**
 * @swagger
 * /api/reservas/{id}:
 * delete:
 * summary: Eliminar una reserva (soft delete)
 * tags: [Reservas]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ID de la reserva a eliminar.
 * responses:
 * 200:
 * description: Reserva eliminada exitosamente.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/SuccessResponse'
 * 404:
 * $ref: '#/components/responses/NotFound'
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 500:
 * $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', ReservasController.softDelete);

/**
 * @swagger
 * /api/reservas/{id}/restore:
 * post:
 * summary: Restaurar una reserva eliminada
 * tags: [Reservas]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ID de la reserva a restaurar.
 * responses:
 * 200:
 * description: Reserva restaurada exitosamente.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/SuccessResponse'
 * 404:
 * $ref: '#/components/responses/NotFound'
 * 401:
 * $ref: '#/components/responses/Unauthorized'
 * 500:
 * $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/restore', ReservasController.restore);

export default router;