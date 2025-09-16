import { query, transaction } from '../config/database.js';

class Salon {
  constructor(data = {}) {
    this.salon_id = data.salon_id || null;
    this.titulo = data.titulo || '';
    this.direccion = data.direccion || '';
    this.latitud = data.latitud || null;
    this.longitud = data.longitud || null;
    this.capacidad = data.capacidad || 0;
    this.importe = data.importe || 0;
    this.activo = data.activo !== undefined ? Boolean(data.activo) : true;
    this.creado = data.creado || null;
    this.modificado = data.modificado || null;
  }

  /**
   * Obtener todos los salones con paginación y filtros
   */
  static async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      includeInactive = false,
      minCapacidad = null,
      maxCapacidad = null,
      minImporte = null,
      maxImporte = null
    } = options;
    
    const offset = (page - 1) * limit;
    
    let whereClause = includeInactive ? '1=1' : 'activo = 1';
    let params = [];
    
    if (search && search.trim()) {
      whereClause += ' AND (titulo LIKE ? OR direccion LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (minCapacidad !== null) {
      whereClause += ' AND capacidad >= ?';
      params.push(parseInt(minCapacidad));
    }
    
    if (maxCapacidad !== null) {
      whereClause += ' AND capacidad <= ?';
      params.push(parseInt(maxCapacidad));
    }
    
    if (minImporte !== null) {
      whereClause += ' AND importe >= ?';
      params.push(parseFloat(minImporte));
    }
    
    if (maxImporte !== null) {
      whereClause += ' AND importe <= ?';
      params.push(parseFloat(maxImporte));
    }
    
    try {
      const salonesQuery = `
        SELECT salon_id, titulo, direccion, latitud, longitud, capacidad, importe, activo, creado, modificado 
        FROM salones 
        WHERE ${whereClause}
        ORDER BY activo DESC, titulo ASC
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM salones 
        WHERE ${whereClause}
      `;
      
      const salonesParams = [...params, limit, offset];
      const countParams = [...params];
      
      const [salones, totalResult] = await Promise.all([
        query(salonesQuery, salonesParams),
        query(countQuery, countParams)
      ]);
      
      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limit);
      
      return {
        salones: salones.map(salon => new Salon(salon)),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error en findAll:', error);
      throw new Error('Error al obtener salones');
    }
  }

  /**
   * Buscar salon por ID
   */
  static async findById(id) {
    try {
      const salones = await query(
        'SELECT salon_id, titulo, direccion, latitud, longitud, capacidad, importe, activo, creado, modificado FROM salones WHERE salon_id = ?',
        [id]
      );
      
      return salones.length > 0 ? new Salon(salones[0]) : null;
    } catch (error) {
      console.error('Error en findById:', error);
      throw new Error('Error al buscar salon');
    }
  }

  /**
   * Buscar salon activo por ID
   */
  static async findActiveById(id) {
    try {
      const salones = await query(
        'SELECT salon_id, titulo, direccion, latitud, longitud, capacidad, importe, activo, creado, modificado FROM salones WHERE salon_id = ? AND activo = 1',
        [id]
      );
      
      return salones.length > 0 ? new Salon(salones[0]) : null;
    } catch (error) {
      console.error('Error en findActiveById:', error);
      throw new Error('Error al buscar salon activo');
    }
  }

  /**
   * Verifica si existe un salon con el mismo título
   */
  static async existsByTitulo(titulo, excludeId = null) {
    try {
      let sql = 'SELECT COUNT(*) as count FROM salones WHERE LOWER(TRIM(titulo)) = LOWER(TRIM(?)) AND activo = 1';
      let params = [titulo];
      
      if (excludeId) {
        sql += ' AND salon_id != ?';
        params.push(excludeId);
      }
      
      const result = await query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en existsByTitulo:', error);
      throw new Error('Error al verificar existencia del salon');
    }
  }

  /**
   * Crea nuevo salon
   */
  static async create(data) {
    const { titulo, direccion, latitud, longitud, capacidad, importe } = data;
    
    try {
      // Verifica que no existe un salon con el mismo título
      const exists = await Salon.existsByTitulo(titulo);
      if (exists) {
        throw new Error('Ya existe un salon con este título');
      }
      
      const result = await query(
        'INSERT INTO salones (titulo, direccion, latitud, longitud, capacidad, importe, activo, creado, modificado) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
        [
          titulo.trim(), 
          direccion.trim(), 
          latitud || null, 
          longitud || null, 
          parseInt(capacidad), 
          parseFloat(importe)
        ]
      );
      
      return await Salon.findById(result.insertId);
    } catch (error) {
      console.error('Error en create:', error);
      if (error.message.includes('Ya existe un salon')) {
        throw error;
      }
      throw new Error('Error al crear salon');
    }
  }

  /**
   * Actualiza salon
   */
  async update(data) {
    const { titulo, direccion, latitud, longitud, capacidad, importe, activo } = data;
    const updateFields = [];
    const params = [];
    
    try {
      if (titulo !== undefined && titulo !== null) {
        const trimmedTitulo = titulo.trim();
        if (trimmedTitulo !== this.titulo) {
          const exists = await Salon.existsByTitulo(trimmedTitulo, this.salon_id);
          if (exists) {
            throw new Error('Ya existe un salon con este título');
          }
        }
        
        updateFields.push('titulo = ?');
        params.push(trimmedTitulo);
      }
      
      if (direccion !== undefined && direccion !== null) {
        updateFields.push('direccion = ?');
        params.push(direccion.trim());
      }
      
      if (latitud !== undefined) {
        updateFields.push('latitud = ?');
        params.push(latitud);
      }
      
      if (longitud !== undefined) {
        updateFields.push('longitud = ?');
        params.push(longitud);
      }
      
      if (capacidad !== undefined && capacidad !== null) {
        updateFields.push('capacidad = ?');
        params.push(parseInt(capacidad));
      }
      
      if (importe !== undefined && importe !== null) {
        updateFields.push('importe = ?');
        params.push(parseFloat(importe));
      }
      
      if (activo !== undefined && activo !== null) {
        updateFields.push('activo = ?');
        params.push(Boolean(activo));
      }
      
      if (updateFields.length === 0) {
        return this; 
      }
      
      updateFields.push('modificado = NOW()');
      params.push(this.salon_id);
      
      await query(
        `UPDATE salones SET ${updateFields.join(', ')} WHERE salon_id = ?`,
        params
      );
      
      return await Salon.findById(this.salon_id);
    } catch (error) {
      console.error('Error en update:', error);
      if (error.message.includes('Ya existe un salon')) {
        throw error;
      }
      throw new Error('Error al actualizar salon');
    }
  }

  /**
   * Soft delete - marcar como inactivo
   */
  async softDelete() {
    try {
      // Verifica si el salon está siendo usado en reservas activas
      const reservasActivas = await query(
        'SELECT COUNT(*) as count FROM reservas WHERE salon_id = ? AND activo = 1',
        [this.salon_id]
      );
      
      if (reservasActivas[0].count > 0) {
        throw new Error('No se puede eliminar el salon porque tiene reservas activas');
      }
      
      await query(
        'UPDATE salones SET activo = 0, modificado = NOW() WHERE salon_id = ?',
        [this.salon_id]
      );
      
      this.activo = false;
      return true;
    } catch (error) {
      console.error('Error en softDelete:', error);
      if (error.message.includes('tiene reservas activas')) {
        throw error;
      }
      throw new Error('Error al eliminar salon');
    }
  }

  /**
   * Restaura salon eliminado
   */
  async restore() {
    try {
      await query(
        'UPDATE salones SET activo = 1, modificado = NOW() WHERE salon_id = ?',
        [this.salon_id]
      );
      
      return await Salon.findById(this.salon_id);
    } catch (error) {
      console.error('Error en restore:', error);
      throw new Error('Error al restaurar salon');
    }
  }

  /**
   * Obtener salones más reservados
   */
  static async getMostReserved(limit = 5) {
    try {
      const salones = await query(`
        SELECT 
          s.salon_id,
          s.titulo,
          s.direccion,
          s.latitud,
          s.longitud,
          s.capacidad,
          s.importe,
          s.activo,
          s.creado,
          s.modificado,
          COUNT(r.salon_id) as reservas_count
        FROM salones s
        LEFT JOIN reservas r ON s.salon_id = r.salon_id AND r.activo = 1
        WHERE s.activo = 1
        GROUP BY s.salon_id
        ORDER BY reservas_count DESC, s.titulo ASC
        LIMIT ?
      `, [limit]);
      
      return salones.map(salon => ({
        ...new Salon(salon),
        reservas_count: salon.reservas_count
      }));
    } catch (error) {
      console.error('Error en getMostReserved:', error);
      throw new Error('Error al obtener salones más reservados');
    }
  }

  /**
   * Verifica disponibilidad del salon en fecha y turno específico
   */
  async checkAvailability(fecha, turnoId) {
    try {
      const reservas = await query(
        'SELECT COUNT(*) as count FROM reservas WHERE salon_id = ? AND fecha_reserva = ? AND turno_id = ? AND activo = 1',
        [this.salon_id, fecha, turnoId]
      );
      
      return reservas[0].count === 0;
    } catch (error) {
      console.error('Error en checkAvailability:', error);
      throw new Error('Error al verificar disponibilidad del salon');
    }
  }

  /**
   * Verifica si el salon está activo
   */
  isActive() {
    return Boolean(this.activo);
  }

  /**
   * Convertir a JSON limpio para respuestas de API
   */
  toJSON() {
    return {
      salon_id: this.salon_id,
      titulo: this.titulo,
      direccion: this.direccion,
      latitud: this.latitud ? parseFloat(this.latitud) : null,
      longitud: this.longitud ? parseFloat(this.longitud) : null,
      capacidad: parseInt(this.capacidad),
      importe: parseFloat(this.importe),
      activo: Boolean(this.activo),
      creado: this.creado,
      modificado: this.modificado
    };
  }

  /**
   * Valida datos antes de operaciones
   */
  static validateData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate || data.titulo !== undefined) {
      if (!data.titulo || typeof data.titulo !== 'string') {
        errors.push('El título es requerido y debe ser texto');
      } else if (data.titulo.trim().length < 3 || data.titulo.trim().length > 255) {
        errors.push('El título debe tener entre 3 y 255 caracteres');
      }
    }
    
    if (!isUpdate || data.direccion !== undefined) {
      if (!data.direccion || typeof data.direccion !== 'string') {
        errors.push('La dirección es requerida y debe ser texto');
      } else if (data.direccion.trim().length < 5 || data.direccion.trim().length > 255) {
        errors.push('La dirección debe tener entre 5 y 255 caracteres');
      }
    }
    
    if (!isUpdate || data.capacidad !== undefined) {
      const capacidad = parseInt(data.capacidad);
      if (isNaN(capacidad) || capacidad < 1) {
        errors.push('La capacidad debe ser un número mayor a 0');
      } else if (capacidad > 10000) {
        errors.push('La capacidad no puede superar 10,000 personas');
      }
    }
    
    if (!isUpdate || data.importe !== undefined) {
      const importe = parseFloat(data.importe);
      if (isNaN(importe) || importe < 0) {
        errors.push('El importe debe ser un número mayor o igual a 0');
      } else if (importe > 99999999.99) {
        errors.push('El importe no puede superar $99,999,999.99');
      }
    }
    
    if (data.latitud !== undefined && data.latitud !== null) {
      const lat = parseFloat(data.latitud);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push('La latitud debe estar entre -90 y 90 grados');
      }
    }
    
    if (data.longitud !== undefined && data.longitud !== null) {
      const lng = parseFloat(data.longitud);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push('La longitud debe estar entre -180 y 180 grados');
      }
    }
    
    return errors;
  }
}

export default Salon;