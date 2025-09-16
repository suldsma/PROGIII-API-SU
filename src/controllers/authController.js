import { query } from '../config/database.js';
import { createError } from '../middlewares/errorHandler.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ROLES } from '../middlewares/auth.js';

/**
 * @swagger
 * tags:
 * - name: Autenticación
 * description: Gestión de usuarios y autenticación
 */

class AuthController {
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Iniciar sesión y obtener token
   *     tags: [Autenticación]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Inicio de sesión exitoso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  static async login(req, res, next) {
    try {
      const { nombre_usuario, contrasenia } = req.body;
      
      // Buscar usuario por nombre_usuario
      const usuarios = await query(
        `SELECT usuario_id, nombre, apellido, nombre_usuario, contrasenia, tipo_usuario, celular, foto 
         FROM usuarios 
         WHERE nombre_usuario = ? AND activo = 1`,
        [nombre_usuario]
      );

      if (usuarios.length === 0) {
        throw createError('Credenciales inválidas', 401);
      }

      const usuario = usuarios[0];
      
      // Verificar contraseña (usando MD5 como está en la BD de ejemplo)
      // NOTA: MD5 no es seguro, deberías migrar a bcrypt
      const crypto = await import('crypto');
      const hashedPassword = crypto.createHash('md5').update(contrasenia).digest('hex');
      
      if (hashedPassword !== usuario.contrasenia) {
        throw createError('Credenciales inválidas', 401);
      }

      // Generar JWT token
      const token = jwt.sign(
        { 
          userId: usuario.usuario_id,
          tipo: usuario.tipo_usuario 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Determinar tipo de usuario
      const getTipoUsuarioTexto = (tipo) => {
        switch (tipo) {
          case 1: return 'Administrador';
          case 2: return 'Empleado';
          case 3: return 'Cliente';
          default: return 'Desconocido';
        }
      };

      // Respuesta exitosa
      res.status(200).json({
        status: 'success',
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: usuario.usuario_id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            nombre_usuario: usuario.nombre_usuario,
            tipo_usuario: usuario.tipo_usuario,
            tipo_usuario_texto: getTipoUsuarioTexto(usuario.tipo_usuario),
            celular: usuario.celular,
            foto: usuario.foto
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Obtener información del usuario autenticado
   *     tags: [Autenticación]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Información del usuario obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/Usuario'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      
      const usuarios = await query(
        `SELECT usuario_id, nombre, apellido, nombre_usuario, tipo_usuario, celular, foto, creado 
         FROM usuarios 
         WHERE usuario_id = ? AND activo = 1`,
        [userId]
      );

      if (usuarios.length === 0) {
        throw createError('Usuario no encontrado', 404);
      }

      const usuario = usuarios[0];
      
      const getTipoUsuarioTexto = (tipo) => {
        switch (tipo) {
          case 1: return 'Administrador';
          case 2: return 'Empleado';
          case 3: return 'Cliente';
          default: return 'Desconocido';
        }
      };

      res.status(200).json({
        status: 'success',
        data: {
          id: usuario.usuario_id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          nombre_usuario: usuario.nombre_usuario,
          tipo_usuario: usuario.tipo_usuario,
          tipo_usuario_texto: getTipoUsuarioTexto(usuario.tipo_usuario),
          celular: usuario.celular,
          foto: usuario.foto,
          creado: usuario.creado
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refrescar el token de acceso
   *     tags: [Autenticación]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Token refrescado exitosamente
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
   *                   example: Token refrescado exitosamente
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       description: Nuevo token JWT
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  static async refreshToken(req, res, next) {
    try {
      const userId = req.user.id;
      const userTipo = req.user.tipo;
      
      // Verificar que el usuario sigue activo
      const usuarios = await query(
        'SELECT usuario_id FROM usuarios WHERE usuario_id = ? AND activo = 1',
        [userId]
      );

      if (usuarios.length === 0) {
        throw createError('Usuario no encontrado o inactivo', 401);
      }

      // Generar nuevo token
      const token = jwt.sign(
        { 
          userId: userId,
          tipo: userTipo 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.status(200).json({
        status: 'success',
        message: 'Token refrescado exitosamente',
        data: {
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;