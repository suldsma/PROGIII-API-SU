import Salon from '../models/Salon.js';
import { createError, asyncHandler } from '../middlewares/errorHandler.js';

class SalonesController {
    /**
     * @swagger
     * /api/salones:
     *   get:
     *     summary: Obtener lista de salones (Browse)
     *     description: Obtiene una lista paginada de salones con filtros opcionales
     *     tags: [Salones]
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
     *         description: Término de búsqueda en título o dirección
     *       - in: query
     *         name: includeInactive
     *         schema:
     *           type: boolean
     *           default: false
     *         description: Incluir salones inactivos (solo administradores)
     *     responses:
     *       200:
     *         description: Lista de salones obtenida exitosamente
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    static getAll = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, search = '', includeInactive = false } = req.query;
        
        // Solo administradores pueden ver inactivos
        const canSeeInactive = req.user.tipo === 1 && includeInactive === true;
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            includeInactive: canSeeInactive
        };
        
        const result = await Salon.findAll(options);
        
        res.status(200).json({
            status: 'success',
            message: 'Salones obtenidos exitosamente',
            data: result.salones.map(s => s.toJSON()),
            pagination: result.pagination
        });
    });

    /**
     * @swagger
     * /api/salones/{id}:
     *   get:
     *     summary: Obtener salón por ID (Read)
     *     tags: [Salones]
     *     security:
     *       - bearerAuth: []
     */
    static getById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        // Administradores pueden ver cualquier salón, otros solo activos
        const salon = req.user.tipo === 1 
            ? await Salon.findById(id)
            : await Salon.findActiveById(id);
            
        if (!salon) {
            throw createError('Salón no encontrado', 404);
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Salón obtenido exitosamente',
            data: salon.toJSON()
        });
    });

    /**
     * @swagger
     * /api/salones:
     *   post:
     *     summary: Crear nuevo salón (Add)
     *     tags: [Salones]
     *     security:
     *       - bearerAuth: []
     */
    static create = asyncHandler(async (req, res) => {
        const { titulo, direccion, latitud, longitud, capacidad, importe } = req.body;
        
        // Validar datos
        const errors = Salon.validateData(req.body);
        if (errors.length > 0) {
            throw createError('Datos de entrada inválidos', 400, errors);
        }
        
        const newSalon = await Salon.create({
            titulo: titulo.trim(),
            direccion: direccion.trim(),
            latitud,
            longitud,
            capacidad: parseInt(capacidad),
            importe: parseFloat(importe)
        });
        
        res.status(201).json({
            status: 'success',
            message: 'Salón creado exitosamente',
            data: newSalon.toJSON()
        });
    });

    /**
     * @swagger
     * /api/salones/{id}:
     *   put:
     *     summary: Actualizar salón completo (Edit)
     *     tags: [Salones]
     *     security:
     *       - bearerAuth: []
     */
    static update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { titulo, direccion, latitud, longitud, capacidad, importe } = req.body;
        
        // Validar datos
        const errors = Salon.validateData(req.body, true);
        if (errors.length > 0) {
            throw createError('Datos de entrada inválidos', 400, errors);
        }
        
        const updatedSalon = await Salon.update(id, {
            titulo: titulo?.trim(),
            direccion: direccion?.trim(),
            latitud,
            longitud,
            capacidad: capacidad ? parseInt(capacidad) : undefined,
            importe: importe ? parseFloat(importe) : undefined
        });
        
        if (!updatedSalon) {
            throw createError('Salón no encontrado', 404);
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Salón actualizado exitosamente',
            data: updatedSalon.toJSON()
        });
    });

    /**
     * @swagger
     * /api/salones/{id}:
     *   delete:
     *     summary: Eliminar salón (Delete - soft delete)
     *     tags: [Salones]
     *     security:
     *       - bearerAuth: []
     */
    static softDelete = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        const salon = await Salon.findById(id);
        if (!salon) {
            throw createError('Salón no encontrado', 404);
        }
        
        if (!salon.activo) {
            throw createError('El salón ya está eliminado', 400);
        }
        
        await salon.softDelete();
        
        res.status(200).json({
            status: 'success',
            message: 'Salón eliminado exitosamente'
        });
    });

    /**
     * @swagger
     * /api/salones/{id}/restore:
     *   patch:
     *     summary: Restaurar salón eliminado
     *     tags: [Salones]
     *     security:
     *       - bearerAuth: []
     */
    static restore = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        const salon = await Salon.findById(id);
        if (!salon) {
            throw createError('Salón no encontrado', 404);
        }
        
        if (salon.activo) {
            throw createError('El salón ya está activo', 400);
        }
        
        const salonRestaurado = await salon.restore();
        
        res.status(200).json({
            status: 'success',
            message: 'Salón restaurado exitosamente',
            data: salonRestaurado.toJSON()
        });
    });

    /**
     * @swagger
     * /api/salones/{id}:
     *   patch:
     *     summary: Actualización parcial de salón
     *     tags: [Salones]
     *     security:
     *       - bearerAuth: []
     */
    static partialUpdate = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { titulo, direccion, latitud, longitud, capacidad, importe, activo } = req.body;
        
        const salon = await Salon.findById(id);
        if (!salon) {
            throw createError('Salón no encontrado', 404);
        }

        const updateData = {};
        
        // Solo incluye los campos que están presentes en el body
        if (titulo !== undefined) {
            updateData.titulo = titulo.trim();
        }
        
        if (direccion !== undefined) {
            updateData.direccion = direccion.trim();
        }
        
        if (latitud !== undefined) {
            updateData.latitud = latitud;
        }
        
        if (longitud !== undefined) {
            updateData.longitud = longitud;
        }
        
        if (capacidad !== undefined) {
            updateData.capacidad = parseInt(capacidad);
        }
        
        if (importe !== undefined) {
            updateData.importe = parseFloat(importe);
        }

        const salonActualizado = await salon.update(updateData);

        res.status(200).json({
            status: 'success',
            message: 'Salón actualizado parcialmente exitosamente',
            data: salonActualizado.toJSON()
        });
    });

    /**
     * Obtener salones más utilizados (estadística)
     */
    static getMostUsed = asyncHandler(async (req, res) => {
        const { limit = 5 } = req.query;
        
        // Verifica que el límite sea un número válido
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 20) {
            throw createError('El límite debe ser un número entre 1 y 20', 400);
        }
        
        const salonesMasUsados = await Salon.getMostUsed(parsedLimit);
        
        res.status(200).json({
            status: 'success',
            message: 'Salones más utilizados obtenidos exitosamente',
            data: salonesMasUsados
        });
    });
}

export default SalonesController;