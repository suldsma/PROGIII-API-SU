import express from 'express';
const router = express.Router();

import ServiciosController from '../controllers/serviciosController.js';
import { verifyToken, requireRole, ROLES } from '../middlewares/auth.js';
import { handleValidationErrors } from '../middlewares/errorHandler.js';
import {
  validateServicioCreate,
  validateServicioUpdate,
  validateServicioId,
  validatePagination,
  validateStatsQuery,
  validatePartialUpdate
} from '../middlewares/validation.js';

// Middleware de autenticación para todas las rutas de servicios
router.use(verifyToken);

/**
 * @swagger
 * /api/servicios/stats/most-used:
 *   get:
 *     summary: Obtener servicios más utilizados
 *     description: Retorna estadísticas de los servicios más utilizados en reservas activas
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Cantidad máxima de servicios a retornar
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Servicios más utilizados obtenidos exitosamente
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Servicio'
 *                       - type: object
 *                         properties:
 *                           uso_count:
 *                             type: integer
 *                             description: Cantidad de veces usado en reservas
 *                             example: 15
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// IMPORTANTE: Rutas específicas PRIMERO antes que las parametrizadas
router.get('/stats/most-used',
  validateStatsQuery,
  handleValidationErrors,
  ServiciosController.getMostUsed
);

/**
 * @swagger
 * /api/servicios:
 *   get:
 *     summary: Obtener lista de servicios (Browse)
 *     description: Obtiene una lista paginada de servicios con filtros opcionales. Los clientes solo ven servicios activos, mientras que los administradores pueden incluir servicios inactivos.
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Cantidad de elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Término de búsqueda en la descripción
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir servicios inactivos (solo administradores)
 *     responses:
 *       200:
 *         description: Lista de servicios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Servicio'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/',
  validatePagination,
  handleValidationErrors,
  ServiciosController.getAll
);

/**
 * @swagger
 * /api/servicios/{id}:
 *   get:
 *     summary: Obtener servicio por ID (Read)
 *     description: Obtiene un servicio específico por su ID. Los clientes solo pueden ver servicios activos.
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Servicio obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Servicio'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id',
  validateServicioId,
  handleValidationErrors,
  ServiciosController.getById
);

/**
 * @swagger
 * /api/servicios:
 *   post:
 *     summary: Crear nuevo servicio (Add)
 *     description: Crea un nuevo servicio. Solo administradores y empleados pueden crear servicios.
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServicioInput'
 *     responses:
 *       201:
 *         description: Servicio creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Conflicto - Servicio ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/',
  requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
  validateServicioCreate,
  handleValidationErrors,
  ServiciosController.create
);

/**
 * @swagger
 * /api/servicios/{id}:
 *   put:
 *     summary: Actualizar servicio completo (Edit)
 *     description: Actualiza completamente un servicio existente. Solo administradores y empleados.
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del servicio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServicioInput'
 *     responses:
 *       200:
 *         description: Servicio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Conflicto - Ya existe servicio con esa descripción
 */
router.put('/:id',
  requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
  validateServicioUpdate,
  handleValidationErrors,
  ServiciosController.update
);

/**
 * @swagger
 * /api/servicios/{id}:
 *   patch:
 *     summary: Actualización parcial de servicio
 *     description: Actualiza parcialmente un servicio existente. Solo administradores y empleados.
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del servicio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descripcion:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 example: "Servicio de sonido actualizado"
 *               importe:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 maximum: 9999999.99
 *                 example: 18000.00
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Servicio actualizado parcialmente exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id',
  requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
  validatePartialUpdate,
  handleValidationErrors,
  ServiciosController.partialUpdate
);

/**
 * @swagger
 * /api/servicios/{id}:
 *   delete:
 *     summary: Eliminar servicio (Delete)
 *     description: Elimina un servicio (soft delete). Solo administradores y empleados pueden eliminar servicios.
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Servicio eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Servicio eliminado exitosamente
 *       400:
 *         description: Error al eliminar - Servicio en uso o ya eliminado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id',
  requireRole([ROLES.ADMINISTRADOR, ROLES.EMPLEADO]),
  validateServicioId,
  handleValidationErrors,
  ServiciosController.delete
);

/**
 * @swagger
 * /api/servicios/{id}/restore:
 *   patch:
 *     summary: Restaurar servicio eliminado
 *     description: Restaura un servicio que fue eliminado (soft delete). Solo administradores.
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Servicio restaurado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: El servicio ya está activo
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/restore',
  requireRole([ROLES.ADMINISTRADOR]),
  validateServicioId,
  handleValidationErrors,
  ServiciosController.restore
);

export default router;