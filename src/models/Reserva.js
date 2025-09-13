import { query, transaction } from '../config/database.js';
import Servicio from './Servicio.js';
import Salon from './Salon.js';

class Reserva {
  constructor(data = {}) {
    this.reserva_id = data.reserva_id || null;
    this.fecha_reserva = data.fecha_reserva || null;
    this.salon_id = data.salon_id || null;
    this.usuario_id = data.usuario_id || null;
    this.turno_id = data.turno_id || null;
    this.foto_cumpleaniero = data.foto_cumpleaniero || null;
    this.tematica = data.tematica || '';
    this.importe_salon = data.importe_salon || 0;
    this.importe_total = data.importe_total || 0;
    this.activo = data.activo !== undefined ? Boolean(data.activo) : true;
    this.creado = data.creado || null;
    this.modificado = data.modificado || null;
    this.servicios_adicionales = data.servicios_adicionales || [];
  }

  static async findById(id) {
    try {
      const reservas = await query(
        `SELECT
          r.reserva_id, r.fecha_reserva, r.salon_id, r.usuario_id, r.turno_id,
          r.foto_cumpleaniero, r.tematica, r.importe_salon, r.importe_total,
          r.activo, r.creado, r.modificado,
          u.nombre_usuario, s.nombre as nombre_salon, t.hora_desde as hora_turno
        FROM reservas r
        JOIN usuarios u ON r.usuario_id = u.usuario_id
        JOIN salones s ON r.salon_id = s.salon_id
        JOIN turnos t ON r.turno_id = t.turno_id
        WHERE r.reserva_id = ?`,
        [id]
      );

      if (reservas.length === 0) {
        return null;
      }

      const reserva = new Reserva(reservas[0]);
      reserva.servicios_adicionales = await this.getServiciosAdicionales(id);

      return reserva;
    } catch (error) {
      console.error('Error en findById:', error);
      throw new Error('Error al buscar reserva');
    }
  }

  static async getServiciosAdicionales(reservaId) {
    try {
      const servicios = await query(
        `SELECT s.servicio_id, s.descripcion, s.importe, rs.importe AS importe_adicional
         FROM reservas_servicios rs
         JOIN servicios s ON rs.servicio_id = s.servicio_id
         WHERE rs.reserva_id = ?`,
        [reservaId]
      );
      return servicios;
    } catch (error) {
      console.error('Error en getServiciosAdicionales:', error);
      throw new Error('Error al obtener servicios adicionales');
    }
  }

  static async findAll(options = {}) {
    // Lógica para paginación, filtros y ordenamiento similar a Servicio.findAll
    // Por simplicidad, esta implementación omite la paginación y solo busca por fecha
    try {
      const reservas = await query(`
        SELECT r.reserva_id, r.fecha_reserva, r.salon_id, r.usuario_id, r.turno_id, r.importe_total,
        u.nombre_usuario, s.nombre as nombre_salon, t.hora_desde as hora_turno
        FROM reservas r
        JOIN usuarios u ON r.usuario_id = u.usuario_id
        JOIN salones s ON r.salon_id = s.salon_id
        JOIN turnos t ON r.turno_id = t.turno_id
        ORDER BY r.fecha_reserva DESC
      `);
      return reservas.map(reserva => new Reserva(reserva));
    } catch (error) {
      console.error('Error en findAll:', error);
      throw new Error('Error al obtener reservas');
    }
  }

  static async create(data) {
    const { fecha_reserva, salon_id, usuario_id, turno_id, foto_cumpleaniero, tematica, servicios_adicionales = [] } = data;

    // Validación de disponibilidad
    const isAvailable = await this.checkAvailability(fecha_reserva, salon_id, turno_id);
    if (!isAvailable) {
      throw new Error('El salón no está disponible para la fecha y turno seleccionados.');
    }

    // Calcular importes
    const salon = await Salon.findById(salon_id);
    if (!salon) {
      throw new Error('Salón no encontrado');
    }
    const importe_salon = salon.importe_alquiler;
    let importe_servicios = 0;

    // Iniciar transacción para garantizar atomicidad
    const connection = await transaction.start();
    try {
      // 1. Obtener y sumar el importe de los servicios adicionales
      if (servicios_adicionales.length > 0) {
        const servicios = await Promise.all(servicios_adicionales.map(id => Servicio.findById(id)));
        const serviciosInactivos = servicios.filter(s => !s || !s.activo);
        if (serviciosInactivos.length > 0) {
          throw new Error('Uno o más servicios adicionales no son válidos o están inactivos.');
        }
        importe_servicios = servicios.reduce((sum, s) => sum + s.importe, 0);
      }
      
      const importe_total = importe_salon + importe_servicios;

      // 2. Insertar la reserva
      const result = await transaction.query(
        connection,
        `INSERT INTO reservas (fecha_reserva, salon_id, usuario_id, turno_id, foto_cumpleaniero, tematica, importe_salon, importe_total, creado, modificado, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)`,
        [fecha_reserva, salon_id, usuario_id, turno_id, foto_cumpleaniero, tematica, importe_salon, importe_total]
      );
      const reserva_id = result.insertId;

      // 3. Insertar los servicios adicionales en la tabla pivote
      if (servicios_adicionales.length > 0) {
        for (const servicioId of servicios_adicionales) {
          const servicio = await Servicio.findById(servicioId);
          await transaction.query(
            connection,
            `INSERT INTO reservas_servicios (reserva_id, servicio_id, importe, creado, modificado)
             VALUES (?, ?, ?, NOW(), NOW())`,
            [reserva_id, servicioId, servicio.importe]
          );
        }
      }

      // 4. Confirmar la transacción
      await transaction.commit(connection);

      // 5. Retornar la reserva creada
      return await this.findById(reserva_id);
    } catch (error) {
      await transaction.rollback(connection);
      console.error('Error en create:', error);
      throw error;
    }
  }

  // Verificar la disponibilidad del salón para una fecha y turno
  static async checkAvailability(fecha, salonId, turnoId) {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM reservas WHERE fecha_reserva = ? AND salon_id = ? AND turno_id = ? AND activo = 1',
        [fecha, salonId, turnoId]
      );
      return result[0].count === 0;
    } catch (error) {
      console.error('Error en checkAvailability:', error);
      throw new Error('Error al verificar disponibilidad');
    }
  }

  // Método para el soft delete
  async softDelete() {
    try {
      if (!this.activo) {
        throw new Error('La reserva ya está inactiva');
      }
      await query(
        `UPDATE reservas SET activo = 0, modificado = NOW() WHERE reserva_id = ?`,
        [this.reserva_id]
      );
      this.activo = false;
      return true;
    } catch (error) {
      console.error('Error en softDelete:', error);
      throw new Error('Error al eliminar reserva');
    }
  }
  
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
      servicios_adicionales: this.servicios_adicionales
    };
  }
}

export default Reserva;