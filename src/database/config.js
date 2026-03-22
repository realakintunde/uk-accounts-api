const { Pool } = require('pg');

let dbAvailable = false;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'uk_accounts_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

pool.on('error', (err) => {
  console.error('Database error:', err.message);
  // Don't exit - allow graceful degradation
});

const setupDatabase = async () => {
  try {
    const connection = await pool.connect();
    console.log('✓ Database connected successfully');
    connection.release();
    dbAvailable = true;
    return true;
  } catch (err) {
    console.warn('⚠ Database connection failed:', err.message);
    console.warn('⚠ Using in-memory storage for demo mode');
    dbAvailable = false;
    return false;
  }
};

const query = (text, params) => {
  if (!dbAvailable) {
    throw new Error('Database not available - use demo mode');
  }
  return pool.query(text, params);
};

const getClient = () => {
  if (!dbAvailable) {
    throw new Error('Database not available - use demo mode');
  }
  return pool.connect();
};

const isConnected = () => dbAvailable;

module.exports = {
  query,
  getClient,
  setupDatabase,
  pool,
  isConnected,
};
