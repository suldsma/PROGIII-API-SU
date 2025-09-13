import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { createError } from './errorHandler.js';

// Middleware para verificar JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Token de acceso requerido', 401);
    }

    const token = authHeader.substring(7); // Remover 'Bearer '
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verifica que el usuario aún existe y está activo
    const usuarios = await query(
      'SELECT usuario_id, nombre, apellido, tipo_usuario FROM usuarios WHERE usuario_id = ? AND activo = 1',
      [decoded.userId]
    );

    if (usuarios.length === 0) {
      throw createError('Usuario no encontrado o inactivo', 401);
    }

    req.user = {
      id: usuarios[0].usuario_id,
      nombre: usuarios[0].nombre,
      apellido: usuarios[0].apellido,
      tipo: usuarios[0].tipo_usuario
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar roles específicos
const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError('Usuario no autenticado', 401));
    }

    if (!rolesPermitidos.includes(req.user.tipo)) {
      return next(createError('No tienes permisos para acceder a este recurso', 403));
    }

    next();
  };
};

// Roles del sistema
const ROLES = {
  ADMINISTRADOR: 1,
  EMPLEADO: 2,
  CLIENTE: 3
};

export {
  verifyToken,
  requireRole,
  ROLES
};