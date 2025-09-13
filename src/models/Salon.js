import { query, transaction } from '../config/database.js';

class Salon {
    constructor(data = {}) {
        this.salon_id = data.salon_id || null;
        this.nombre = data.nombre || '';
        this.direccion = data.direccion || '';
        this.latitud = data.latitud || null;
        this.longitud = data.longitud || null;
        this.capacidad = data.capacidad || 0;
        this.importe_alquiler = data.importe_alquiler || 0;
        this.activo = data.activo !== undefined ? Boolean(data.activo) : true;
        this.creado = data.creado || null;
        this.modificado = data.modificado || null;
    }

    static async findAll(options = {}) {
        const { page = 1, limit = 10, includeInactive = false } = options;
        const offset = (page - 1) * limit;
        const whereClause = includeInactive ? '' : 'WHERE activo = 1';
        
        try {
            const [rows] = await query(
                `SELECT * FROM salones ${whereClause} ORDER BY nombre ASC LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            return rows.map(row => new Salon(row));
        } catch (error) {
            console.error('Error en Salon.findAll:', error);
            throw new Error('Error al obtener salones');
        }
    }

    static async findById(id) {
        try {
            const [rows] = await query('SELECT * FROM salones WHERE salon_id = ? AND activo = 1', [id]);
            if (rows.length === 0) {
                return null;
            }
            return new Salon(rows[0]);
        } catch (error) {
            console.error('Error en Salon.findById:', error);
            throw new Error('Error al buscar salón por ID');
        }
    }

    static async create(data) {
        const connection = await transaction.start();
        try {
            const [result] = await transaction.query(
                connection,
                `INSERT INTO salones (nombre, direccion, latitud, longitud, capacidad, importe_alquiler, creado, modificado, activo)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)`,
                [data.nombre, data.direccion, data.latitud, data.longitud, data.capacidad, data.importe_alquiler]
            );
            await transaction.commit(connection);
            return await this.findById(result.insertId);
        } catch (error) {
            await transaction.rollback(connection);
            console.error('Error en Salon.create:', error);
            throw error;
        }
    }

    static async update(id, data) {
        const connection = await transaction.start();
        try {
            const [result] = await transaction.query(
                connection,
                `UPDATE salones SET ? WHERE salon_id = ?`,
                [{ ...data, modificado: new Date() }, id]
            );

            if (result.affectedRows === 0) {
                await transaction.rollback(connection);
                return null;
            }
            
            await transaction.commit(connection);
            return await this.findById(id);
        } catch (error) {
            await transaction.rollback(connection);
            console.error('Error en Salon.update:', error);
            throw error;
        }
    }

    async softDelete() {
        try {
            await query(
                `UPDATE salones SET activo = 0, modificado = NOW() WHERE salon_id = ?`,
                [this.salon_id]
            );
            this.activo = false;
            return true;
        } catch (error) {
            console.error('Error en Salon.softDelete:', error);
            throw new Error('Error al eliminar salón');
        }
    }

    async restore() {
        try {
            await query(
                `UPDATE salones SET activo = 1, modificado = NOW() WHERE salon_id = ?`,
                [this.salon_id]
            );
            this.activo = true;
            return true;
        } catch (error) {
            console.error('Error en Salon.restore:', error);
            throw new Error('Error al restaurar salón');
        }
    }

    toJSON() {
        return {
            salon_id: this.salon_id,
            nombre: this.nombre,
            direccion: this.direccion,
            latitud: this.latitud,
            longitud: this.longitud,
            capacidad: this.capacidad,
            importe_alquiler: parseFloat(this.importe_alquiler),
            activo: Boolean(this.activo),
            creado: this.creado,
            modificado: this.modificado,
        };
    }
}

export default Salon;