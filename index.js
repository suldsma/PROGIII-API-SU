import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Importaciones locales
import { initializeApp } from './src/config/init.js';
import SwaggerConfig from './src/config/swagger.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import authRoutes from './src/routes/auth.js';
import serviciosRoutes from './src/routes/servicios.js';
import salonesRoutes from './src/routes/salones.js';
import turnosRoutes from './src/routes/turnos.js';
import usuariosRoutes from './src/routes/usuarios.js';
import reservasRoutes from './src/routes/reservas.js';

const app = express();

// Configuración de middlewares de seguridad y utilidad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    credentials: true
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuración de Swagger usando clase
const swagger = new SwaggerConfig(app);
swagger.init();

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/salones', salonesRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/reservas', reservasRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'PROGIII API está funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'MySQL - Conectado',
        features: [
            'BREAD completo para Servicios',
            'Autenticación JWT',
            'Autorización por roles',
            'Validaciones robustas',
            'Soft delete',
            'Paginación y búsqueda',
            'Documentación Swagger'
        ]
    });
});

// Middleware de rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Endpoint ${req.method} ${req.originalUrl} no encontrado`,
        availableEndpoints: {
            auth: [
                'POST /api/auth/login - Iniciar sesión',
                'GET /api/auth/me - Perfil del usuario',
                'POST /api/auth/refresh - Renovar token'
            ],
            servicios: [
                'GET /api/servicios - Listar servicios (Browse)',
                'GET /api/servicios/stats/most-used - Servicios más usados',
                'GET /api/servicios/:id - Obtener servicio (Read)',
                'POST /api/servicios - Crear servicio (Add)',
                'PUT /api/servicios/:id - Actualizar servicio (Edit)',
                'PATCH /api/servicios/:id - Actualización parcial',
                'DELETE /api/servicios/:id - Eliminar servicio (Delete)',
                'PATCH /api/servicios/:id/restore - Restaurar servicio'
            ],
            reservas: [
                'GET /api/reservas - Listar reservas (Browse)',
                'GET /api/reservas/:id - Obtener reserva (Read)',
                'POST /api/reservas - Crear reserva (Add)',
                'DELETE /api/reservas/:id - Eliminar reserva (Delete)'
            ],
            salones: [
                'GET /api/salones - Listar salones (Browse)',
                'GET /api/salones/:id - Obtener salón (Read)',
                'POST /api/salones - Crear salón (Add)',
                'PUT /api/salones/:id - Actualizar salón (Edit)',
                'DELETE /api/salones/:id - Eliminar salón (Delete)',
                'PATCH /api/salones/:id/restore - Restaurar salón'
            ],
            turnos: [
                'GET /api/turnos/active - Listar turnos activos',
                'GET /api/turnos/stats/most-used - Turnos más usados',
                'GET /api/turnos - Listar turnos (Browse)',
                'GET /api/turnos/:id/availability - Chequear disponibilidad',
                'GET /api/turnos/:id - Obtener turno (Read)',
                'POST /api/turnos - Crear turno (Add)',
                'PUT /api/turnos/:id - Actualizar turno (Edit)',
                'PATCH /api/turnos/:id - Actualización parcial',
                'DELETE /api/turnos/:id - Eliminar turno (Delete)',
                'PATCH /api/turnos/:id/restore - Restaurar turno'
            ],
            usuarios: [
                'GET /api/usuarios/stats - Estadísticas de usuarios',
                'GET /api/usuarios/top-clientes - Clientes principales',
                'GET /api/usuarios - Listar usuarios (Browse)',
                'GET /api/usuarios/:id - Obtener usuario (Read)',
                'POST /api/usuarios - Crear usuario (Add)',
                'PUT /api/usuarios/:id - Actualizar usuario (Edit)',
                'PATCH /api/usuarios/:id - Actualización parcial',
                'PATCH /api/usuarios/:id/change-tipo - Cambiar tipo de usuario',
                'PATCH /api/usuarios/:id/change-password - Cambiar contraseña',
                'DELETE /api/usuarios/:id - Eliminar usuario (Delete)',
                'PATCH /api/usuarios/:id/restore - Restaurar usuario'
            ],
            system: [
                'GET /api/health - Estado del servidor',
                'GET /api-docs - Documentación Swagger',
                'GET /api-docs.json - Especificación OpenAPI'
            ]
        },
        documentation: `http://localhost:${process.env.PORT || 3000}/api-docs`
    });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Función para iniciar el servidor
const startServer = async () => {
    try {
        await initializeApp();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log('🚀 =======================================');
            console.log(`🚀 Servidor PROGIII API iniciado`);
            console.log(`🚀 Puerto: ${PORT}`);
            console.log(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
            console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`📊 Base de datos: MySQL - ${process.env.DB_NAME}`);
            console.log('✅ BREAD Servicios: Implementado');
            console.log('✅ JWT Auth: Activo');
            console.log('✅ Roles: Admin, Empleado, Cliente');
            console.log('🚀 =======================================');
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
};

// Inicia servidor
startServer();

export default app;