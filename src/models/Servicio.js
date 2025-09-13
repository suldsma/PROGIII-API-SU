import { query, transaction } from '../config/database.js';

class Servicio {
  constructor(data = {}) {
    this.servicio_id = data.servicio_id || null;
    this.descripcion = data.descripcion || '';
    this.importe = data.importe || 0;
    this.activo = data.activo !== undefined ? Boolean(data.activo) : true;
    this.creado = data.creado || null;
    this.modificado = data.modificado || null;
  }

  /**
   * Obtener todos los servicios con paginación y filtros
   */
  static async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      includeInactive = false 
    } = options;
    
    const offset = (page - 1) * limit;
    
    let whereClause = includeInactive ? '1=1' : 'activo = 1';
    let params = [];
    
    if (search && search.trim()) {
      whereClause += ' AND descripcion LIKE ?';
      params.push(`%${search.trim()}%`);
    }
    
    try {
      // Query para obtener servicios
      const serviciosQuery = `
        SELECT servicio_id, descripcion, importe, activo, creado, modificado 
        FROM servicios 
        WHERE ${whereClause}
        ORDER BY activo DESC, creado DESC
        LIMIT ? OFFSET ?
      `;
      
      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM servicios 
        WHERE ${whereClause}
      `;
      
      const serviciosParams = [...params, limit, offset];
      const countParams = [...params];
      
      const [servicios, totalResult] = await Promise.all([
        query(serviciosQuery, serviciosParams),
        query(countQuery, countParams)
      ]);
      
      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limit);
      
      return {
        servicios: servicios.map(servicio => new Servicio(servicio)),
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
      throw new Error('Error al obtener servicios');
    }
  }

  /**
   * Buscar servicio por ID (incluye inactivos)
   */
  static async findById(id) {
    try {
      const servicios = await query(
        'SELECT servicio_id, descripcion, importe, activo, creado, modificado FROM servicios WHERE servicio_id = ?',
        [id]
      );
      
      return servicios.length > 0 ? new Servicio(servicios[0]) : null;
    } catch (error) {
      console.error('Error en findById:', error);
      throw new Error('Error al buscar servicio');
    }
  }

  /**
   * Buscar servicio activo por ID
   */
  static async findActiveById(id) {
    try {
      const servicios = await query(
        'SELECT servicio_id, descripcion, importe, activo, creado, modificado FROM servicios WHERE servicio_id = ? AND activo = 1',
        [id]
      );
      
      return servicios.length > 0 ? new Servicio(servicios[0]) : null;
    } catch (error) {
      console.error('Error en findActiveById:', error);
      throw new Error('Error al buscar servicio activo');
    }
  }

  /**
   * Verifica si existe un servicio con la misma descripción
   */
  static async existsByDescripcion(descripcion, excludeId = null) {
    try {
      let sql = 'SELECT COUNT(*) as count FROM servicios WHERE LOWER(TRIM(descripcion)) = LOWER(TRIM(?)) AND activo = 1';
      let params = [descripcion];
      
      if (excludeId) {
        sql += ' AND servicio_id != ?';
        params.push(excludeId);
      }
      
      const result = await query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en existsByDescripcion:', error);
      throw new Error('Error al verificar existencia del servicio');
    }
  }

  /**
   * Crea nuevo servicio
   */
  static async create(data) {
    const { descripcion, importe } = data;
    
    try {
      // Verifica que no existe un servicio con la misma descripción
      const exists = await Servicio.existsByDescripcion(descripcion);
      if (exists) {
        throw new Error('Ya existe un servicio con esta descripción');
      }
      
      const result = await query(
        'INSERT INTO servicios (descripcion, importe, activo, creado, modificado) VALUES (?, ?, 1, NOW(), NOW())',
        [descripcion.trim(), parseFloat(importe)]
      );
      
      return await Servicio.findById(result.insertId);
    } catch (error) {
      console.error('Error en create:', error);
      if (error.message.includes('Ya existe un servicio')) {
        throw error;
      }
      throw new Error('Error al crear servicio');
    }
  }

  /**
   * Actualiza servicio
   */
  async update(data) {
    const { descripcion, importe, activo } = data;
    const updateFields = [];
    const params = [];
    
    try {
      if (descripcion !== undefined && descripcion !== null) {
        const trimmedDesc = descripcion.trim();
        if (trimmedDesc !== this.descripcion) {
          // Verifica que no existe otro servicio con la misma descripción
          const exists = await Servicio.existsByDescripcion(trimmedDesc, this.servicio_id);
          if (exists) {
            throw new Error('Ya existe un servicio con esta descripción');
          }
        }
        
        updateFields.push('descripcion = ?');
        params.push(trimmedDesc);
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
      params.push(this.servicio_id);
      
      await query(
        `UPDATE servicios SET ${updateFields.join(', ')} WHERE servicio_id = ?`,
        params
      );
      
      return await Servicio.findById(this.servicio_id);
    } catch (error) {
      console.error('Error en update:', error);
      if (error.message.includes('Ya existe un servicio')) {
        throw error;
      }
      throw new Error('Error al actualizar servicio');
    }
  }

  /**
   * Soft delete - marcar como inactivo
   */
  async softDelete() {
    try {
      // Verifica si el servicio está siendo usado en reservas activas
      const reservasActivas = await query(
        `SELECT COUNT(*) as count 
         FROM reservas_servicios rs 
         INNER JOIN reservas r ON rs.reserva_id = r.reserva_id 
         WHERE rs.servicio_id = ? AND r.activo = 1`,
        [this.servicio_id]
      );
      
      if (reservasActivas[0].count > 0) {
        throw new Error('No se puede eliminar el servicio porque está siendo usado en reservas activas');
      }
      
      await query(
        'UPDATE servicios SET activo = 0, modificado = NOW() WHERE servicio_id = ?',
        [this.servicio_id]
      );
      
      this.activo = false;
      return true;
    } catch (error) {
      console.error('Error en softDelete:', error);
      if (error.message.includes('está siendo usado')) {
        throw error;
      }
      throw new Error('Error al eliminar servicio');
    }
  }

  /**
   * Restaura servicio eliminado
   */
  async restore() {
    try {
      await query(
        'UPDATE servicios SET activo = 1, modificado = NOW() WHERE servicio_id = ?',
        [this.servicio_id]
      );
      
      return await Servicio.findById(this.servicio_id);
    } catch (error) {
      console.error('Error en restore:', error);
      throw new Error('Error al restaurar servicio');
    }
  }

  /**
   * Verifica si el servicio está activo
   */
  isActive() {
    return Boolean(this.activo);
  }

  /**
   * Obtiene servicios más utilizados
   */
  static async getMostUsed(limit = 5) {
    try {
      const servicios = await query(`
        SELECT 
          s.servicio_id,
          s.descripcion,
          s.importe,
          s.activo,
          s.creado,
          s.modificado,
          COUNT(rs.servicio_id) as uso_count
        FROM servicios s
        LEFT JOIN reservas_servicios rs ON s.servicio_id = rs.servicio_id
        LEFT JOIN reservas r ON rs.reserva_id = r.reserva_id AND r.activo = 1
        WHERE s.activo = 1
        GROUP BY s.servicio_id
        ORDER BY uso_count DESC, s.descripcion ASC
        LIMIT ?
      `, [limit]);
      
      return servicios.map(servicio => ({
        ...new Servicio(servicio),
        uso_count: servicio.uso_count
      }));
    } catch (error) {
      console.error('Error en getMostUsed:', error);
      throw new Error('Error al obtener servicios más utilizados');
    }
  }

  /**
   * Convertir a JSON limpio para respuestas de API
   */
  toJSON() {
    return {
      servicio_id: this.servicio_id,
      descripcion: this.descripcion,
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
    
    if (!isUpdate || data.descripcion !== undefined) {
      if (!data.descripcion || typeof data.descripcion !== 'string') {
        errors.push('La descripción es requerida y debe ser texto');
      } else if (data.descripcion.trim().length < 3 || data.descripcion.trim().length > 255) {
        errors.push('La descripción debe tener entre 3 y 255 caracteres');
      }
    }
    
    if (!isUpdate || data.importe !== undefined) {
      const importe = parseFloat(data.importe);
      if (isNaN(importe) || importe < 0) {
        errors.push('El importe debe ser un número mayor o igual a 0');
      } else if (importe > 9999999.99) {
        errors.push('El importe no puede superar $9,999,999.99');
      }
    }
    
    return errors;
  }
}

export default Servicio;