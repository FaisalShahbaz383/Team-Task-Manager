const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function initDatabase() {
  const dbName = process.env.DB_NAME || 'team_task_manager';
  const isProduction = process.env.NODE_ENV === 'production';

  console.log(`[DB Init] Starting database initialization for: ${dbName}`);

  // Step 1: Ensure database exists (connect to default 'postgres' db first if using local params)
  if (!process.env.DATABASE_URL) {
    const adminClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    try {
      await adminClient.connect();
      const checkRes = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName]
      );

      if (checkRes.rowCount === 0) {
        console.log(`[DB Init] Database "${dbName}" does not exist. Creating...`);
        // Note: SQL identifiers cannot be parametrized with $1 in CREATE DATABASE
        await adminClient.query(`CREATE DATABASE "${dbName}"`);
        console.log(`[DB Init] Database "${dbName}" successfully created.`);
      } else {
        console.log(`[DB Init] Database "${dbName}" already exists.`);
      }
    } catch (err) {
      console.warn(`[DB Init] Could not verify/create database via admin client (${err.message}). Proceeding directly with target database connection.`);
    } finally {
      await adminClient.end().catch(() => {});
    }
  }

  // Step 2: Connect to target database and execute database.sql
  const targetClient = new Client(
    process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl:
            process.env.DB_SSL === 'true' || isProduction
              ? { rejectUnauthorized: false }
              : false,
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT, 10) || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: dbName,
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        }
  );

  try {
    await targetClient.connect();
    console.log(`[DB Init] Connected to database "${dbName}".`);

    const sqlPath = path.join(__dirname, 'database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log(`[DB Init] Executing schema script from: ${sqlPath}`);
    await targetClient.query(sqlContent);
    console.log('[DB Init] Schema, tables, constraints, and indexes successfully initialized!');
  } catch (err) {
    console.error('[DB Init] Error initializing database schema:', err);
    process.exit(1);
  } finally {
    await targetClient.end().catch(() => {});
  }
}

if (require.main === module) {
  initDatabase().then(() => {
    console.log('[DB Init] Completed successfully.');
    process.exit(0);
  });
}

module.exports = initDatabase;
