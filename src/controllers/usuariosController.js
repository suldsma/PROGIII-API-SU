import Usuario from '../models/Usuario.js';
import { createError } from '../middlewares/errorHandler.js';
import bcrypt from 'bcryptjs'; // AGREGADO: Importar la librería bcryptjs

/**
 * @swagger
 * tags:
 * name: Usuarios
 * description: BREAD completo para gestión de usuarios (Solo Administradores)
 */

class UsuariosController {
    
    /**
     * @swagger
     * /api/usuarios:
     * get:
     * summary: Obtener lista de usuarios (Browse)
     * tags: [Usuarios]
     * security:
     * - bearerAuth: []
     * parameters:
     * - in: query
     * name: page
     * schema:
     * type: integer
     * minimum: 1
     * default: 1
     * - in: query
     * name: limit
     * schema:
     * type: integer
     * minimum: 1
     * maximum: 100
     * default: 10
     * - in: query
     * name: search
     * schema:
     * type: string
     * maxLength: 100
     * description: Buscar en nombre, apellido o email
     * - in: query
     * name: includeInactive
     * schema:
     * type: boolean
     * default: false
     * description: Incluir usuarios inactivos
     * - in: query
     * name: tipoUsuario
     * schema:
     * type: integer
     * enum: [1, 2, 3]
     * description: Filtrar por tipo de usuario (1=Admin, 2=Empleado, 3=Cliente)
     */
    static async getAll(req, res, next) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = '', 
                includeInactive = false,
                tipoUsuario = null
            } = req.query;
            
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                includeInactive: includeInactive === 'true',
                tipoUsuario
            };
            
            const result = await Usuario.findAll(options);
            
            res.status(200).json({
                status: 'success',
                data: result.usuarios,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /api/usuarios/stats:
     * get:
     * summary: Obtener estadísticas de usuarios por tipo
     * tags: [Usuarios]
     * security:
     * - bearerAuth: []
     */
    static async getStats(req, res, next) {
        try {
            const stats = await Usuario.getStatsByType();
            
            res.status(200).json({
                status: 'success',
                message: 'Estadísticas de usuarios obtenidas exitosamente',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /api/usuarios/top-clientes:
     * get:
     * summary: Obtener clientes con más reservas
     * tags: [Usuarios]
     * security:
     * - bearerAuth: []
     * parameters:
     * - in: query
     * name: limit
     * schema:
     * type: integer
     * minimum: 1
     * maximum: 20
     * default: 5
     */
    static async getTopClientes(req, res, next) {
        try {
            const { limit = 5 } = req.query;
            
            const parsedLimit = parseInt(limit);
            if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 20) {
                throw createError('El límite debe ser un número entre 1 y 20', 400);
            }
            
            const topClientes = await Usuario.getTopClientes(parsedLimit);
            
            res.status(200).json({
                status: 'success',
                message: 'Clientes con más reservas obtenidos exitosamente',
                data: topClientes
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /api/usuarios/{id}:
     * get:
     * summary: Obtener usuario por ID (Read)
     * tags: [Usuarios]
     * security:
     * - bearerAuth: []
     * parameters:
     * - in: path
     * name: id
     * required: true
     * schema:
     * type: integer
     * minimum: 1
     */
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const usuario = await Usuario.findById(id);
            
            if (!usuario) {
                throw createError('Usuario no encontrado', 404);
            }
            
            res.status(200).json({
                status: 'success',
                data: usuario
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /api/usuarios:
     * post:
     * summary: Crear nuevo usuario (Add)
     * tags: [Usuarios]
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
     * - apellido
     * - nombre_usuario
     * - contrasenia
     * - tipo_usuario
     * properties:
     * nombre:
     * type: string
     * minLength: 2
     * maxLength: 50
     * example: "Juan"
     * apellido:
     * type: string
     * minLength: 2
     * maxLength: 50
     * example: "Pérez"
     * nombre_usuario:
     * type: string
     * format: email
     * maxLength: 50
     * example: "juan.perez@correo.com"
     * contrasenia:
     * type: string
     * minLength: 3
     * maxLength: 50
     * example: "password123"
     * tipo_usuario:
     * type: integer
     * enum: [1, 2, 3]
     * description: "1=Administrador, 2=Empleado, 3=Cliente"
     * example: 3
     * celular:
     * type: string
     * maxLength: 20
     * example: "1234567890"
     * foto:
     * type: string
     * maxLength: 255
     * example: "foto.jpg"
     */
    static async create(req, res, next) {
        try {
            const { nombre, apellido, nombre_usuario, contrasenia, tipo_usuario = 3, celular = null, foto = null } = req.body;
            
            // CORRECCIÓN CRÍTICA: Hashear la contraseña con bcrypt antes de guardarla.
            const hashedPassword = await bcrypt.hash(contrasenia, 10);

            const nuevoUsuario = await Usuario.create({
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                nombre_usuario: nombre_usuario.toLowerCase(),
                contrasenia: hashedPassword, // Usar la contraseña hasheada
                tipo_usuario: parseInt(tipo_usuario),
                celular,
                foto
            });
            
            res.status(201).json({
                status: 'success',
                message: 'Usuario creado exitosamente',
                data: nuevoUsuario
            });
        } catch (error) {
            if (error.message.includes('Ya existe un usuario')) {
                next(createError(error.message, 409));
            } else {
                next(error);
            }
        }
    }

    /**
     * @swagger
     * /api/usuarios/{id}:
     * put:
     * summary: Actualizar usuario completo (Edit)
     * tags: [Usuarios]
     * security:
     * - bearerAuth: []
     * parameters:
     * - in: path
     * name: id
     * required: true
     * schema:
     * type: integer
     * minimum: 1
     * requestBody:
     * required: true
     * content:
     * application/json:
     * schema:
     * type: object
     * required:
     * - nombre
     * - apellido
     * - nombre_usuario
     * - tipo_usuario
     * properties:
     * nombre:
     * type: string
     * minLength: 2
     * maxLength: 50
     * apellido:
     * type: string
     * minLength: 2
     * maxLength: 50
     * nombre_usuario:
     * type: string
     * format: email
     * maxLength: 50
     * contrasenia:
     * type: string
     * minLength: 3
     * maxLength: 50
     * description: "Opcional - solo si se quiere cambiar"
     * tipo_usuario:
     * type: integer
     * enum: [1, 2, 3]
     * celular:
     * type: string
     * maxLength: 20
     * foto:
     * type: string
     * maxLength: 255
     */
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre, apellido, nombre_usuario, contrasenia, tipo_usuario, celular, foto } = req.body;
            
            const usuario = await Usuario.findById(id);
            if (!usuario) {
                throw createError('Usuario no encontrado', 404);
            }
            
            const updateData = {};
            if (nombre !== undefined) updateData.nombre = nombre.trim();
            if (apellido !== undefined) updateData.apellido = apellido.trim();
            if (nombre_usuario !== undefined) updateData.nombre_usuario = nombre_usuario.toLowerCase();
            if (contrasenia !== undefined && contrasenia.trim() !== '') {
                // CORRECCIÓN: Hashear la contraseña si se proporciona
                updateData.contrasenia = await bcrypt.hash(contrasenia, 10);
            }
            if (tipo_usuario !== undefined) updateData.tipo_usuario = parseInt(tipo_usuario);
            if (celular !== undefined) updateData.celular = celular;
            if (foto !== undefined) updateData.foto = foto;
            
            const usuarioActualizado = await usuario.update(updateData);
            
            res.status(200).json({
                status: 'success',
                message: 'Usuario actualizado exitosamente',
                data: usuarioActualizado
            });
        } catch (error) {
            if (error.message.includes('Ya existe un usuario')) {
                next(createError(error.message, 409));
            } else {
                next(error);
            }
        }
    }

    /**
     * @swagger
     * /api/usuarios/{id}:
     * patch:
     * summary: Actualización parcial de usuario
     * tags: [Usuarios]
     * security:
     * - bearerAuth: []
     * parameters:
     * - in: path
     * name: id
     * required: true
     * schema:
     * type: integer
     * minimum: 1
     * requestBody:
     * required: true
     * content:
     * application/json:
     * schema:
     * type: object
     * properties:
     * nombre:
     * type: string
     * minLength: 2
     * maxLength: 50
     * apellido:
     * type: string
     * minLength: 2
     * maxLength: 50
     * nombre_usuario:
     * type: string
     * format: email
     * maxLength: 50
     * contrasenia:
     * type: string
     * minLength: 3
     * maxLength: 50
     * tipo_usuario:
     * type: integer
     * enum: [1, 2, 3]
     * celular:
     * type: string
     * maxLength: 20
     * foto:
     * type: string
     * maxLength: 255
     * activo:
     * type: boolean
     */
    static async partialUpdate(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre, apellido, nombre_usuario, contrasenia, tipo_usuario, celular, foto, activo } = req.body;
            
            const usuario = await Usuario.findById(id);
            if (!usuario) {
                throw createError('Usuario no encontrado', 404);
            }

            const updateData = {};
            
            if (nombre !== undefined) {
                updateData.nombre = nombre.trim();
            }
            
            if (apellido !== undefined) {
                updateData.apellido = apellido.trim();
            }
            
            if (nombre_usuario !== undefined) {
                updateData.nombre_usuario = nombre_usuario.toLowerCase();
            }
            
            if (contrasenia !== undefined && contrasenia.trim() !== '') {
                // CORRECCIÓN: Hashear la contraseña si se proporciona
                updateData.contrasenia = await bcrypt.hash(contrasenia, 10);
            }
            
            if (tipo_usuario !== undefined) {
                updateData.tipo_usuario = parseInt(tipo_usuario);
            }
            
            if (celular !== undefined) {
                updateData.celular = celular;
            }
            
            if (foto !== undefined) {
                updateData.foto = foto;
            }
            
            if (activo !== undefined) {
                updateData.activo = activo;
            }

            const usuarioActualizado = await usuario.update(updateData);

            res.status(200).json({
                status: 'success',
                message: 'Usuario actualizado parcialmente exitosamente',
                data: usuarioActualizado
            });
        } catch (error) {
            if (error.message.includes('Ya existe un usuario')) {
                next(createError(error.message, 409));
            } else {
                next(error);
            }
        }
    }

    /**
     * @swagger
     * /api/usuarios/{id}/change-tipo:
     * patch:
     * summary: Cambiar tipo de usuario
     * tags: [Usuarios]
     * security:
     * - bearerAuth: []
     * parameters:
     * - in: path
     * name: id
     * required: true
     * schema:
     * type: integer
     * minimum: 1
     * requestBody:
     * required: true
     * content:
     * application/json:
     * schema:
     * type: object
     * required:
     * - tipo_usuario
     * properties:
     * tipo_usuario:
     * type: integer
     * enum: [1, 2, 3]
     * description: "1=Administrador, 2=Empleado, 3=Cliente"
     */
    static async changeTipo(req, res, next) {
        try {
            const { id } = req.params;
            const { tipo_usuario } = req.body;
            
            const usuario = await Usuario.findById(id);
            if (!usuario) {
                throw createError('Usuario no encontrado', 404);
            }
            
            const usuarioActualizado = await usuario.changeTipo(tipo_usuario);
            
            res.status(200).json({
                status: 'success',
                message: 'Tipo de usuario actualizado exitosamente',
                data: usuarioActualizado
            });
        } catch (error) {
            if (error.message.includes('Tipo de usuario inválido')) {
                next(createError(error.message, 400));
            } else {
                next(error);
            }
        }
    }

    /**
     * @swagger
     * /api/usuarios/{id}/change-password:
     * patch:
     * summary: Cambiar contraseña de usuario
     * tags: [Usuarios]
     * security:
     * - bearerAuth: []
     * parameters:
     * - in: path
     * name: id
     * required: true
     * schema:
     * type: integer
     * minimum: 1
     * requestBody:
     * required: true
     * content:
     * application/json:
     * schema:
     * type: object
     * required:
     * - nueva_contrasenia
     * properties:
     * nueva_contrasenia:
     * type: string
     * minLength: 3
     * maxLength: 50
     */
    static async changePassword(req, res, next) {
        try {
            const { id } = req.params;
            const { nueva_contrasenia } = req.body;
            
            if (!nueva_contrasenia || nueva_contrasenia.length < 3) {
                throw createError('La nueva contraseña debe tener al menos 3 caracteres', 400);
            }
            
            const usuario = await Usuario.findById(id);
            if (!usuario) {
                throw createError('Usuario no encontrado', 404);
            }
            
            // CORRECCIÓN CRÍTICA: Hashear la nueva contraseña con bcrypt antes de llamar al modelo
            const hashedPassword = await bcrypt.hash(nueva_contrasenia, 10);

            // Se asume que el método `changePassword` del modelo recibe el hash, no el texto plano
            await usuario.changePassword(hashedPassword);
            
            res.status(200).json({
                status: 'success',
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /api/usuarios/{id}:
     * delete:
     * summary: Eliminar usuario (Delete)
     * tags: [Usuarios]
     * security:
     * - bearerAuth: []
     * parameters:
     * - in: path
     * name: id
     * required: true
     * schema:
     * type: integer
     * minimum: 1
     */
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            
            // Evitar que un administrador se elimine a sí mismo
            if (parseInt(id) === req.user.id) {
                throw createError('No puedes eliminar tu propio usuario', 400);
            }
            
            const usuario = await Usuario.findById(id);
            if (!usuario) {
                throw createError('Usuario no encontrado', 404);
            }
            
            if (!usuario.activo) {
                throw createError('El usuario ya está eliminado', 400);
            }
            
            await usuario.softDelete();
            
            res.status(200).json({
                status: 'success',
                message: 'Usuario eliminado exitosamente'
            });
        } catch (error) {
            if (error.message.includes('tiene reservas activas') || 
                error.message.includes('No puedes eliminar')) {
                next(createError(error.message, 400));
            } else {
                next(error);
            }
        }
    }
    
    /**
     * @swagger
     * /api/usuarios/{id}/restore:
     * patch:
     * summary: Restaurar usuario eliminado
     * tags: [Usuarios]
     * security:
     * - bearerAuth: []
     * parameters:
     * - in: path
     * name: id
     * required: true
     * schema:
     * type: integer
     * minimum: 1
     */
    static async restore(req, res, next) {
        try {
            const { id } = req.params;
            
            const usuario = await Usuario.findById(id);
            if (!usuario) {
                throw createError('Usuario no encontrado', 404);
            }
            
            if (usuario.activo) {
                throw createError('El usuario ya está activo', 400);
            }
            
            const usuarioRestaurado = await usuario.restore();
            
            res.status(200).json({
                status: 'success',
                message: 'Usuario restaurado exitosamente',
                data: usuarioRestaurado
            });
        } catch (error) {
            if (error.message.includes('No se puede restaurar')) {
                next(createError(error.message, 400));
            } else {
                next(error);
            }
        }
    }
}

export default UsuariosController;