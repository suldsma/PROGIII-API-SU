import { body, param, query } from 'express-validator';

// Validaciones para servicios
const validateServicioCreate = [
  body('descripcion')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ min: 3, max: 255 })
    .withMessage('La descripción debe tener entre 3 y 255 caracteres')
    .trim()
    .customSanitizer((value) => {
      // Limpia espacios múltiples y capitaliza primera letra
      return value.replace(/\s+/g, ' ').trim();
    }),
  
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
  
  body('descripcion')
    .optional()
    .notEmpty()
    .withMessage('La descripción no puede estar vacía')
    .isLength({ min: 3, max: 255 })
    .withMessage('La descripción debe tener entre 3 y 255 caracteres')
    .trim()
    .customSanitizer((value) => {
      return value ? value.replace(/\s+/g, ' ').trim() : value;
    }),
  
  body('importe')
    .optional()
    .notEmpty()
    .withMessage('El importe no puede estar vacío')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('El importe debe ser un número decimal válido con hasta 2 decimales')
    .custom(value => {
      if (value !== undefined && value !== null && value !== '') {
        const num = parseFloat(value);
        if (num < 0) {
          throw new Error('El importe no puede ser negativo');
        }
        if (num > 9999999.99) {
          throw new Error('El importe no puede superar $9,999,999.99');
        }
      }
      return true;
    })
];

const validateServicioId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo')
    .toInt()
];

// Validaciones para paginación y búsqueda
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100')
    .toInt(),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El término de búsqueda no puede exceder 100 caracteres')
    .trim(),
  
  query('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('includeInactive debe ser true o false')
    .toBoolean()
];

// Validación para estadísticas
const validateStatsQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('El límite debe ser un número entre 1 y 20')
    .toInt()
];

// Validaciones para login
const validateLogin = [
  body('nombre_usuario')
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isEmail()
    .withMessage('El nombre de usuario debe ser un email válido')
    .normalizeEmail()
    .isLength({ max: 50 })
    .withMessage('El nombre de usuario no puede exceder 50 caracteres'),
  
  body('contrasenia')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 3 })
    .withMessage('La contraseña debe tener al menos 3 caracteres')
    .isLength({ max: 50 })
    .withMessage('La contraseña no puede exceder 50 caracteres')
];

// Validación para actualización parcial de servicio (PATCH)
const validatePartialUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo')
    .toInt(),
  
  // Al menos uno de los campos debe estar presente
  body()
    .custom((value) => {
      const { descripcion, importe, activo } = value;
      if (descripcion === undefined && importe === undefined && activo === undefined) {
        throw new Error('Al menos un campo (descripcion, importe, activo) debe estar presente para la actualización');
      }
      return true;
    }),
  
  body('descripcion')
    .optional()
    .notEmpty()
    .withMessage('La descripción no puede estar vacía')
    .isLength({ min: 3, max: 255 })
    .withMessage('La descripción debe tener entre 3 y 255 caracteres')
    .trim()
    .customSanitizer((value) => {
      return value ? value.replace(/\s+/g, ' ').trim() : value;
    }),
  
  body('importe')
    .optional()
    .notEmpty()
    .withMessage('El importe no puede estar vacío')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('El importe debe ser un número decimal válido con hasta 2 decimales')
    .custom(value => {
      if (value !== undefined && value !== null && value !== '') {
        const num = parseFloat(value);
        if (num < 0) {
          throw new Error('El importe no puede ser negativo');
        }
        if (num > 9999999.99) {
          throw new Error('El importe no puede superar $9,999,999.99');
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

// Validaciones comunes
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo')
    .toInt()
];

const validateOptionalBoolean = (field) => [
  query(field)
    .optional()
    .isBoolean()
    .withMessage(`${field} debe ser true o false`)
    .toBoolean()
];

// Validación para campos de búsqueda avanzada
const validateAdvancedSearch = [
  query('sortBy')
    .optional()
    .isIn(['descripcion', 'importe', 'creado', 'modificado'])
    .withMessage('El campo de ordenamiento debe ser uno de: descripcion, importe, creado, modificado'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('El orden debe ser ASC o DESC'),
  
  query('minImporte')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('El importe mínimo debe ser un número decimal válido')
    .custom(value => {
      const num = parseFloat(value);
      if (num < 0) {
        throw new Error('El importe mínimo no puede ser negativo');
      }
      return true;
    }),
  
  query('maxImporte')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('El importe máximo debe ser un número decimal válido')
    .custom(value => {
      const num = parseFloat(value);
      if (num < 0) {
        throw new Error('El importe máximo no puede ser negativo');
      }
      return true;
    })
];

// Validaciones para reservas
const validateReservaCreate = [
  body('fecha_reserva')
    .notEmpty()
    .withMessage('La fecha de reserva es requerida')
    .isISO8601()
    .withMessage('La fecha de reserva debe tener el formato YYYY-MM-DD')
    .isAfter(new Date().toISOString().split('T')[0])
    .withMessage('La fecha de reserva debe ser posterior a la fecha actual')
    .toDate(),
    
  body('salon_id')
    .notEmpty()
    .withMessage('El ID del salón es requerido')
    .isInt({ min: 1 })
    .withMessage('El ID del salón debe ser un número entero positivo')
    .toInt(),

  body('turno_id')
    .notEmpty()
    .withMessage('El ID del turno es requerido')
    .isInt({ min: 1 })
    .withMessage('El ID del turno debe ser un número entero positivo')
    .toInt(),

  body('tematica')
    .optional()
    .isString()
    .withMessage('La temática debe ser una cadena de texto')
    .isLength({ max: 255 })
    .withMessage('La temática no puede exceder los 255 caracteres'),
    
  body('foto_cumpleaniero')
    .optional()
    .isURL()
    .withMessage('La foto debe ser una URL válida'),

  body('servicios_adicionales')
    .optional()
    .isArray()
    .withMessage('Los servicios adicionales deben ser un array')
    .custom(async (servicios) => {
      if (servicios.length > 0) {
        for (const servicioId of servicios) {
          if (!Number.isInteger(servicioId) || servicioId < 1) {
            throw new Error('Cada servicio adicional debe ser un ID de servicio válido');
          }
        }
      }
      return true;
    })
];

const validateReservaId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID de la reserva debe ser un número entero positivo')
    .toInt()
];


// Validaciones para salones
const validateSalonCreate = [
  body('nombre')
      .notEmpty()
      .withMessage('El nombre es requerido')
      .isLength({ min: 3, max: 255 })
      .withMessage('El nombre debe tener entre 3 y 255 caracteres'),
  body('direccion')
      .notEmpty()
      .withMessage('La dirección es requerida')
      .isLength({ min: 5, max: 255 })
      .withMessage('La dirección debe tener entre 5 y 255 caracteres'),
  body('latitud')
      .optional()
      .isFloat()
      .withMessage('La latitud debe ser un número decimal válido'),
  body('longitud')
      .optional()
      .isFloat()
      .withMessage('La longitud debe ser un número decimal válido'),
  body('capacidad')
      .notEmpty()
      .withMessage('La capacidad es requerida')
      .isInt({ min: 1 })
      .withMessage('La capacidad debe ser un número entero positivo'),
  body('importe_alquiler')
      .notEmpty()
      .withMessage('El importe de alquiler es requerido')
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('El importe de alquiler debe ser un número decimal con hasta 2 decimales')
];

const validateSalonUpdate = [
  body('nombre')
      .optional()
      .isLength({ min: 3, max: 255 })
      .withMessage('El nombre debe tener entre 3 y 255 caracteres'),
  body('direccion')
      .optional()
      .isLength({ min: 5, max: 255 })
      .withMessage('La dirección debe tener entre 5 y 255 caracteres'),
  body('latitud')
      .optional()
      .isFloat()
      .withMessage('La latitud debe ser un número decimal válido'),
  body('longitud')
      .optional()
      .isFloat()
      .withMessage('La longitud debe ser un número decimal válido'),
  body('capacidad')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La capacidad debe ser un número entero positivo'),
  body('importe_alquiler')
      .optional()
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('El importe de alquiler debe ser un número decimal con hasta 2 decimales')
];

const validateSalonId = [
  param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del salón debe ser un número entero positivo')
      .toInt()
];

export {
  validateServicioCreate,
  validateServicioUpdate,
  validateServicioId,
  validatePagination,
  validateStatsQuery,
  validateLogin,
  validateId,
  validateOptionalBoolean, 
  validatePartialUpdate,
  validateAdvancedSearch,
  validateReservaCreate,
  validateReservaId,
  validateSalonCreate,
  validateSalonUpdate,
  validateSalonId,
};