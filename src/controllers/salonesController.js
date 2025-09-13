import Salon from '../models/Salon.js';
import { createError, asyncHandler } from '../middlewares/errorHandler.js';

class SalonesController {
    static getAll = asyncHandler(async (req, res) => {
        const { page, limit, includeInactive } = req.query;
        const options = {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            includeInactive: includeInactive === 'true'
        };
        const salones = await Salon.findAll(options);
        res.status(200).json({
            status: 'success',
            message: 'Salones obtenidos exitosamente',
            data: salones.map(s => s.toJSON())
        });
    });

    static getById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const salon = await Salon.findById(id);
        if (!salon) {
            throw createError('Salón no encontrado', 404);
        }
        res.status(200).json({
            status: 'success',
            message: 'Salón obtenido exitosamente',
            data: salon.toJSON()
        });
    });

    static create = asyncHandler(async (req, res) => {
        const newSalon = await Salon.create(req.body);
        res.status(201).json({
            status: 'success',
            message: 'Salón creado exitosamente',
            data: newSalon.toJSON()
        });
    });

    static update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updatedSalon = await Salon.update(id, req.body);
        if (!updatedSalon) {
            throw createError('Salón no encontrado', 404);
        }
        res.status(200).json({
            status: 'success',
            message: 'Salón actualizado exitosamente',
            data: updatedSalon.toJSON()
        });
    });

    static softDelete = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const salon = await Salon.findById(id);
        if (!salon) {
            throw createError('Salón no encontrado', 404);
        }
        await salon.softDelete();
        res.status(200).json({
            status: 'success',
            message: 'Salón eliminado (soft delete) exitosamente'
        });
    });

    static restore = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const salon = await Salon.findById(id);
        if (!salon) {
            throw createError('Salón no encontrado', 404);
        }
        await salon.restore();
        res.status(200).json({
            status: 'success',
            message: 'Salón restaurado exitosamente'
        });
    });
}

export default SalonesController;