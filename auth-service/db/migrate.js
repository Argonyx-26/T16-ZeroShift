// Applies the auth schema against DATABASE_URL.
// The shared project migrations are bootstrapped separately from the repo root.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function migrate() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set. Add it to auth-service/.env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const schemaPath = path.join(__dirname, 'schema.sql');

  try {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log(`-> Running ${path.relative(process.cwd(), schemaPath)}`);
    await pool.query(sql);
    console.log('✅ Auth schema applied successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
