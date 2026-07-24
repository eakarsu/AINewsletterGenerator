const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
  port: process.env.DATABASE_URL ? undefined : (parseInt(process.env.DB_PORT, 10) || 5432),
  database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'newsletter_db'),
  user: process.env.DATABASE_URL ? undefined : (process.env.DB_USER || 'postgres'),
  password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'postgres'),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
