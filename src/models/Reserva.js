import { query, transaction } from '../config/database.js';
import Salon from './Salon.js';
import Usuario from './Usuario.js';
import Turno from './Turno.js';
import Servicio from './Servicio.js';

class Reserva {
  constructor(data = {}) {
    this.reserva_id = data.reserva_id || null;
    this.fecha_reserva = data.fecha_reserva || null;
    this.salon_id = data.salon_id || null;
    this.usuario_id = data.usuario_id || null;
    this.turno_id = data.turno_id || null;
    this.foto_cumpleaniero = data.foto_cumpleaniero || null;
    this.tematica = data.tematica || null;
    this.importe_salon = data.importe_salon || 0;
    this.importe_total = data.importe_total || 0;
    this.activo = data.activo !== undefined ? Boolean(data.activo) : true;
    this.creado = data.creado || null;
    this.modificado = data.modificado || null;
    
    // Datos relacionados (si están disponibles)
    this.salon = data.salon || null;
    this.usuario = data.usuario || null;
    this.turno = data.turno || null;
    this.servicios = data.servicios || [];
  }

  /**
   * Obtener todas las reservas con paginación y filtros
   */
  static async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      includeInactive = false,
      fechaDesde = null,
      fechaHasta = null,
      usuarioId = null,
      salonId = null,
      turnoId = null,
      includeRelations = true
    } = options;
    
    const offset = (page - 1) * limit;
    
    let whereClause = includeInactive ? '1=1' : 'r.activo = 1';
    let params = [];
    
    if (search && search.trim()) {
      whereClause += ' AND (r.tematica LIKE ? OR u.nombre LIKE ? OR u.apellido LIKE ? OR s.titulo LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (fechaDesde) {
      whereClause += ' AND r.fecha_reserva >= ?';
      params.push(fechaDesde);
    }
    
    if (fechaHasta) {
      whereClause += ' AND r.fecha_reserva <= ?';
      params.push(fechaHasta);
    }
    
    if (usuarioId) {
      whereClause += ' AND r.usuario_id = ?';
      params.push(usuarioId);
    }
    
    if (salonId) {
      whereClause += ' AND r.salon_id = ?';
      params.push(salonId);
    }
    
    if (turnoId) {
      whereClause += ' AND r.turno_id = ?';
      params.push(turnoId);
    }
    
    try {
      const baseSelect = includeRelations ? `
        SELECT 
          r.reserva_id, r.fecha_reserva, r.salon_id, r.usuario_id, r.turno_id,
          r.foto_cumpleaniero, r.tematica, r.importe_salon, r.importe_total,
          r.activo, r.creado, r.modificado,
          s.titulo as salon_titulo, s.direccion as salon_direccion, s.capacidad as salon_capacidad,
          u.nombre as usuario_nombre, u.apellido as usuario_apellido, u.nombre_usuario as usuario_email,
          t.orden as turno_orden, t.hora_desde, t.hora_hasta
      ` : `
        SELECT r.reserva_id, r.fecha_reserva, r.salon_id, r.usuario_id, r.turno_id,
               r.foto_cumpleaniero, r.tematica, r.importe_salon, r.importe_total,
               r.activo, r.creado, r.modificado
      `;
      
      const fromClause = includeRelations ? `
        FROM reservas r
        LEFT JOIN salones s ON r.salon_id = s.salon_id
        LEFT JOIN usuarios u ON r.usuario_id = u.usuario_id
        LEFT JOIN turnos t ON r.turno_id = t.turno_id
      ` : 'FROM reservas r';
      
      const reservasQuery = `
        ${baseSelect}
        ${fromClause}
        WHERE ${whereClause}
        ORDER BY r.activo DESC, r.fecha_reserva DESC, r.creado DESC
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        ${fromClause}
        WHERE ${whereClause}
      `;
      
      const reservasParams = [...params, limit, offset];
      const countParams = [...params];
      
      const [reservas, totalResult] = await Promise.all([
        query(reservasQuery, reservasParams),
        query(countQuery, countParams)
      ]);
      
      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limit);
      
      // Procesar reservas con datos relacionados si se incluyen
      const reservasProcessed = await Promise.all(
        reservas.map(async (reservaData) => {
          const reserva = new Reserva(reservaData);
          
          if (includeRelations && reservaData.salon_titulo) {
            reserva.salon = {
              salon_id: reservaData.salon_id,
              titulo: reservaData.salon_titulo,
              direccion: reservaData.salon_direccion,
              capacidad: reservaData.salon_capacidad
            };
          }
          
          if (includeRelations && reservaData.usuario_nombre) {
            reserva.usuario = {
              usuario_id: reservaData.usuario_id,
              nombre: reservaData.usuario_nombre,
              apellido: reservaData.usuario_apellido,
              nombre_usuario: reservaData.usuario_email
            };
          }
          
          if (includeRelations && reservaData.turno_orden) {
            reserva.turno = {
              turno_id: reservaData.turno_id,
              orden: reservaData.turno_orden,
              hora_desde: reservaData.hora_desde,
              hora_hasta: reservaData.hora_hasta
            };
          }
          
          // Cargar servicios de la reserva
          if (includeRelations) {
            reserva.servicios = await reserva.getServicios();
          }
          
          return reserva;
        })
      );
      
      return {
        reservas: reservasProcessed,
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
      throw new Error('Error al obtener reservas');
    }
  }

  /**
   * Buscar reserva por ID con relaciones
   */
  static async findById(id, includeRelations = true) {
    try {
      const reservasQuery = includeRelations ? `
        SELECT 
          r.reserva_id, r.fecha_reserva, r.salon_id, r.usuario_id, r.turno_id,
          r.foto_cumpleaniero, r.tematica, r.importe_salon, r.importe_total,
          r.activo, r.creado, r.modificado,
          s.titulo as salon_titulo, s.direccion as salon_direccion, 
          s.capacidad as salon_capacidad, s.importe as salon_importe,
          u.nombre as usuario_nombre, u.apellido as usuario_apellido, 
          u.nombre_usuario as usuario_email, u.celular as usuario_celular,
          t.orden as turno_orden, t.hora_desde, t.hora_hasta
        FROM reservas r
        LEFT JOIN salones s ON r.salon_id = s.salon_id
        LEFT JOIN usuarios u ON r.usuario_id = u.usuario_id  
        LEFT JOIN turnos t ON r.turno_id = t.turno_id
        WHERE r.reserva_id = ?
      ` : `
        SELECT reserva_id, fecha_reserva, salon_id, usuario_id, turno_id,
               foto_cumpleaniero, tematica, importe_salon, importe_total,
               activo, creado, modificado
        FROM reservas WHERE reserva_id = ?
      `;
      
      const reservas = await query(reservasQuery, [id]);
      
      if (reservas.length === 0) return null;
      
      const reservaData = reservas[0];
      const reserva = new Reserva(reservaData);
      
      if (includeRelations) {
        // Agregar datos del salón
        if (reservaData.salon_titulo) {
          reserva.salon = {
            salon_id: reservaData.salon_id,
            titulo: reservaData.salon_titulo,
            direccion: reservaData.salon_direccion,
            capacidad: reservaData.salon_capacidad,
            importe: reservaData.salon_importe
          };
        }
        
        // Agregar datos del usuario
        if (reservaData.usuario_nombre) {
          reserva.usuario = {
            usuario_id: reservaData.usuario_id,
            nombre: reservaData.usuario_nombre,
            apellido: reservaData.usuario_apellido,
            nombre_usuario: reservaData.usuario_email,
            celular: reservaData.usuario_celular
          };
        }
        
        // Agregar datos del turno
        if (reservaData.turno_orden) {
          reserva.turno = {
            turno_id: reservaData.turno_id,
            orden: reservaData.turno_orden,
            hora_desde: reservaData.hora_desde,
            hora_hasta: reservaData.hora_hasta
          };
        }
        
        // Cargar servicios
        reserva.servicios = await reserva.getServicios();
      }
      
      return reserva;
    } catch (error) {
      console.error('Error en findById:', error);
      throw new Error('Error al buscar reserva');
    }
  }

  /**
   * Buscar reserva activa por ID
   */
  static async findActiveById(id) {
    const reserva = await Reserva.findById(id);
    return (reserva && reserva.activo) ? reserva : null;
  }

  /**
   * Verifica disponibilidad de salon en fecha y turno específico
   */
  static async checkAvailability(salonId, fecha, turnoId, excludeReservaId = null) {
    try {
      let sql = 'SELECT COUNT(*) as count FROM reservas WHERE salon_id = ? AND fecha_reserva = ? AND turno_id = ? AND activo = 1';
      let params = [salonId, fecha, turnoId];
      
      if (excludeReservaId) {
        sql += ' AND reserva_id != ?';
        params.push(excludeReservaId);
      }
      
      const result = await query(sql, params);
      return result[0].count === 0;
    } catch (error) {
      console.error('Error en checkAvailability:', error);
      throw new Error('Error al verificar disponibilidad');
    }
  }

  /**
   * Crea nueva reserva con servicios
   */
  static async create(data) {
    const { 
      fecha_reserva, 
      salon_id, 
      usuario_id, 
      turno_id, 
      foto_cumpleaniero = null,
      tematica = null,
      servicios = []
    } = data;
    
    try {
      return await transaction(async (connection) => {
        // Verificar disponibilidad
        const isAvailable = await Reserva.checkAvailability(salon_id, fecha_reserva, turno_id);
        if (!isAvailable) {
          throw new Error('El salón no está disponible en la fecha y turno seleccionados');
        }
        
        // Verificar que existan las entidades relacionadas
        const salon = await Salon.findActiveById(salon_id);
        if (!salon) {
          throw new Error('El salón especificado no existe o no está activo');
        }
        
        const usuario = await Usuario.findActiveById(usuario_id);
        if (!usuario) {
          throw new Error('El usuario especificado no existe o no está activo');
        }
        
        const turno = await Turno.findActiveById(turno_id);
        if (!turno) {
          throw new Error('El turno especificado no existe o no está activo');
        }
        
        const importe_salon = parseFloat(salon.importe);
        let importe_total = importe_salon;
        
        // Crear la reserva
        const [result] = await connection.execute(
          'INSERT INTO reservas (fecha_reserva, salon_id, usuario_id, turno_id, foto_cumpleaniero, tematica, importe_salon, importe_total, activo, creado, modificado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
          [fecha_reserva, salon_id, usuario_id, turno_id, foto_cumpleaniero, tematica, importe_salon, importe_total]
        );
        
        const reserva_id = result.insertId;
        
        // Agregar servicios si se especificaron
        if (servicios && servicios.length > 0) {
          let importe_servicios = 0;
          
          for (const servicioData of servicios) {
            const servicio = await Servicio.findActiveById(servicioData.servicio_id);
            if (!servicio) {
              throw new Error(`El servicio con ID ${servicioData.servicio_id} no existe o no está activo`);
            }
            
            const importe_servicio = parseFloat(servicio.importe);
            importe_servicios += importe_servicio;
            
            await connection.execute(
              'INSERT INTO reservas_servicios (reserva_id, servicio_id, importe, creado, modificado) VALUES (?, ?, ?, NOW(), NOW())',
              [reserva_id, servicioData.servicio_id, importe_servicio]
            );
          }
          
          // Actualizar importe total
          importe_total = importe_salon + importe_servicios;
          await connection.execute(
            'UPDATE reservas SET importe_total = ?, modificado = NOW() WHERE reserva_id = ?',
            [importe_total, reserva_id]
          );
        }
        
        return await Reserva.findById(reserva_id);
      });
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  }

  /**
   * Actualiza reserva (solo administradores según requerimientos)
   */
  async update(data) {
    const { 
      fecha_reserva, 
      salon_id, 
      turno_id, 
      foto_cumpleaniero, 
      tematica,
      servicios,
      activo 
    } = data;
    
    try {
      return await transaction(async (connection) => {
        const updateFields = [];
        const params = [];
        let shouldRecalculate = false;
        
        // Verificar disponibilidad si se cambia fecha, salón o turno
        if ((fecha_reserva && fecha_reserva !== this.fecha_reserva) ||
            (salon_id && salon_id !== this.salon_id) ||
            (turno_id && turno_id !== this.turno_id)) {
          
          const newFecha = fecha_reserva || this.fecha_reserva;
          const newSalon = salon_id || this.salon_id;
          const newTurno = turno_id || this.turno_id;
          
          const isAvailable = await Reserva.checkAvailability(newSalon, newFecha, newTurno, this.reserva_id);
          if (!isAvailable) {
            throw new Error('El salón no está disponible en la fecha y turno seleccionados');
          }
        }
        
        if (fecha_reserva !== undefined) {
          updateFields.push('fecha_reserva = ?');
          params.push(fecha_reserva);
        }
        
        if (salon_id !== undefined) {
          const salon = await Salon.findActiveById(salon_id);
          if (!salon) {
            throw new Error('El salón especificado no existe o no está activo');
          }
          
          updateFields.push('salon_id = ?');
          updateFields.push('importe_salon = ?');
          params.push(salon_id, parseFloat(salon.importe));
          shouldRecalculate = true;
        }
        
        if (turno_id !== undefined) {
          const turno = await Turno.findActiveById(turno_id);
          if (!turno) {
            throw new Error('El turno especificado no existe o no está activo');
          }
          
          updateFields.push('turno_id = ?');
          params.push(turno_id);
        }
        
        if (foto_cumpleaniero !== undefined) {
          updateFields.push('foto_cumpleaniero = ?');
          params.push(foto_cumpleaniero);
        }
        
        if (tematica !== undefined) {
          updateFields.push('tematica = ?');
          params.push(tematica);
        }
        
        if (activo !== undefined) {
          updateFields.push('activo = ?');
          params.push(Boolean(activo));
        }
        
        // Actualizar servicios si se especificaron
        if (servicios !== undefined) {
          // Eliminar servicios actuales
          await connection.execute(
            'DELETE FROM reservas_servicios WHERE reserva_id = ?',
            [this.reserva_id]
          );
          
          // Agregar nuevos servicios
          let importe_servicios = 0;
          
          if (servicios.length > 0) {
            for (const servicioData of servicios) {
              const servicio = await Servicio.findActiveById(servicioData.servicio_id);
              if (!servicio) {
                throw new Error(`El servicio con ID ${servicioData.servicio_id} no existe o no está activo`);
              }
              
              const importe_servicio = parseFloat(servicio.importe);
              importe_servicios += importe_servicio;
              
              await connection.execute(
                'INSERT INTO reservas_servicios (reserva_id, servicio_id, importe, creado, modificado) VALUES (?, ?, ?, NOW(), NOW())',
                [this.reserva_id, servicioData.servicio_id, importe_servicio]
              );
            }
          }
          
          shouldRecalculate = true;
        }
        
        // Recalcular importe total si es necesario
        if (shouldRecalculate) {
          const [salonResult] = await connection.execute(
            'SELECT importe FROM salones WHERE salon_id = ?',
            [salon_id || this.salon_id]
          );
          
          const [serviciosResult] = await connection.execute(
            'SELECT COALESCE(SUM(importe), 0) as total_servicios FROM reservas_servicios WHERE reserva_id = ?',
            [this.reserva_id]
          );
          
          const nuevo_importe_total = parseFloat(salonResult[0].importe) + parseFloat(serviciosResult[0].total_servicios);
          
          updateFields.push('importe_total = ?');
          params.push(nuevo_importe_total);
        }
        
        if (updateFields.length === 0) {
          return this;
        }
        
        updateFields.push('modificado = NOW()');
        params.push(this.reserva_id);
        
        await connection.execute(
          `UPDATE reservas SET ${updateFields.join(', ')} WHERE reserva_id = ?`,
          params
        );
        
        return await Reserva.findById(this.reserva_id);
      });
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }

  /**
   * Soft delete
   */
  async softDelete() {
    try {
      await query(
        'UPDATE reservas SET activo = 0, modificado = NOW() WHERE reserva_id = ?',
        [this.reserva_id]
      );
      
      this.activo = false;
      return true;
    } catch (error) {
      console.error('Error en softDelete:', error);
      throw new Error('Error al eliminar reserva');
    }
  }

  /**
   * Restaura reserva eliminada
   */
  async restore() {
    try {
      // Verificar disponibilidad antes de restaurar
      const isAvailable = await Reserva.checkAvailability(
        this.salon_id, 
        this.fecha_reserva, 
        this.turno_id, 
        this.reserva_id
      );
      
      if (!isAvailable) {
        throw new Error('No se puede restaurar: el salón ya no está disponible en esa fecha y turno');
      }
      
      await query(
        'UPDATE reservas SET activo = 1, modificado = NOW() WHERE reserva_id = ?',
        [this.reserva_id]
      );
      
      return await Reserva.findById(this.reserva_id);
    } catch (error) {
      console.error('Error en restore:', error);
      throw error;
    }
  }

  /**
   * Obtener servicios de la reserva
   */
  async getServicios() {
    try {
      const servicios = await query(`
        SELECT 
          s.servicio_id,
          s.descripcion,
          rs.importe,
          s.activo,
          rs.creado,
          rs.modificado
        FROM reservas_servicios rs
        INNER JOIN servicios s ON rs.servicio_id = s.servicio_id
        WHERE rs.reserva_id = ?
        ORDER BY s.descripcion ASC
      `, [this.reserva_id]);
      
      return servicios.map(servicio => ({
        servicio_id: servicio.servicio_id,
        descripcion: servicio.descripcion,
        importe: parseFloat(servicio.importe),
        activo: Boolean(servicio.activo),
        creado: servicio.creado,
        modificado: servicio.modificado
      }));
    } catch (error) {
      console.error('Error en getServicios:', error);
      throw new Error('Error al obtener servicios de la reserva');
    }
  }

  /**
   * Obtener reservas próximas (para recordatorios)
   */
  static async getUpcoming(dias = 1) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + dias);
      
      const reservas = await query(`
        SELECT 
          r.reserva_id, r.fecha_reserva, r.tematica,
          u.nombre, u.apellido, u.nombre_usuario, u.celular,
          s.titulo as salon_titulo,
          t.hora_desde, t.hora_hasta
        FROM reservas r
        INNER JOIN usuarios u ON r.usuario_id = u.usuario_id
        INNER JOIN salones s ON r.salon_id = s.salon_id
        INNER JOIN turnos t ON r.turno_id = t.turno_id
        WHERE r.activo = 1 
          AND r.fecha_reserva BETWEEN CURDATE() AND ?
          AND u.activo = 1
        ORDER BY r.fecha_reserva ASC, t.orden ASC
      `, [fechaLimite.toISOString().split('T')[0]]);
      
      return reservas;
    } catch (error) {
      console.error('Error en getUpcoming:', error);
      throw new Error('Error al obtener reservas próximas');
    }
  }

  /**
   * Estadísticas de reservas por mes
   */
  static async getStatsByMonth(year = new Date().getFullYear()) {
    try {
      const stats = await query(`
        SELECT 
          MONTH(fecha_reserva) as mes,
          COUNT(*) as total_reservas,
          SUM(importe_total) as total_ingresos,
          AVG(importe_total) as promedio_por_reserva
        FROM reservas 
        WHERE YEAR(fecha_reserva) = ? AND activo = 1
        GROUP BY MONTH(fecha_reserva)
        ORDER BY mes
      `, [year]);
      
      return stats.map(stat => ({
        mes: stat.mes,
        nombre_mes: this.getMonthName(stat.mes),
        total_reservas: stat.total_reservas,
        total_ingresos: parseFloat(stat.total_ingresos),
        promedio_por_reserva: parseFloat(stat.promedio_por_reserva)
      }));
    } catch (error) {
      console.error('Error en getStatsByMonth:', error);
      throw new Error('Error al obtener estadísticas por mes');
    }
  }

  /**
   * Helper para nombre del mes
   */
  static getMonthName(monthNumber) {
    const months = [
      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNumber] || '';
  }

  /**
   * Verifica si la reserva está activa
   */
  isActive() {
    return Boolean(this.activo);
  }

  /**
   * Verifica si la reserva es próxima (dentro de 24 horas)
   */
  isUpcoming() {
    const now = new Date();
    const reservaDate = new Date(this.fecha_reserva);
    const diffHours = (reservaDate - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  }

  /**
   * Convertir a JSON limpio para respuestas de API
   */
  toJSON() {
    return {
      reserva_id: this.reserva_id,
      fecha_reserva: this.fecha_reserva,
      salon_id: this.salon_id,
      usuario_id: this.usuario_id,
      turno_id: this.turno_id,
      foto_cumpleaniero: this.foto_cumpleaniero,
      tematica: this.tematica,
      importe_salon: parseFloat(this.importe_salon),
      importe_total: parseFloat(this.importe_total),
      activo: Boolean(this.activo),
      creado: this.creado,
      modificado: this.modificado,
      salon: this.salon,
      usuario: this.usuario,
      turno: this.turno,
      servicios: this.servicios
    };
  }

  /**
   * Valida datos antes de operaciones
   */
  static validateData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate || data.fecha_reserva !== undefined) {
      if (!data.fecha_reserva) {
        errors.push('La fecha de reserva es requerida');
      } else {
        const fecha = new Date(data.fecha_reserva);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fecha < hoy) {
          errors.push('La fecha de reserva no puede ser anterior a hoy');
        }
      }
    }
    
    if (!isUpdate || data.salon_id !== undefined) {
      const salonId = parseInt(data.salon_id);
      if (isNaN(salonId) || salonId < 1) {
        errors.push('Debe especificar un salón válido');
      }
    }
    
    if (!isUpdate || data.usuario_id !== undefined) {
      const usuarioId = parseInt(data.usuario_id);
      if (isNaN(usuarioId) || usuarioId < 1) {
        errors.push('Debe especificar un usuario válido');
      }
    }
    
    if (!isUpdate || data.turno_id !== undefined) {
      const turnoId = parseInt(data.turno_id);
      if (isNaN(turnoId) || turnoId < 1) {
        errors.push('Debe especificar un turno válido');
      }
    }
    
    if (data.tematica !== undefined && data.tematica !== null && data.tematica.length > 255) {
      errors.push('La temática no puede exceder 255 caracteres');
    }
    
    if (data.servicios !== undefined && Array.isArray(data.servicios)) {
      data.servicios.forEach((servicio, index) => {
        const servicioId = parseInt(servicio.servicio_id);
        if (isNaN(servicioId) || servicioId < 1) {
          errors.push(`El servicio en posición ${index + 1} debe tener un ID válido`);
        }
      });
    }
    
    return errors;
  }
}

export default Reserva;