import Servicio from '../models/Servicio.js';
import { createError } from '../middlewares/errorHandler.js';

class ServiciosController {
    
    // Método getAll
    static async getAll(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', includeInactive = false } = req.query;
            const canSeeInactive = req.user.tipo === 1 && includeInactive === 'true';
            
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                includeInactive: canSeeInactive
            };
            
            const result = await Servicio.findAll(options);
            
            res.status(200).json({
                status: 'success',
                data: result.servicios,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    // Método getMostUsed 
    static async getMostUsed(req, res, next) {
        try {
            const { limit = 5 } = req.query;
            
            // Verifica que el límite sea un número válido
            const parsedLimit = parseInt(limit);
            if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 20) {
                throw createError('El límite debe ser un número entre 1 y 20', 400);
            }
            
            const serviciosMasUsados = await Servicio.getMostUsed(parsedLimit);
            
            res.status(200).json({
                status: 'success',
                message: 'Servicios más utilizados obtenidos exitosamente',
                data: serviciosMasUsados
            });
        } catch (error) {
            next(error);
        }
    }

    // Método getById
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const servicio = req.user.tipo === 1 
                ? await Servicio.findById(id)
                : await Servicio.findActiveById(id);
            
            if (!servicio) {
                throw createError('Servicio no encontrado', 404);
            }
            
            res.status(200).json({
                status: 'success',
                data: servicio
            });
        } catch (error) {
            next(error);
        }
    }

    // Método create
    static async create(req, res, next) {
        try {
            const { descripcion, importe } = req.body;
            
            const nuevoServicio = await Servicio.create({
                descripcion: descripcion.trim(),
                importe: parseFloat(importe)
            });
            
            res.status(201).json({
                status: 'success',
                message: 'Servicio creado exitosamente',
                data: nuevoServicio
            });
        } catch (error) {
            if (error.message.includes('Ya existe un servicio')) {
                next(createError(error.message, 409));
            } else {
                next(error);
            }
        }
    }

    // Método update (PUT - actualización completa)
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const { descripcion, importe } = req.body;
            
            const servicio = await Servicio.findById(id);
            if (!servicio) {
                throw createError('Servicio no encontrado', 404);
            }
            
            const updateData = {};
            if (descripcion !== undefined) updateData.descripcion = descripcion.trim();
            if (importe !== undefined) updateData.importe = parseFloat(importe);
            
            const servicioActualizado = await servicio.update(updateData);
            
            res.status(200).json({
                status: 'success',
                message: 'Servicio actualizado exitosamente',
                data: servicioActualizado
            });
        } catch (error) {
            if (error.message.includes('Ya existe un servicio')) {
                next(createError(error.message, 409));
            } else {
                next(error);
            }
        }
    }

    // Método delete
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            
            const servicio = await Servicio.findById(id);
            if (!servicio) {
                throw createError('Servicio no encontrado', 404);
            }
            
            if (!servicio.activo) {
                throw createError('El servicio ya está eliminado', 400);
            }
            
            await servicio.softDelete();
            
            res.status(200).json({
                status: 'success',
                message: 'Servicio eliminado exitosamente'
            });
        } catch (error) {
            if (error.message.includes('está siendo usado')) {
                next(createError(error.message, 400));
            } else {
                next(error);
            }
        }
    }
    
    // Método restore
    static async restore(req, res, next) {
        try {
            const { id } = req.params;
            
            const servicio = await Servicio.findById(id);
            if (!servicio) {
                throw createError('Servicio no encontrado', 404);
            }
            
            if (servicio.activo) {
                throw createError('El servicio ya está activo', 400);
            }
            
            const servicioRestaurado = await servicio.restore();
            
            res.status(200).json({
                status: 'success',
                message: 'Servicio restaurado exitosamente',
                data: servicioRestaurado
            });
        } catch (error) {
            next(error);
        }
    }

    // Método partialUpdate (PATCH - actualización parcial)
    static async partialUpdate(req, res, next) {
        try {
            const { id } = req.params;
            const { descripcion, importe, activo } = req.body;
            
            const servicio = await Servicio.findById(id);
            if (!servicio) {
                throw createError('Servicio no encontrado', 404);
            }

            const updateData = {};
            
            // Solo incluye los campos que están presentes en el body
            if (descripcion !== undefined) {
                updateData.descripcion = descripcion.trim();
            }
            
            if (importe !== undefined) {
                updateData.importe = parseFloat(importe);
            }
            
            if (activo !== undefined) {
                updateData.activo = activo;
            }

            const servicioActualizado = await servicio.update(updateData);

            res.status(200).json({
                status: 'success',
                message: 'Servicio actualizado parcialmente exitosamente',
                data: servicioActualizado
            });
        } catch (error) {
            if (error.message.includes('Ya existe un servicio')) {
                next(createError(error.message, 409));
            } else {
                next(error);
            }
        }
    }
}

export default ServiciosController;