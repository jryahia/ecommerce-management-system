/**
 * PostgreSQL Database Configuration
 * 
 * This module provides a configured connection pool to PostgreSQL.
 * It handles connection errors gracefully and provides helpful messages.
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Build configuration from environment variables
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ecommerce_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Create the pool
const pool = new Pool(config);

// Track connection state
let isConnected = false;
let connectionError = null;

// Handle successful connections
pool.on('connect', () => {
  if (!isConnected) {
    isConnected = true;
    connectionError = null;
    logger.info(`✓ Connected to PostgreSQL database: ${config.database}@${config.host}:${config.port}`);
  }
});

// Handle connection errors
pool.on('error', (err) => {
  isConnected = false;
  connectionError = err;
  logger.error('PostgreSQL connection error:', err.message);
  
  // Provide helpful error messages
  if (err.code === 'ECONNREFUSED') {
    logger.error('💡 Make sure PostgreSQL is running on your machine');
  } else if (err.code === '28P01') {
    logger.error('💡 Check your database username and password in backend/.env');
  } else if (err.code === '3D000') {
    logger.error('💡 Database does not exist. Run: npm run db:init');
  }
});

// Test connection on startup (non-blocking)
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as now, current_database() as db');
    logger.info(`✓ Database connection verified: ${result.rows[0].db}`);
    return true;
  } catch (err) {
    connectionError = err;
    
    // Log helpful error messages based on error type
    if (err.code === 'ECONNREFUSED') {
      logger.error('');
      logger.error('═══════════════════════════════════════════════════════════');
      logger.error('  DATABASE CONNECTION FAILED: PostgreSQL is not running');
      logger.error('═══════════════════════════════════════════════════════════');
      logger.error('');
      logger.error('  Please start PostgreSQL:');
      logger.error('    - Windows: Start "PostgreSQL" service');
      logger.error('    - macOS:   brew services start postgresql');
      logger.error('    - Linux:   sudo systemctl start postgresql');
      logger.error('');
    } else if (err.code === '28P01' || err.code === '28000') {
      logger.error('');
      logger.error('═══════════════════════════════════════════════════════════');
      logger.error('  DATABASE CONNECTION FAILED: Authentication error');
      logger.error('═══════════════════════════════════════════════════════════');
      logger.error('');
      logger.error('  Check your credentials in backend/.env:');
      logger.error(`    DB_USER=${config.user}`);
      logger.error(`    DB_PASSWORD=***`);
      logger.error('');
    } else if (err.code === '3D000') {
      logger.error('');
      logger.error('═══════════════════════════════════════════════════════════');
      logger.error(`  DATABASE CONNECTION FAILED: Database "${config.database}" not found`);
      logger.error('═══════════════════════════════════════════════════════════');
      logger.error('');
      logger.error('  Run the following commands:');
      logger.error('    npm run db:init');
      logger.error('    npm run db:seed');
      logger.error('');
    } else {
      logger.error('Database connection failed:', err.message);
    }
    
    return false;
  }
}

// Run connection test
testConnection();

// Export the query function and pool
module.exports = {
  /**
   * Execute a SQL query
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise} Query result
   */
  query: (text, params) => pool.query(text, params),
  
  /**
   * Get the connection pool for transactions
   */
  pool,
  
  /**
   * Check if database is connected
   */
  isConnected: () => isConnected,
  
  /**
   * Get the last connection error
   */
  getError: () => connectionError,
  
  /**
   * Test the database connection
   */
  testConnection,
};
