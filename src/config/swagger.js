import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

class SwaggerConfig {
  constructor(app) {
    this.app = app;
    this.options = this._getOptions();
    this.specs = swaggerJSDoc(this.options);
  }

  _getOptions() {
    return {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'PROGIII API - Sistema de Reservas',
          version: '1.0.0',
          description: `
            API REST para gestión de reservas de salones de cumpleaños.
            
            **Funcionalidades implementadas:**
            - BREAD completo para Servicios (Browse, Read, Edit, Add, Delete)
            - Autenticación con JWT
            - Autorización por roles
            - Validación de datos
            - Soft delete
            - Paginación y búsqueda
            
            **Roles de usuario:**
            - **Administrador (1)**: Acceso completo a todos los recursos
            - **Empleado (2)**: BREAD completo para Servicios, Salones, Turnos
            - **Cliente (3)**: Solo lectura de Servicios, Salones, Turnos
          `,
          contact: {
            name: 'Grupo A - PROGIII',
            email: 'grupoa@progiii.com'
          },
          license: {
            name: 'ISC',
            url: 'https://opensource.org/licenses/ISC'
          }
        },
        servers: [
          {
            url: `http://localhost:${process.env.PORT || 3000}`,
            description: 'Servidor de desarrollo'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Ingrese el token JWT en el formato: Bearer {token}'
            }
          },
          schemas: this._getSchemas(),
          responses: this._getResponses()
        },
        tags: [
          {
            name: 'Autenticación',
            description: 'Endpoints para autenticación y autorización de usuarios'
          },
          {
            name: 'Servicios',
            description: 'BREAD completo para gestión de servicios - Entidad principal de la primera entrega'
          }
        ]
      },
      apis: [
        './src/routes/*.js',
        './src/controllers/*.js',
        './src/models/*.js'
      ]
    };
  }

  _getSchemas() {
    return {
      Servicio: {
        type: 'object',
        properties: {
          servicio_id: { type: 'integer', description: 'ID único del servicio', example: 1, readOnly: true },
          descripcion: { type: 'string', description: 'Descripción del servicio', maxLength: 255, minLength: 3, example: 'Servicio de sonido profesional' },
          importe: { type: 'number', format: 'decimal', description: 'Importe del servicio en pesos', minimum: 0, maximum: 9999999.99, example: 15000.00 },
          activo: { type: 'boolean', description: 'Estado del servicio', example: true, readOnly: true },
          creado: { type: 'string', format: 'date-time', example: '2025-08-19T21:47:55.000Z', readOnly: true },
          modificado: { type: 'string', format: 'date-time', example: '2025-08-19T21:47:55.000Z', readOnly: true }
        },
        required: ['servicio_id', 'descripcion', 'importe', 'activo']
      },
      ServicioInput: {
        type: 'object',
        required: ['descripcion', 'importe'],
        properties: {
          descripcion: { type: 'string', maxLength: 255, minLength: 3, example: 'Servicio de sonido profesional' },
          importe: { type: 'number', format: 'decimal', minimum: 0, maximum: 9999999.99, example: 15000.00 }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['nombre_usuario', 'contrasenia'],
        properties: {
          nombre_usuario: { type: 'string', format: 'email', example: 'alblop@correo.com' },
          contrasenia: { type: 'string', minLength: 3, example: 'password123' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Login exitoso' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: { $ref: '#/components/schemas/Usuario' }
            }
          }
        }
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Alberto' },
          apellido: { type: 'string', example: 'López' },
          nombre_usuario: { type: 'string', format: 'email', example: 'alblop@correo.com' },
          tipo_usuario: { type: 'integer', description: '1=Administrador, 2=Empleado, 3=Cliente', example: 1 },
          tipo_usuario_texto: { type: 'string', example: 'Administrador' },
          celular: { type: 'string', nullable: true, example: null },
          foto: { type: 'string', nullable: true, example: null }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          currentPage: { type: 'integer', example: 1 },
          totalPages: { type: 'integer', example: 5 },
          totalItems: { type: 'integer', example: 45 },
          itemsPerPage: { type: 'integer', example: 10 },
          hasNext: { type: 'boolean', example: true },
          hasPrev: { type: 'boolean', example: false }
        }
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['error'], example: 'error' },
          message: { type: 'string', example: 'Servicio no encontrado' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
                value: {}
              }
            }
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['success'], example: 'success' },
          message: { type: 'string', example: 'Operación realizada exitosamente' },
          data: {}
        }
      }
    };
  }

  _getResponses() {
    return {
      Unauthorized: {
        description: 'No autorizado - Token inválido o faltante',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { status: 'error', message: 'Token de acceso requerido' } } }
      },
      Forbidden: {
        description: 'Prohibido - Sin permisos suficientes',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { status: 'error', message: 'No tienes permisos para acceder a este recurso' } } }
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { status: 'error', message: 'Recurso no encontrado' } } }
      },
      ValidationError: {
        description: 'Error de validación',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { status: 'error', message: 'Errores de validación', errors: [{ field: 'descripcion', message: 'La descripción es requerida', value: '' }] } } }
      },
      InternalServerError: {
        description: 'Error interno del servidor',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { status: 'error', message: 'Error interno del servidor' } } }
      }
    };
  }

  init() {
    const swaggerUiOptions = {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
      },
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info hgroup.main h2 { color: #3b82f6 }
        .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 5px; }
        .swagger-ui .auth-wrapper { margin-top: 20px; }
      `,
      customSiteTitle: "PROGIII API - Documentación",
      customfavIcon: "/favicon.ico"
    };

    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(this.specs, swaggerUiOptions));

    this.app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(this.specs);
    });

    console.log('📚 Swagger configurado exitosamente con clase');
  }
}

export default SwaggerConfig;