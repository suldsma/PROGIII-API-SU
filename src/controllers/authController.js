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
   * post:
   * summary: Iniciar sesión y obtener tokens
   * tags: [Autenticación]
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * type: object
   * required:
   * - nombre_usuario
   * - password
   * properties:
   * nombre_usuario:
   * type: string
   * description: Nombre de usuario para el inicio de sesión.
   * example: "admin"
   * password:
   * type: string
   * description: Contraseña del usuario.
   * example: "password123"
   * responses:
   * 200:
   * description: Inicio de sesión exitoso. Retorna un token de acceso y un token de refresco.
   * content:
   * application/json:
   * schema:
   * type: object
   * properties:
   * status:
   * type: string
   * example: "success"
   * data:
   * type: object
   * properties:
   * access_token:
   * type: string
   * refresh_token:
   * type: string
   * user:
   * type: object
   * properties:
   * usuario_id:
   * type: integer
   * nombre_usuario:
   * type: string
   * rol:
   * type: string
   * 401:
   * $ref: '#/components/responses/Unauthorized'
   * 500:
   * $ref: '#/components/responses/InternalServerError'
   */
  static async login(req, res, next) {
    // Lógica del controlador...
  }
  
  /**
   * @swagger
   * /api/auth/me:
   * get:
   * summary: Obtener información del usuario autenticado
   * tags: [Autenticación]
   * security:
   * - bearerAuth: []
   * responses:
   * 200:
   * description: Retorna la información del usuario actual.
   * content:
   * application/json:
   * schema:
   * type: object
   * properties:
   * status:
   * type: string
   * example: "success"
   * data:
   * type: object
   * properties:
   * usuario_id:
   * type: integer
   * nombre_usuario:
   * type: string
   * rol:
   * type: string
   * 401:
   * $ref: '#/components/responses/Unauthorized'
   * 500:
   * $ref: '#/components/responses/InternalServerError'
   */
  static async getProfile(req, res, next) {
    // Lógica del controlador...
  }

  /**
   * @swagger
   * /api/auth/refresh:
   * post:
   * summary: Refrescar el token de acceso
   * tags: [Autenticación]
   * requestBody:
   * required: true
   * content:
   * application/json:
   * schema:
   * type: object
   * required:
   * - refresh_token
   * properties:
   * refresh_token:
   * type: string
   * description: Token de refresco del usuario.
   * example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * responses:
   * 200:
   * description: Token de acceso refrescado exitosamente.
   * content:
   * application/json:
   * schema:
   * type: object
   * properties:
   * status:
   * type: string
   * example: "success"
   * data:
   * type: object
   * properties:
   * access_token:
   * type: string
   * 401:
   * $ref: '#/components/responses/Unauthorized'
   * 500:
   * $ref: '#/components/responses/InternalServerError'
   */
  static async refreshToken(req, res, next) {
    // Lógica del controlador...
  }
}

export default AuthController;