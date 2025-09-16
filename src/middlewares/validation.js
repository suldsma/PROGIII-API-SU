import { body, param, query } from 'express-validator';

// ========== VALIDACIONES COMUNES ==========

const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
        .toInt()
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El número de página debe ser un entero positivo')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser un entero entre 1 y 100')
        .toInt()
];

const validateStatsQuery = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('El límite debe ser un número entre 1 y 20')
        .toInt()
];

const validateOptionalBoolean = [
    query('includeInactive')
        .optional()
        .isBoolean()
        .withMessage('El parámetro includeInactive debe ser un booleano (true/false)'),
    query('includeInactive').optional().toBoolean()
];

const validatePartialUpdate = [
    body().custom((value, { req }) => {
        const updates = Object.keys(value);
        if (updates.length === 0) {
            throw new Error('Debe proporcionar al menos un campo para actualizar');
        }
        return true;
    }),
];

const validateLogin = [
    body('nombre_usuario')
        .notEmpty()
        .withMessage('El email es requerido')
        .isEmail()
        .withMessage('El email debe tener un formato válido')
        .normalizeEmail(),
    body('contrasenia')
        .notEmpty()
        .withMessage('La contraseña es requerida'),
];


// ========== VALIDACIONES PARA SALONES ==========

const validateSalonCreate = [
    body('titulo')
        .notEmpty()
        .withMessage('El título es requerido')
        .isLength({ min: 3, max: 255 })
        .withMessage('El título debe tener entre 3 y 255 caracteres')
        .trim()
        .customSanitizer((value) => {
            return value.replace(/\s+/g, ' ').trim();
        }),

    body('direccion')
        .notEmpty()
        .withMessage('La dirección es requerida')
        .isLength({ min: 5, max: 255 })
        .withMessage('La dirección debe tener entre 5 y 255 caracteres')
        .trim(),

    body('latitud')
        .optional()
        .isDecimal()
        .withMessage('La latitud debe ser un número decimal válido')
        .custom(value => {
            if (value !== undefined && value !== null && value !== '') {
                const lat = parseFloat(value);
                if (lat < -90 || lat > 90) {
                    throw new Error('La latitud debe estar entre -90 y 90 grados');
                }
            }
            return true;
        }),

    body('longitud')
        .optional()
        .isDecimal()
        .withMessage('La longitud debe ser un número decimal válido')
        .custom(value => {
            if (value !== undefined && value !== null && value !== '') {
                const lng = parseFloat(value);
                if (lng < -180 || lng > 180) {
                    throw new Error('La longitud debe estar entre -180 y 180 grados');
                }
            }
            return true;
        }),

    body('capacidad')
        .notEmpty()
        .withMessage('La capacidad es requerida')
        .isInt({ min: 1, max: 10000 })
        .withMessage('La capacidad debe ser un número entero entre 1 y 10,000'),

    body('importe')
        .notEmpty()
        .withMessage('El importe es requerido')
        .isDecimal({ decimal_digits: '0,2' })
        .withMessage('El importe debe ser un número decimal válido con hasta 2 decimales')
        .custom(value => {
            const num = parseFloat(value);
            if (num < 0) {
                throw new Error('El importe no puede ser negativo');
            }
            if (num > 99999999.99) {
                throw new Error('El importe no puede superar $99,999,999.99');
            }
            return true;
        })
];

const validateSalonUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),

    ...validateSalonCreate.map(validation => {
        // Hacer que todas las validaciones sean opcionales para PUT
        if (validation.builder && validation.builder.fields) {
            return validation.optional();
        }
        return validation;
    })
];

const validateSalonPartialUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
        .toInt(),

    body('titulo')
        .optional()
        .notEmpty()
        .withMessage('El título no puede estar vacío')
        .isLength({ min: 3, max: 255 })
        .withMessage('El título debe tener entre 3 y 255 caracteres')
        .trim(),

    body('direccion')
        .optional()
        .notEmpty()
        .withMessage('La dirección no puede estar vacía')
        .isLength({ min: 5, max: 255 })
        .withMessage('La dirección debe tener entre 5 y 255 caracteres')
        .trim(),

    body('latitud')
        .optional()
        .isDecimal()
        .withMessage('La latitud debe ser un número decimal válido')
        .custom(value => {
            if (value !== undefined && value !== null && value !== '') {
                const lat = parseFloat(value);
                if (lat < -90 || lat > 90) {
                    throw new Error('La latitud debe estar entre -90 y 90 grados');
                }
            }
            return true;
        }),

    body('longitud')
        .optional()
        .isDecimal()
        .withMessage('La longitud debe ser un número decimal válido')
        .custom(value => {
            if (value !== undefined && value !== null && value !== '') {
                const lng = parseFloat(value);
                if (lng < -180 || lng > 180) {
                    throw new Error('La longitud debe estar entre -180 y 180 grados');
                }
            }
            return true;
        }),

    body('capacidad')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('La capacidad debe ser un número entero entre 1 y 10,000'),

    body('importe')
        .optional()
        .isDecimal({ decimal_digits: '0,2' })
        .withMessage('El importe debe ser un número decimal válido con hasta 2 decimales')
        .custom(value => {
            if (value !== undefined && value !== null && value !== '') {
                const num = parseFloat(value);
                if (num < 0) {
                    throw new Error('El importe no puede ser negativo');
                }
                if (num > 99999999.99) {
                    throw new Error('El importe no puede superar $99,999,999.99');
                }
            }
            return true;
        }),

    body('activo')
        .optional()
        .isBoolean()
        .withMessage('El campo activo debe ser true o false')
        .toBoolean()
];

const validateSalonAvailability = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),

    query('fecha')
        .notEmpty()
        .withMessage('La fecha es requerida')
        .isDate()
        .withMessage('La fecha debe tener formato válido (YYYY-MM-DD)'),

    query('turno_id')
        .notEmpty()
        .withMessage('El turno_id es requerido')
        .isInt({ min: 1 })
        .withMessage('El turno_id debe ser un número entero positivo')
];

// ========== VALIDACIONES PARA TURNOS ==========

const validateTurnoCreate = [
    body('orden')
        .notEmpty()
        .withMessage('El orden es requerido')
        .isInt({ min: 1, max: 50 })
        .withMessage('El orden debe ser un número entero entre 1 y 50'),

    body('hora_desde')
        .notEmpty()
        .withMessage('La hora de inicio es requerida')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('La hora de inicio debe tener formato HH:MM válido'),

    body('hora_hasta')
        .notEmpty()
        .withMessage('La hora de fin es requerida')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('La hora de fin debe tener formato HH:MM válido')
        .custom((value, { req }) => {
            if (req.body.hora_desde && value <= req.body.hora_desde) {
                throw new Error('La hora de fin debe ser posterior a la hora de inicio');
            }
            return true;
        })
];

const validateTurnoUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),

    ...validateTurnoCreate
];

const validateTurnoPartialUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
        .toInt(),

    body('orden')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('El orden debe ser un número entero entre 1 y 50'),

    body('hora_desde')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('La hora de inicio debe tener formato HH:MM válido'),

    body('hora_hasta')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('La hora de fin debe tener formato HH:MM válido'),

    body('activo')
        .optional()
        .isBoolean()
        .withMessage('El campo activo debe ser true o false')
        .toBoolean(),

    // Validación personalizada para verificar que hora_hasta > hora_desde
    body()
        .custom((value) => {
            if (value.hora_desde && value.hora_hasta && value.hora_hasta <= value.hora_desde) {
                throw new Error('La hora de fin debe ser posterior a la hora de inicio');
            }
            return true;
        })
];

const validateTurnoAvailability = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),

    query('fecha')
        .notEmpty()
        .withMessage('La fecha es requerida')
        .isDate()
        .withMessage('La fecha debe tener formato válido (YYYY-MM-DD)'),

    query('salon_id')
        .notEmpty()
        .withMessage('El salon_id es requerido')
        .isInt({ min: 1 })
        .withMessage('El salon_id debe ser un número entero positivo')
];

// ========== VALIDACIONES PARA USUARIOS ==========

const validateUsuarioCreate = [
    body('nombre')
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .trim()
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

    body('apellido')
        .notEmpty()
        .withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .trim()
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios'),

    body('nombre_usuario')
        .notEmpty()
        .withMessage('El email es requerido')
        .isEmail()
        .withMessage('El email debe tener un formato válido')
        .normalizeEmail()
        .isLength({ max: 50 })
        .withMessage('El email no puede exceder 50 caracteres'),

    body('contrasenia')
        .notEmpty()
        .withMessage('La contraseña es requerida')
        .isLength({ min: 3, max: 50 })
        .withMessage('La contraseña debe tener entre 3 y 50 caracteres'),

    body('tipo_usuario')
        .notEmpty()
        .withMessage('El tipo de usuario es requerido')
        .isIn([1, 2, 3])
        .withMessage('El tipo de usuario debe ser 1 (Administrador), 2 (Empleado) o 3 (Cliente)'),

    body('celular')
        .optional()
        .isLength({ max: 20 })
        .withMessage('El celular no puede exceder 20 caracteres')
        .matches(/^[0-9+\-\s()]+$/)
        .withMessage('El celular solo puede contener números, espacios y caracteres +, -, (, )'),

    body('foto')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La foto no puede exceder 255 caracteres')
];

const validateUsuarioUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),

    body('nombre')
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .trim()
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

    body('apellido')
        .notEmpty()
        .withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .trim()
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios'),

    body('nombre_usuario')
        .notEmpty()
        .withMessage('El email es requerido')
        .isEmail()
        .withMessage('El email debe tener un formato válido')
        .normalizeEmail()
        .isLength({ max: 50 })
        .withMessage('El email no puede exceder 50 caracteres'),

    body('contrasenia')
        .optional()
        .custom((value) => {
            if (value && (value.length < 3 || value.length > 50)) {
                throw new Error('La contraseña debe tener entre 3 y 50 caracteres');
            }
            return true;
        }),

    body('tipo_usuario')
        .notEmpty()
        .withMessage('El tipo de usuario es requerido')
        .isIn([1, 2, 3])
        .withMessage('El tipo de usuario debe ser 1 (Administrador), 2 (Empleado) o 3 (Cliente)'),

    body('celular')
        .optional()
        .isLength({ max: 20 })
        .withMessage('El celular no puede exceder 20 caracteres'),

    body('foto')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La foto no puede exceder 255 caracteres')
];

const validateUsuarioPartialUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
        .toInt(),

    body('nombre')
        .optional()
        .notEmpty()
        .withMessage('El nombre no puede estar vacío')
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .trim()
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

    body('apellido')
        .optional()
        .notEmpty()
        .withMessage('El apellido no puede estar vacío')
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .trim()
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios'),

    body('nombre_usuario')
        .optional()
        .notEmpty()
        .withMessage('El email no puede estar vacío')
        .isEmail()
        .withMessage('El email debe tener un formato válido')
        .normalizeEmail()
        .isLength({ max: 50 })
        .withMessage('El email no puede exceder 50 caracteres'),

    body('contrasenia')
        .optional()
        .custom((value) => {
            if (value && value.trim() !== '' && (value.length < 3 || value.length > 50)) {
                throw new Error('La contraseña debe tener entre 3 y 50 caracteres');
            }
            return true;
        }),

    body('tipo_usuario')
        .optional()
        .isIn([1, 2, 3])
        .withMessage('El tipo de usuario debe ser 1 (Administrador), 2 (Empleado) o 3 (Cliente)'),

    body('celular')
        .optional()
        .isLength({ max: 20 })
        .withMessage('El celular no puede exceder 20 caracteres'),

    body('foto')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La foto no puede exceder 255 caracteres'),

    body('activo')
        .optional()
        .isBoolean()
        .withMessage('El campo activo debe ser true o false')
        .toBoolean()
];

const validateChangeTipo = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),

    body('tipo_usuario')
        .notEmpty()
        .withMessage('El tipo de usuario es requerido')
        .isIn([1, 2, 3])
        .withMessage('El tipo de usuario debe ser 1 (Administrador), 2 (Empleado) o 3 (Cliente)')
];

const validateChangePassword = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),

    body('nueva_contrasenia')
        .notEmpty()
        .withMessage('La nueva contraseña es requerida')
        .isLength({ min: 3, max: 50 })
        .withMessage('La nueva contraseña debe tener entre 3 y 50 caracteres')
];

// ========== VALIDACIONES PARA RESERVAS ==========

const validateReservaCreate = [
    body('fecha_reserva')
        .notEmpty()
        .withMessage('La fecha de reserva es requerida')
        .isDate()
        .withMessage('La fecha de reserva debe tener formato válido (YYYY-MM-DD)')
        .custom((value) => {
            const fecha = new Date(value);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fecha < hoy) {
                throw new Error('La fecha de reserva no puede ser anterior a hoy');
            }
            return true;
        }),

    body('salon_id')
        .notEmpty()
        .withMessage('El salón es requerido')
        .isInt({ min: 1 })
        .withMessage('Debe especificar un salón válido'),

    body('usuario_id')
        .optional() // Para clientes se asigna automáticamente
        .isInt({ min: 1 })
        .withMessage('Debe especificar un usuario válido'),

    body('turno_id')
        .notEmpty()
        .withMessage('El turno es requerido')
        .isInt({ min: 1 })
        .withMessage('Debe especificar un turno válido'),

    body('foto_cumpleaniero')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La foto del cumpleañero no puede exceder 255 caracteres'),

    body('tematica')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La temática no puede exceder 255 caracteres')
        .trim(),

    body('servicios')
        .optional()
        .isArray()
        .withMessage('Los servicios deben ser un array')
        .custom((servicios) => {
            if (Array.isArray(servicios)) {
                servicios.forEach((servicio, index) => {
                    if (!servicio.servicio_id || !Number.isInteger(servicio.servicio_id) || servicio.servicio_id < 1) {
                        throw new Error(`El servicio en posición ${index + 1} debe tener un servicio_id válido`);
                    }
                });
            }
            return true;
        })
];

const validateReservaUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),

    body('fecha_reserva')
        .optional()
        .isDate()
        .withMessage('La fecha de reserva debe tener formato válido (YYYY-MM-DD)')
        .custom((value) => {
            if (value) {
                const fecha = new Date(value);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);

                if (fecha < hoy) {
                    throw new Error('La fecha de reserva no puede ser anterior a hoy');
                }
            }
            return true;
        }),

    body('salon_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Debe especificar un salón válido'),

    body('turno_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Debe especificar un turno válido'),

    body('foto_cumpleaniero')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La foto del cumpleañero no puede exceder 255 caracteres'),

    body('tematica')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La temática no puede exceder 255 caracteres')
        .trim(),

    body('servicios')
        .optional()
        .isArray()
        .withMessage('Los servicios deben ser un array')
        .custom((servicios) => {
            if (Array.isArray(servicios)) {
                servicios.forEach((servicio, index) => {
                    if (!servicio.servicio_id || !Number.isInteger(servicio.servicio_id) || servicio.servicio_id < 1) {
                        throw new Error(`El servicio en posición ${index + 1} debe tener un servicio_id válido`);
                    }
                });
            }
            return true;
        })
];

const validateReservaPartialUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
        .toInt(),

    ...validateReservaUpdate.slice(1), // Usar las mismas validaciones pero opcionales

    body('activo')
        .optional()
        .isBoolean()
        .withMessage('El campo activo debe ser true o false')
        .toBoolean()
];

const validateAvailabilityCheck = [
    body('salon_id')
        .notEmpty()
        .withMessage('El salon_id es requerido')
        .isInt({ min: 1 })
        .withMessage('Debe especificar un salón válido'),

    body('fecha_reserva')
        .notEmpty()
        .withMessage('La fecha_reserva es requerida')
        .isDate()
        .withMessage('La fecha debe tener formato válido (YYYY-MM-DD)'),

    body('turno_id')
        .notEmpty()
        .withMessage('El turno_id es requerido')
        .isInt({ min: 1 })
        .withMessage('Debe especificar un turno válido')
];

const validateStatsMonthly = [
    query('year')
        .optional()
        .isInt({ min: 2020, max: 2030 })
        .withMessage('El año debe estar entre 2020 y 2030')
        .toInt()
];

const validateUpcoming = [
    query('dias')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Los días deben estar entre 1 y 30')
        .toInt()
];


// ========== VALIDACIONES PARA SERVICIOS ==========

const validateServicioCreate = [
    body('descripcion')
        .notEmpty()
        .withMessage('La descripción es requerida')
        .isLength({ min: 3, max: 255 })
        .withMessage('La descripción debe tener entre 3 y 255 caracteres')
        .trim(),
    body('importe')
        .notEmpty()
        .withMessage('El importe es requerido')
        .isDecimal({ decimal_digits: '0,2' })
        .withMessage('El importe debe ser un número decimal válido con hasta 2 decimales')
        .custom(value => {
            const num = parseFloat(value);
            if (num < 0) {
                throw new Error('El importe no puede ser negativo');
            }
            if (num > 9999999.99) {
                throw new Error('El importe no puede superar $9,999,999.99');
            }
            return true;
        })
];

const validateServicioUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),
    ...validateServicioCreate
];

const validateServicioId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID del servicio debe ser un número entero positivo')
        .toInt()
];


// Exportación por defecto
export default {
    validateId,
    validatePagination,
    validateStatsQuery,
    validateLogin,
    validateOptionalBoolean,
    validatePartialUpdate,
    validateSalonCreate,
    validateSalonUpdate,
    validateSalonPartialUpdate,
    validateSalonAvailability,
    validateTurnoCreate,
    validateTurnoUpdate,
    validateTurnoPartialUpdate,
    validateTurnoAvailability,
    validateUsuarioCreate,
    validateUsuarioUpdate,
    validateUsuarioPartialUpdate,
    validateChangeTipo,
    validateChangePassword,
    validateReservaCreate,
    validateReservaUpdate,
    validateReservaPartialUpdate,
    validateAvailabilityCheck,
    validateStatsMonthly,
    validateUpcoming,
    validateServicioCreate,
    validateServicioUpdate,
    validateServicioId
};