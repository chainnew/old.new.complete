import fs from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';
import { config } from '../config';

async function runMigrations() {
  const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
  });

  try {
    console.log('🔄 Running database migrations...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf-8');

    await pool.query(schemaSql);

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
