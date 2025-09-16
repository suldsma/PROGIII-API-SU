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
      },
      Salon: {
        type: 'object',
        properties: {
          salon_id: { type: 'integer', description: 'ID único del salón', example: 1, readOnly: true },
          titulo: { type: 'string', description: 'Título del salón', maxLength: 255, minLength: 3, example: 'Salón Principal' },
          direccion: { type: 'string', description: 'Dirección del salón', maxLength: 255, minLength: 5, example: 'San Lorenzo 1000' },
          latitud: { type: 'number', format: 'decimal', description: 'Latitud GPS', minimum: -90, maximum: 90, example: -32.3868, nullable: true },
          longitud: { type: 'number', format: 'decimal', description: 'Longitud GPS', minimum: -180, maximum: 180, example: -58.0039, nullable: true },
          capacidad: { type: 'integer', description: 'Capacidad máxima de personas', minimum: 1, example: 200 },
          importe: { type: 'number', format: 'decimal', description: 'Importe de alquiler en pesos', minimum: 0, maximum: 9999999.99, example: 95000.00 },
          activo: { type: 'boolean', description: 'Estado del salón', example: true, readOnly: true },
          creado: { type: 'string', format: 'date-time', example: '2025-08-19T21:51:22.000Z', readOnly: true },
          modificado: { type: 'string', format: 'date-time', example: '2025-08-19T21:51:22.000Z', readOnly: true }
        },
        required: ['salon_id', 'titulo', 'direccion', 'capacidad', 'importe', 'activo']
      },

      SalonInput: {
        type: 'object',
        required: ['titulo', 'direccion', 'capacidad', 'importe'],
        properties: {
          titulo: { type: 'string', maxLength: 255, minLength: 3, example: 'Salón de Eventos Central' },
          direccion: { type: 'string', maxLength: 255, minLength: 5, example: 'Av. Principal 1234' },
          latitud: { type: 'number', format: 'decimal', minimum: -90, maximum: 90, example: -32.3868 },
          longitud: { type: 'number', format: 'decimal', minimum: -180, maximum: 180, example: -58.0039 },
          capacidad: { type: 'integer', minimum: 1, example: 200 },
          importe: { type: 'number', format: 'decimal', minimum: 0, maximum: 9999999.99, example: 95000.00 }
        }
      },

      Reserva: {
        type: 'object',
        properties: {
          reserva_id: { type: 'integer', description: 'ID único de la reserva', example: 1, readOnly: true },
          fecha_reserva: { type: 'string', format: 'date', description: 'Fecha de la reserva', example: '2025-10-08' },
          salon_id: { type: 'integer', description: 'ID del salón reservado', example: 1 },
          usuario_id: { type: 'integer', description: 'ID del usuario que reservó', example: 1 },
          turno_id: { type: 'integer', description: 'ID del turno reservado', example: 1 },
          foto_cumpleaniero: { type: 'string', format: 'uri', description: 'URL de la foto del cumpleañero', example: 'https://ejemplo.com/foto.jpg', nullable: true },
          tematica: { type: 'string', description: 'Temática de la fiesta', maxLength: 255, example: 'Plim plim', nullable: true },
          importe_salon: { type: 'number', format: 'decimal', description: 'Importe del salón', example: 95000.00 },
          importe_total: { type: 'number', format: 'decimal', description: 'Importe total incluyendo servicios', example: 200000.00 },
          activo: { type: 'boolean', description: 'Estado de la reserva', example: true, readOnly: true },
          creado: { type: 'string', format: 'date-time', example: '2025-08-19T22:02:33.000Z', readOnly: true },
          modificado: { type: 'string', format: 'date-time', example: '2025-08-19T22:02:33.000Z', readOnly: true },
          servicios_adicionales: {
            type: 'array',
            description: 'Lista de servicios adicionales contratados',
            items: {
              type: 'object',
              properties: {
                servicio_id: { type: 'integer', example: 1 },
                descripcion: { type: 'string', example: 'Sonido' },
                importe: { type: 'number', example: 15000.00 },
                importe_adicional: { type: 'number', example: 50000.00 }
              }
            }
          }
        },
        required: ['reserva_id', 'fecha_reserva', 'salon_id', 'usuario_id', 'turno_id', 'importe_salon', 'importe_total', 'activo']
      },

      ReservaInput: {
        type: 'object',
        required: ['fecha_reserva', 'salon_id', 'turno_id'],
        properties: {
          fecha_reserva: { type: 'string', format: 'date', example: '2025-10-15' },
          salon_id: { type: 'integer', minimum: 1, example: 1 },
          turno_id: { type: 'integer', minimum: 1, example: 1 },
          foto_cumpleaniero: { type: 'string', format: 'uri', example: 'https://ejemplo.com/foto.jpg' },
          tematica: { type: 'string', maxLength: 255, example: 'Superhéroes' },
          servicios_adicionales: {
            type: 'array',
            description: 'IDs de servicios adicionales a contratar',
            items: { type: 'integer', minimum: 1 },
            example: [1, 2, 3]
          }
        }
      },

      ReservaUpdate: {
        type: 'object',
        properties: {
          fecha_reserva: { type: 'string', format: 'date', example: '2025-10-15' },
          salon_id: { type: 'integer', minimum: 1, example: 1 },
          turno_id: { type: 'integer', minimum: 1, example: 1 },
          foto_cumpleaniero: { type: 'string', format: 'uri', example: 'https://ejemplo.com/foto.jpg' },
          tematica: { type: 'string', maxLength: 255, example: 'Superhéroes' },
          servicios_adicionales: {
            type: 'array',
            items: { type: 'integer', minimum: 1 },
            example: [1, 2]
          }
        }
      },

      Turno: {
        type: 'object',
        properties: {
          turno_id: { type: 'integer', description: 'ID único del turno', example: 1, readOnly: true },
          orden: { type: 'integer', description: 'Orden del turno', example: 1 },
          hora_desde: { type: 'string', format: 'time', description: 'Hora de inicio', example: '12:00:00' },
          hora_hasta: { type: 'string', format: 'time', description: 'Hora de fin', example: '14:00:00' },
          activo: { type: 'boolean', description: 'Estado del turno', example: true, readOnly: true },
          creado: { type: 'string', format: 'date-time', example: '2025-08-19T21:44:19.000Z', readOnly: true },
          modificado: { type: 'string', format: 'date-time', example: '2025-08-19T21:44:19.000Z', readOnly: true }
        },
        required: ['turno_id', 'orden', 'hora_desde', 'hora_hasta', 'activo']
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