import { query } from '../config/database.js';
import { createError } from '../middlewares/errorHandler.js';

/**
 * @swagger
 * tags:
 * name: Reservas
 * description: Gestión de reservas
 */

class ReservasController {
  
  /**
   * @swagger
   * /api/reservas:
   * get:
   * summary: Obtener todas las reservas con paginación
   * tags: [Reservas]
   * parameters:
   * - in: query
   * name: page
   * schema:
   * type: integer
   * default: 1
   * description: Número de página
   * - in: query
   * name: limit
   * schema:
   * type: integer
   * default: 10
   * description: Cantidad de elementos por página
   * - in: query
   * name: search
   * schema:
   * type: string
   * description: Término de búsqueda para filtrar reservas
   * responses:
   * 200:
   * description: Lista de reservas obtenida exitosamente
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
  static async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = search ? `WHERE (fecha_reserva LIKE ? OR tematica LIKE ?)` : '';
      const params = search ? [`%${search}%`, `%${search}%`] : [];
      const countQuery = `SELECT COUNT(*) AS totalItems FROM reservas ${whereClause}`;
      
      const totalItemsResult = await query(countQuery, params);
      const totalItems = totalItemsResult[0].totalItems;
      const totalPages = Math.ceil(totalItems / limit);

      const reservas = await query(
        `SELECT * FROM reservas ${whereClause} LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );

      res.status(200).json({
        status: 'success',
        data: {
          reservas,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems,
            itemsPerPage: parseInt(limit),
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

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
   * description: ID de la reserva
   * responses:
   * 200:
   * description: Reserva encontrada exitosamente
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
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const reserva = await query('SELECT * FROM reservas WHERE reserva_id = ?', [id]);

      if (reserva.length === 0) {
        throw createError('Reserva no encontrada', 404);
      }

      res.status(200).json({ status: 'success', data: reserva[0] });
    } catch (error) {
      next(error);
    }
  }

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
   * description: Reserva creada exitosamente
   * content:
   * application/json:
   * schema:
   * type: object
   * properties:
   * status:
   * type: string
   * example: success
   * message:
   * type: string
   * example: Reserva creada exitosamente
   * data:
   * $ref: '#/components/schemas/Reserva'
   * 400:
   * $ref: '#/components/responses/ValidationError'
   * 401:
   * $ref: '#/components/responses/Unauthorized'
   * 500:
   * $ref: '#/components/responses/InternalServerError'
   */
  static async create(req, res, next) {
    try {
      const { fecha_reserva, salon_id, usuario_id, turno_id, foto_cumpleaniero, tematica, importe_salon } = req.body;
      const result = await query(
        `INSERT INTO reservas (fecha_reserva, salon_id, usuario_id, turno_id, foto_cumpleaniero, tematica, importe_salon, importe_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [fecha_reserva, salon_id, usuario_id, turno_id, foto_cumpleaniero, tematica, importe_salon, importe_salon] // Asumiendo que importe_total es igual a importe_salon al crear
      );
      
      const newReserva = await query('SELECT * FROM reservas WHERE reserva_id = ?', [result.insertId]);
      
      res.status(201).json({
        status: 'success',
        message: 'Reserva creada exitosamente',
        data: newReserva[0],
      });
    } catch (error) {
      next(error);
    }
  }
  
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
   * description: ID de la reserva a actualizar
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/ReservaUpdate'
   * responses:
   * 200:
   * description: Reserva actualizada exitosamente
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
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { fecha_reserva, salon_id, usuario_id, turno_id, foto_cumpleaniero, tematica, importe_salon } = req.body;
      
      const reservaExists = await query('SELECT 1 FROM reservas WHERE reserva_id = ?', [id]);
      if (reservaExists.length === 0) {
        throw createError('Reserva no encontrada', 404);
      }

      const result = await query(
        `UPDATE reservas SET fecha_reserva = ?, salon_id = ?, usuario_id = ?, turno_id = ?, foto_cumpleaniero = ?, tematica = ?, importe_salon = ?, modificado = CURRENT_TIMESTAMP WHERE reserva_id = ?`,
        [fecha_reserva, salon_id, usuario_id, turno_id, foto_cumpleaniero, tematica, importe_salon, id]
      );
      
      if (result.affectedRows === 0) {
        throw createError('No se pudo actualizar la reserva', 500);
      }
      
      res.status(200).json({ status: 'success', message: 'Reserva actualizada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

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
   * description: ID de la reserva a eliminar
   * responses:
   * 200:
   * description: Reserva eliminada exitosamente
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
  static async softDelete(req, res, next) {
    try {
      const { id } = req.params;
      
      const reservaExists = await query('SELECT 1 FROM reservas WHERE reserva_id = ? AND activo = 1', [id]);
      if (reservaExists.length === 0) {
        throw createError('Reserva no encontrada o ya eliminada', 404);
      }
      
      const result = await query(
        `UPDATE reservas SET activo = 0, modificado = CURRENT_TIMESTAMP WHERE reserva_id = ?`,
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw createError('No se pudo eliminar la reserva', 500);
      }

      res.status(200).json({ status: 'success', message: 'Reserva eliminada exitosamente' });
    } catch (error) {
      next(error);
    }
  }
  
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
   * description: ID de la reserva a restaurar
   * responses:
   * 200:
   * description: Reserva restaurada exitosamente
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
  static async restore(req, res, next) {
    try {
      const { id } = req.params;

      const reservaExists = await query('SELECT 1 FROM reservas WHERE reserva_id = ? AND activo = 0', [id]);
      if (reservaExists.length === 0) {
        throw createError('Reserva no encontrada o ya activa', 404);
      }
      
      const result = await query(
        `UPDATE reservas SET activo = 1, modificado = CURRENT_TIMESTAMP WHERE reserva_id = ?`,
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw createError('No se pudo restaurar la reserva', 500);
      }

      res.status(200).json({ status: 'success', message: 'Reserva restaurada exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}

export default ReservasController;
