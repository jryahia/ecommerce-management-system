/**
 * Database Initialization Script
 * 
 * This script:
 * 1. Creates the database if it doesn't exist
 * 2. Runs the init.sql schema to create all tables
 * 
 * Usage: npm run db:init
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

const dbName = process.env.DB_NAME || 'ecommerce_dev';

// Helper to log with timestamp
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Helper to log errors
function logError(message, error) {
  console.error(`[${new Date().toISOString()}] ❌ ${message}`);
  if (error) {
    console.error(`   Error: ${error.message}`);
    if (error.code) console.error(`   Code: ${error.code}`);
  }
}

async function createDatabaseIfNotExists() {
  const client = new Client({
    ...config,
    database: 'postgres', // Connect to default postgres database first
  });

  try {
    await client.connect();
    log('✓ Connected to PostgreSQL server');

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // Create the database
      await client.query(`CREATE DATABASE "${dbName}"`);
      log(`✓ Database "${dbName}" created successfully`);
      return true; // Database was created
    } else {
      log(`✓ Database "${dbName}" already exists`);
      return false; // Database already existed
    }
  } finally {
    await client.end();
  }
}

async function runInitScript() {
  const client = new Client({
    ...config,
    database: dbName,
  });

  try {
    await client.connect();
    log(`✓ Connected to database "${dbName}"`);

    // Read the init.sql file
    const initSqlPath = path.join(__dirname, '..', '..', 'database', 'init.sql');
    
    if (!fs.existsSync(initSqlPath)) {
      logError(`init.sql not found at: ${initSqlPath}`);
      process.exit(1);
    }

    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    log('✓ Loaded init.sql schema');

    // Split SQL into individual statements and execute them
    // This handles the case where some tables/extensions already exist
    const statements = initSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        await client.query(statement);
        successCount++;
      } catch (err) {
        // Handle "already exists" errors gracefully
        if (err.code === '42710' || // extension already exists
            err.code === '42P07' || // table already exists
            err.code === '42P16' || // constraint already exists
            err.code === '42723' || // function already exists
            err.code === '42P04') { // database already exists
          skipCount++;
        } else {
          // For other errors, log but continue
          logError(`SQL statement failed: ${statement.substring(0, 50)}...`, err);
        }
      }
    }

    log(`✓ Schema initialization complete (${successCount} executed, ${skipCount} skipped)`);

  } finally {
    await client.end();
  }
}

async function main() {
  console.log('');
  log('═══════════════════════════════════════════════════════════');
  log('  E-COMMERCE DATABASE INITIALIZATION');
  log('═══════════════════════════════════════════════════════════');
  console.log('');
  log('Configuration:');
  log(`  Host:     ${config.host}`);
  log(`  Port:     ${config.port}`);
  log(`  User:     ${config.user}`);
  log(`  Database: ${dbName}`);
  console.log('');

  try {
    await createDatabaseIfNotExists();
    await runInitScript();
    
    console.log('');
    log('═══════════════════════════════════════════════════════════');
    log('  ✅ DATABASE INITIALIZATION COMPLETE!');
    log('═══════════════════════════════════════════════════════════');
    console.log('');
    log('Next steps:');
    log('  1. Run: npm run db:seed   (to add sample data)');
    log('  2. Run: npm run dev       (to start the application)');
    console.log('');
    
  } catch (error) {
    console.log('');
    logError('Database initialization failed', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  PostgreSQL is NOT running!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('  Please start PostgreSQL:');
      console.log('');
      console.log('    Windows:');
      console.log('      1. Press Win + R, type "services.msc"');
      console.log('      2. Find "postgresql" service');
      console.log('      3. Right-click → Start');
      console.log('');
      console.log('    macOS:');
      console.log('      brew services start postgresql');
      console.log('');
      console.log('    Linux:');
      console.log('      sudo systemctl start postgresql');
      console.log('');
    } else if (error.code === '28P01' || error.code === '28000') {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  Authentication Failed!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('  Check your credentials in backend/.env:');
      console.log(`    DB_USER=${config.user}`);
      console.log(`    DB_PASSWORD=<your-password>`);
      console.log('');
      console.log('  Common fixes:');
      console.log('    1. Make sure the password is correct');
      console.log('    2. Check pg_hba.conf allows your connection');
      console.log('');
    }
    
    process.exit(1);
  }
}

main();
