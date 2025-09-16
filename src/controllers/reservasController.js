import Reserva from '../models/Reserva.js';
import { createError } from '../middlewares/errorHandler.js';

/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Gestión de reservas - BREAD completo solo para Administradores
 */

class ReservasController {
    
    /**
     * @swagger
     * /api/reservas:
     *   get:
     *     summary: Obtener lista de reservas (Browse)
     *     tags: [Reservas]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 10
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *           maxLength: 100
     *         description: Buscar en temática, nombre usuario o salón
     *       - in: query
     *         name: includeInactive
     *         schema:
     *           type: boolean
     *           default: false
     *         description: Incluir reservas inactivas (solo administradores)
     *       - in: query
     *         name: fechaDesde
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: fechaHasta
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: usuarioId
     *         schema:
     *           type: integer
     *           minimum: 1
     *       - in: query
     *         name: salonId
     *         schema:
     *           type: integer
     *           minimum: 1
     *       - in: query
     *         name: turnoId
     *         schema:
     *           type: integer
     *           minimum: 1
     */
    static async getAll(req, res, next) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = '', 
                includeInactive = false,
                fechaDesde,
                fechaHasta,
                usuarioId,
                salonId,
                turnoId
            } = req.query;
            
            // Los clientes solo pueden ver sus propias reservas
            let finalUsuarioId = usuarioId;
            if (req.user.tipo === 3) { // Cliente
                finalUsuarioId = req.user.id;
            }
            
            const canSeeInactive = req.user.tipo === 1 && includeInactive === 'true';
            
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                includeInactive: canSeeInactive,
                fechaDesde,
                fechaHasta,
                usuarioId: finalUsuarioId,
                salonId,
                turnoId,
                includeRelations: true
            };
            
            const result = await Reserva.findAll(options);
            
            res.status(200).json({
                status: 'success',
                data: result.reservas,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /api/reservas/stats/monthly:
     *   get:
     *     summary: Obtener estadísticas de reservas por mes
     *     tags: [Reservas]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: year
     *         schema:
     *           type: integer
     *           minimum: 2020
     *           maximum: 2030
     *         description: Año para las estadísticas (default: año actual)
     */
    static async getStatsByMonth(req, res, next) {
        try {
            const { year = new Date().getFullYear() } = req.query;
            
            const parsedYear = parseInt(year);
            if (isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2030) {
                throw createError('El año debe estar entre 2020 y 2030', 400);
            }
            
            const stats = await Reserva.getStatsByMonth(parsedYear);
            
            res.status(200).json({
                status: 'success',
                message: `Estadísticas de reservas para ${parsedYear} obtenidas exitosamente`,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /api/reservas/upcoming:
     *   get:
     *     summary: Obtener reservas próximas (para recordatorios)
     *     tags: [Reservas]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: dias
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 30
     *           default: 1
     *         description: Días de anticipación para considerar reservas próximas
     */
    static async getUpcoming(req, res, next) {
        try {
            const { dias = 1 } = req.query;
            
            const parsedDias = parseInt(dias);
            if (isNaN(parsedDias) || parsedDias < 1 || parsedDias > 30) {
                throw createError('Los días deben estar entre 1 y 30', 400);
            }
            
            const reservasProximas = await Reserva.getUpcoming(parsedDias);
            
            res.status(200).json({
                status: 'success',
                message: 'Reservas próximas obtenidas exitosamente',
                data: reservasProximas
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /api/reservas/{id}:
     *   get:
     *     summary: Obtener reserva por ID (Read)
     *     tags: [Reservas]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const reserva = await Reserva.findById(id, true);
            
            if (!reserva) {
                throw createError('Reserva no encontrada', 404);
            }
            
            // Los clientes solo pueden ver sus propias reservas
            if (req.user.tipo === 3 && reserva.usuario_id !== req.user.id) {
                throw createError('No tienes permisos para ver esta reserva', 403);
            }
            
            // Los empleados solo pueden ver reservas activas
            if (req.user.tipo === 2 && !reserva.activo) {
                throw createError('Reserva no encontrada', 404);
            }
            
            res.status(200).json({
                status: 'success',
                data: reserva
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /api/reservas:
     *   post:
     *     summary: Crear nueva reserva (Add)
     *     tags: [Reservas]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - fecha_reserva
     *               - salon_id
     *               - turno_id
     *             properties:
     *               fecha_reserva:
     *                 type: string
     *                 format: date
     *                 example: "2025-12-25"
     *               salon_id:
     *                 type: integer
     *                 minimum: 1
     *                 example: 1
     *               turno_id:
     *                 type: integer
     *                 minimum: 1
     *                 example: 1
     *               foto_cumpleaniero:
     *                 type: string
     *                 maxLength: 255
     *                 example: "cumpleaniero.jpg"
     *               tematica:
     *                 type: string
     *                 maxLength: 255
     *                 example: "Temática de superhéroes"
     *               servicios:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     servicio_id:
     *                       type: integer
     *                       minimum: 1
     *                 example: [{"servicio_id": 1}, {"servicio_id": 2}]
     */
    static async create(req, res, next) {
        try {
            const { fecha_reserva, salon_id, turno_id, foto_cumpleaniero, tematica, servicios = [] } = req.body;
            
            // Los clientes solo pueden crear reservas para sí mismos
            const usuario_id = req.user.tipo === 3 ? req.user.id : req.body.usuario_id;
            
            if (!usuario_id) {
                throw createError('El usuario_id es requerido para administradores y empleados', 400);
            }
            
            const nuevaReserva = await Reserva.create({
                fecha_reserva,
                salon_id: parseInt(salon_id),
                usuario_id: parseInt(usuario_id),
                turno_id: parseInt(turno_id),
                foto_cumpleaniero,
                tematica,
                servicios
            });
            
            res.status(201).json({
                status: 'success',
                message: 'Reserva creada exitosamente',
                data: nuevaReserva
            });
        } catch (error) {
            if (error.message.includes('no está disponible') || 
                error.message.includes('no existe') ||
                error.message.includes('no está activo')) {
                next(createError(error.message, 400));
            } else {
                next(error);
            }
        }
    }

    /**
     * @swagger
     * /api/reservas/{id}:
     *   put:
     *     summary: Actualizar reserva completa (Edit) - Solo Administradores
     *     tags: [Reservas]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               fecha_reserva:
     *                 type: string
     *                 format: date
     *               salon_id:
     *                 type: integer
     *                 minimum: 1
     *               turno_id:
     *                 type: integer
     *                 minimum: 1
     *               foto_cumpleaniero:
     *                 type: string
     *                 maxLength: 255
     *               tematica:
     *                 type: string
     *                 maxLength: 255
     *               servicios:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     servicio_id:
     *                       type: integer
     *                       minimum: 1
     */
    static async update(req, res, next) {
        try {
            // Solo administradores pueden modificar reservas según requerimientos
            if (req.user.tipo !== 1) {
                throw createError('Solo los administradores pueden modificar reservas', 403);
            }
            
            const { id } = req.params;
            const { fecha_reserva, salon_id, turno_id, foto_cumpleaniero, tematica, servicios } = req.body;
            
            const reserva = await Reserva.findById(id, false);
            if (!reserva) {
                throw createError('Reserva no encontrada', 404);
            }
            
            const updateData = {};
            if (fecha_reserva !== undefined) updateData.fecha_reserva = fecha_reserva;
            if (salon_id !== undefined) updateData.salon_id = parseInt(salon_id);
            if (turno_id !== undefined) updateData.turno_id = parseInt(turno_id);
            if (foto_cumpleaniero !== undefined) updateData.foto_cumpleaniero = foto_cumpleaniero;
            if (tematica !== undefined) updateData.tematica = tematica;
            if (servicios !== undefined) updateData.servicios = servicios;
            
            const reservaActualizada = await reserva.update(updateData);
            
            res.status(200).json({
                status: 'success',
                message: 'Reserva actualizada exitosamente',
                data: reservaActualizada
            });
        } catch (error) {
            if (error.message.includes('no está disponible') || 
                error.message.includes('no existe') ||
                error.message.includes('no está activo') ||
                error.message.includes('Solo los administradores')) {
                next(createError(error.message, error.message.includes('Solo los administradores') ? 403 : 400));
            } else {
                next(error);
            }
        }
    }

    /**
     * @swagger
     * /api/reservas/{id}:
     *   patch:
     *     summary: Actualización parcial de reserva - Solo Administradores
     *     tags: [Reservas]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               fecha_reserva:
     *                 type: string
     *                 format: date
     *               salon_id:
     *                 type: integer
     *                 minimum: 1
     *               turno_id:
     *                 type: integer
     *                 minimum: 1
     *               foto_cumpleaniero:
     *                 type: string
     *                 maxLength: 255
     *               tematica:
     *                 type: string
     *                 maxLength: 255
     *               activo:
     *                 type: boolean
     *               servicios:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     servicio_id:
     *                       type: integer
     *                       minimum: 1
     */
    static async partialUpdate(req, res, next) {
        try {
            // Solo administradores pueden modificar reservas
            if (req.user.tipo !== 1) {
                throw createError('Solo los administradores pueden modificar reservas', 403);
            }
            
            const { id } = req.params;
            const { fecha_reserva, salon_id, turno_id, foto_cumpleaniero, tematica, servicios, activo } = req.body;
            
            const reserva = await Reserva.findById(id, false);
            if (!reserva) {
                throw createError('Reserva no encontrada', 404);
            }

            const updateData = {};
            
            if (fecha_reserva !== undefined) {
                updateData.fecha_reserva = fecha_reserva;
            }
            
            if (salon_id !== undefined) {
                updateData.salon_id = parseInt(salon_id);
            }
            
            if (turno_id !== undefined) {
                updateData.turno_id = parseInt(turno_id);
            }
            
            if (foto_cumpleaniero !== undefined) {
                updateData.foto_cumpleaniero = foto_cumpleaniero;
            }
            
            if (tematica !== undefined) {
                updateData.tematica = tematica;
            }
            
            if (servicios !== undefined) {
                updateData.servicios = servicios;
            }
            
            if (activo !== undefined) {
                updateData.activo = activo;
            }

            const reservaActualizada = await reserva.update(updateData);

            res.status(200).json({
                status: 'success',
                message: 'Reserva actualizada parcialmente exitosamente',
                data: reservaActualizada
            });
        } catch (error) {
            if (error.message.includes('no está disponible') || 
                error.message.includes('no existe') ||
                error.message.includes('no está activo') ||
                error.message.includes('Solo los administradores')) {
                next(createError(error.message, error.message.includes('Solo los administradores') ? 403 : 400));
            } else {
                next(error);
            }
        }
    }

    /**
     * @swagger
     * /api/reservas/{id}:
     *   delete:
     *     summary: Eliminar reserva (Delete) - Solo Administradores
     *     tags: [Reservas]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     */
    static async delete(req, res, next) {
        try {
            // Solo administradores pueden eliminar reservas
            if (req.user.tipo !== 1) {
                throw createError('Solo los administradores pueden eliminar reservas', 403);
            }
            
            const { id } = req.params;
            
            const reserva = await Reserva.findById(id, false);
            if (!reserva) {
                throw createError('Reserva no encontrada', 404);
            }
            
            if (!reserva.activo) {
                throw createError('La reserva ya está eliminada', 400);
            }
            
            await reserva.softDelete();
            
            res.status(200).json({
                status: 'success',
                message: 'Reserva eliminada exitosamente'
            });
        } catch (error) {
            if (error.message.includes('Solo los administradores')) {
                next(createError(error.message, 403));
            } else {
                next(error);
            }
        }
    }
    
    /**
     * @swagger
     * /api/reservas/{id}/restore:
     *   patch:
     *     summary: Restaurar reserva eliminada - Solo Administradores
     *     tags: [Reservas]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     */
    static async restore(req, res, next) {
        try {
            // Solo administradores pueden restaurar reservas
            if (req.user.tipo !== 1) {
                throw createError('Solo los administradores pueden restaurar reservas', 403);
            }
            
            const { id } = req.params;
            
            const reserva = await Reserva.findById(id, false);
            if (!reserva) {
                throw createError('Reserva no encontrada', 404);
            }
            
            if (reserva.activo) {
                throw createError('La reserva ya está activa', 400);
            }
            
            const reservaRestaurada = await reserva.restore();
            
            res.status(200).json({
                status: 'success',
                message: 'Reserva restaurada exitosamente',
                data: reservaRestaurada
            });
        } catch (error) {
            if (error.message.includes('Solo los administradores')) {
                next(createError(error.message, 403));
            } else if (error.message.includes('No se puede restaurar')) {
                next(createError(error.message, 400));
            } else {
                next(error);
            }
        }
    }

    /**
     * @swagger
     * /api/reservas/check-availability:
     *   post:
     *     summary: Verificar disponibilidad para nueva reserva
     *     tags: [Reservas]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - salon_id
     *               - fecha_reserva
     *               - turno_id
     *             properties:
     *               salon_id:
     *                 type: integer
     *                 minimum: 1
     *               fecha_reserva:
     *                 type: string
     *                 format: date
     *               turno_id:
     *                 type: integer
     *                 minimum: 1
     */
    static async checkAvailability(req, res, next) {
        try {
            const { salon_id, fecha_reserva, turno_id } = req.body;
            
            if (!salon_id || !fecha_reserva || !turno_id) {
                throw createError('salon_id, fecha_reserva y turno_id son requeridos', 400);
            }
            
            const disponible = await Reserva.checkAvailability(
                parseInt(salon_id), 
                fecha_reserva, 
                parseInt(turno_id)
            );
            
            res.status(200).json({
                status: 'success',
                data: {
                    salon_id: parseInt(salon_id),
                    fecha_reserva,
                    turno_id: parseInt(turno_id),
                    disponible
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

export default ReservasController;