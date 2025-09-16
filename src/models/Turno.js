import { query } from '../config/database.js';

class Turno {
  constructor(data = {}) {
    this.turno_id = data.turno_id || null;
    this.orden = data.orden || 0;
    this.hora_desde = data.hora_desde || '';
    this.hora_hasta = data.hora_hasta || '';
    this.activo = data.activo !== undefined ? Boolean(data.activo) : true;
    this.creado = data.creado || null;
    this.modificado = data.modificado || null;
  }

  /**
   * Obtener todos los turnos con paginación y filtros
   */
  static async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      includeInactive = false 
    } = options;
    
    const offset = (page - 1) * limit;
    
    const whereClause = includeInactive ? '1=1' : 'activo = 1';
    
    try {
      const turnosQuery = `
        SELECT turno_id, orden, hora_desde, hora_hasta, activo, creado, modificado 
        FROM turnos 
        WHERE ${whereClause}
        ORDER BY activo DESC, orden ASC
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM turnos 
        WHERE ${whereClause}
      `;
      
      const [turnos, totalResult] = await Promise.all([
        query(turnosQuery, [limit, offset]),
        query(countQuery, [])
      ]);
      
      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limit);
      
      return {
        turnos: turnos.map(turno => new Turno(turno)),
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
      throw new Error('Error al obtener turnos');
    }
  }

  /**
   * Buscar turno por ID
   */
  static async findById(id) {
    try {
      const turnos = await query(
        'SELECT turno_id, orden, hora_desde, hora_hasta, activo, creado, modificado FROM turnos WHERE turno_id = ?',
        [id]
      );
      
      return turnos.length > 0 ? new Turno(turnos[0]) : null;
    } catch (error) {
      console.error('Error en findById:', error);
      throw new Error('Error al buscar turno');
    }
  }

  /**
   * Buscar turno activo por ID
   */
  static async findActiveById(id) {
    try {
      const turnos = await query(
        'SELECT turno_id, orden, hora_desde, hora_hasta, activo, creado, modificado FROM turnos WHERE turno_id = ? AND activo = 1',
        [id]
      );
      
      return turnos.length > 0 ? new Turno(turnos[0]) : null;
    } catch (error) {
      console.error('Error en findActiveById:', error);
      throw new Error('Error al buscar turno activo');
    }
  }

  /**
   * Verifica si existe un turno con el mismo orden
   */
  static async existsByOrden(orden, excludeId = null) {
    try {
      let sql = 'SELECT COUNT(*) as count FROM turnos WHERE orden = ? AND activo = 1';
      let params = [orden];
      
      if (excludeId) {
        sql += ' AND turno_id != ?';
        params.push(excludeId);
      }
      
      const result = await query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en existsByOrden:', error);
      throw new Error('Error al verificar existencia del turno');
    }
  }

  /**
   * Verifica solapamiento de horarios
   */
  static async checkTimeOverlap(horaDesde, horaHasta, excludeId = null) {
    try {
      let sql = `
        SELECT COUNT(*) as count FROM turnos 
        WHERE activo = 1 
        AND (
          (hora_desde <= ? AND hora_hasta > ?) OR
          (hora_desde < ? AND hora_hasta >= ?) OR
          (hora_desde >= ? AND hora_hasta <= ?)
        )
      `;
      let params = [horaDesde, horaDesde, horaHasta, horaHasta, horaDesde, horaHasta];
      
      if (excludeId) {
        sql += ' AND turno_id != ?';
        params.push(excludeId);
      }
      
      const result = await query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error en checkTimeOverlap:', error);
      throw new Error('Error al verificar solapamiento de horarios');
    }
  }

  /**
   * Crea nuevo turno
   */
  static async create(data) {
    const { orden, hora_desde, hora_hasta } = data;
    
    try {
      // Verifica que no existe un turno con el mismo orden
      const existsOrden = await Turno.existsByOrden(orden);
      if (existsOrden) {
        throw new Error('Ya existe un turno con este orden');
      }
      
      // Verifica solapamiento de horarios
      const hasOverlap = await Turno.checkTimeOverlap(hora_desde, hora_hasta);
      if (hasOverlap) {
        throw new Error('El horario se solapa con otro turno existente');
      }
      
      // Validar que hora_desde sea menor que hora_hasta
      if (hora_desde >= hora_hasta) {
        throw new Error('La hora de inicio debe ser menor que la hora de fin');
      }
      
      const result = await query(
        'INSERT INTO turnos (orden, hora_desde, hora_hasta, activo, creado, modificado) VALUES (?, ?, ?, 1, NOW(), NOW())',
        [parseInt(orden), hora_desde, hora_hasta]
      );
      
      return await Turno.findById(result.insertId);
    } catch (error) {
      console.error('Error en create:', error);
      if (error.message.includes('Ya existe un turno') || 
          error.message.includes('se solapa') || 
          error.message.includes('hora de inicio')) {
        throw error;
      }
      throw new Error('Error al crear turno');
    }
  }

  /**
   * Actualiza turno
   */
  async update(data) {
    const { orden, hora_desde, hora_hasta, activo } = data;
    const updateFields = [];
    const params = [];
    
    try {
      if (orden !== undefined && orden !== null) {
        const newOrden = parseInt(orden);
        if (newOrden !== this.orden) {
          const exists = await Turno.existsByOrden(newOrden, this.turno_id);
          if (exists) {
            throw new Error('Ya existe un turno con este orden');
          }
        }
        
        updateFields.push('orden = ?');
        params.push(newOrden);
      }
      
      let newHoraDesde = this.hora_desde;
      let newHoraHasta = this.hora_hasta;
      
      if (hora_desde !== undefined && hora_desde !== null) {
        newHoraDesde = hora_desde;
        updateFields.push('hora_desde = ?');
        params.push(hora_desde);
      }
      
      if (hora_hasta !== undefined && hora_hasta !== null) {
        newHoraHasta = hora_hasta;
        updateFields.push('hora_hasta = ?');
        params.push(hora_hasta);
      }
      
      // Validar horarios si se actualiza alguno
      if (hora_desde !== undefined || hora_hasta !== undefined) {
        if (newHoraDesde >= newHoraHasta) {
          throw new Error('La hora de inicio debe ser menor que la hora de fin');
        }
        
        // Verificar solapamiento
        const hasOverlap = await Turno.checkTimeOverlap(newHoraDesde, newHoraHasta, this.turno_id);
        if (hasOverlap) {
          throw new Error('El horario se solapa con otro turno existente');
        }
      }
      
      if (activo !== undefined && activo !== null) {
        updateFields.push('activo = ?');
        params.push(Boolean(activo));
      }
      
      if (updateFields.length === 0) {
        return this; 
      }
      
      updateFields.push('modificado = NOW()');
      params.push(this.turno_id);
      
      await query(
        `UPDATE turnos SET ${updateFields.join(', ')} WHERE turno_id = ?`,
        params
      );
      
      return await Turno.findById(this.turno_id);
    } catch (error) {
      console.error('Error en update:', error);
      if (error.message.includes('Ya existe un turno') || 
          error.message.includes('se solapa') || 
          error.message.includes('hora de inicio')) {
        throw error;
      }
      throw new Error('Error al actualizar turno');
    }
  }

  /**
   * Soft delete - marcar como inactivo
   */
  async softDelete() {
    try {
      // Verifica si el turno está siendo usado en reservas activas
      const reservasActivas = await query(
        'SELECT COUNT(*) as count FROM reservas WHERE turno_id = ? AND activo = 1',
        [this.turno_id]
      );
      
      if (reservasActivas[0].count > 0) {
        throw new Error('No se puede eliminar el turno porque tiene reservas activas');
      }
      
      await query(
        'UPDATE turnos SET activo = 0, modificado = NOW() WHERE turno_id = ?',
        [this.turno_id]
      );
      
      this.activo = false;
      return true;
    } catch (error) {
      console.error('Error en softDelete:', error);
      if (error.message.includes('tiene reservas activas')) {
        throw error;
      }
      throw new Error('Error al eliminar turno');
    }
  }

  /**
   * Restaura turno eliminado
   */
  async restore() {
    try {
      // Verificar que no haya conflictos al restaurar
      const existsOrden = await Turno.existsByOrden(this.orden, this.turno_id);
      if (existsOrden) {
        throw new Error('No se puede restaurar: ya existe un turno activo con este orden');
      }
      
      const hasOverlap = await Turno.checkTimeOverlap(this.hora_desde, this.hora_hasta, this.turno_id);
      if (hasOverlap) {
        throw new Error('No se puede restaurar: el horario se solapa con otro turno activo');
      }
      
      await query(
        'UPDATE turnos SET activo = 1, modificado = NOW() WHERE turno_id = ?',
        [this.turno_id]
      );
      
      return await Turno.findById(this.turno_id);
    } catch (error) {
      console.error('Error en restore:', error);
      if (error.message.includes('No se puede restaurar')) {
        throw error;
      }
      throw new Error('Error al restaurar turno');
    }
  }

  /**
   * Obtener turnos más utilizados
   */
  static async getMostUsed(limit = 5) {
    try {
      const turnos = await query(`
        SELECT 
          t.turno_id,
          t.orden,
          t.hora_desde,
          t.hora_hasta,
          t.activo,
          t.creado,
          t.modificado,
          COUNT(r.turno_id) as reservas_count
        FROM turnos t
        LEFT JOIN reservas r ON t.turno_id = r.turno_id AND r.activo = 1
        WHERE t.activo = 1
        GROUP BY t.turno_id
        ORDER BY reservas_count DESC, t.orden ASC
        LIMIT ?
      `, [limit]);
      
      return turnos.map(turno => ({
        ...new Turno(turno),
        reservas_count: turno.reservas_count
      }));
    } catch (error) {
      console.error('Error en getMostUsed:', error);
      throw new Error('Error al obtener turnos más utilizados');
    }
  }

  /**
   * Obtener todos los turnos activos ordenados
   */
  static async findAllActive() {
    try {
      const turnos = await query(
        'SELECT turno_id, orden, hora_desde, hora_hasta, activo, creado, modificado FROM turnos WHERE activo = 1 ORDER BY orden ASC'
      );
      
      return turnos.map(turno => new Turno(turno));
    } catch (error) {
      console.error('Error en findAllActive:', error);
      throw new Error('Error al obtener turnos activos');
    }
  }

  /**
   * Verificar disponibilidad en fecha específica
   */
  async checkAvailability(fecha, salonId) {
    try {
      const reservas = await query(
        'SELECT COUNT(*) as count FROM reservas WHERE salon_id = ? AND fecha_reserva = ? AND turno_id = ? AND activo = 1',
        [salonId, fecha, this.turno_id]
      );
      
      return reservas[0].count === 0;
    } catch (error) {
      console.error('Error en checkAvailability:', error);
      throw new Error('Error al verificar disponibilidad del turno');
    }
  }

  /**
   * Formatear hora para display
   */
  getFormattedTime() {
    return `${this.hora_desde} - ${this.hora_hasta}`;
  }

  /**
   * Calcular duración en horas
   */
  getDuration() {
    const [horaDesdeH, horaDesdeM] = this.hora_desde.split(':');
    const [horaHastaH, horaHastaM] = this.hora_hasta.split(':');
    
    const inicioMinutos = parseInt(horaDesdeH) * 60 + parseInt(horaDesdeM);
    const finMinutos = parseInt(horaHastaH) * 60 + parseInt(horaHastaM);
    
    return (finMinutos - inicioMinutos) / 60; // Retorna horas como decimal
  }

  /**
   * Verifica si el turno está activo
   */
  isActive() {
    return Boolean(this.activo);
  }

  /**
   * Convertir a JSON limpio para respuestas de API
   */
  toJSON() {
    return {
      turno_id: this.turno_id,
      orden: parseInt(this.orden),
      hora_desde: this.hora_desde,
      hora_hasta: this.hora_hasta,
      horario_completo: this.getFormattedTime(),
      duracion_horas: this.getDuration(),
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
    
    if (!isUpdate || data.orden !== undefined) {
      const orden = parseInt(data.orden);
      if (isNaN(orden) || orden < 1) {
        errors.push('El orden debe ser un número entero positivo');
      } else if (orden > 50) {
        errors.push('El orden no puede ser mayor a 50');
      }
    }
    
    if (!isUpdate || data.hora_desde !== undefined) {
      if (!data.hora_desde || !this.isValidTimeFormat(data.hora_desde)) {
        errors.push('La hora de inicio debe tener formato HH:MM válido');
      }
    }
    
    if (!isUpdate || data.hora_hasta !== undefined) {
      if (!data.hora_hasta || !this.isValidTimeFormat(data.hora_hasta)) {
        errors.push('La hora de fin debe tener formato HH:MM válido');
      }
    }
    
    // Validar que hora_desde < hora_hasta si ambas están presentes
    if (data.hora_desde && data.hora_hasta) {
      if (data.hora_desde >= data.hora_hasta) {
        errors.push('La hora de inicio debe ser menor que la hora de fin');
      }
    }
    
    return errors;
  }

  /**
   * Valida formato de hora HH:MM
   */
  static isValidTimeFormat(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}

export default Turno;