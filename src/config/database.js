import mysql from 'mysql2/promise';

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reservas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
};

// Crea pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    throw error;
  }
};

// Función para ejecutar queries
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Error en query:', error.message);
    throw error;
  }
};

// Sistema de transacciones corregido
const transaction = {
  // Iniciar transacción
  start: async () => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
  },
  
  // Ejecutar query dentro de transacción
  query: async (connection, sql, params = []) => {
    const [rows] = await connection.execute(sql, params);
    return rows;
  },
  
  // Confirmar transacción
  commit: async (connection) => {
    await connection.commit();
    connection.release();
  },
  
  // Revertir transacción
  rollback: async (connection) => {
    await connection.rollback();
    connection.release();
  }
};

// Función helper para transacciones (callback style)
const executeTransaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Exporta funciones y pool
export {
  pool,
  query,
  transaction,
  executeTransaction,
  testConnection
};