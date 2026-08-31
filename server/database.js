import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const usingPostgres = Boolean(process.env.DATABASE_URL);
const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const pool = usingPostgres ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}) : null;
const sqlite = usingPostgres ? null : new sqlite3.Database(dbPath, (error) => {
  if (error) console.error('Error opening SQLite database:', error);
  else console.log('Connected to SQLite database at:', dbPath);
});

const postgresSql = (sql) => {
  let parameter = 0;
  return sql.replace(/\?/g, () => `$${++parameter}`);
};

export const dbRun = (sql, params = []) => {
  if (usingPostgres) return pool.query(postgresSql(sql), params).then((result) => ({ lastID: null, changes: result.rowCount }));
  return new Promise((resolve, reject) => sqlite.run(sql, params, function callback(error) {
    if (error) reject(error); else resolve({ lastID: this.lastID, changes: this.changes });
  }));
};
export const dbGet = async (sql, params = []) => {
  if (usingPostgres) return (await pool.query(postgresSql(sql), params)).rows[0];
  return new Promise((resolve, reject) => sqlite.get(sql, params, (error, row) => error ? reject(error) : resolve(row)));
};
export const dbAll = async (sql, params = []) => {
  if (usingPostgres) return (await pool.query(postgresSql(sql), params)).rows;
  return new Promise((resolve, reject) => sqlite.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
};

const createSchema = async () => {
  await dbRun(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await dbRun(`CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, content TEXT NOT NULL,
    audience TEXT NOT NULL, media_url TEXT, status TEXT NOT NULL DEFAULT 'published',
    scheduled_at TIMESTAMP, published_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
};

export const initDatabase = async () => {
  try {
    if (usingPostgres) {
      await pool.query('SELECT 1');
      await createSchema();
      for (const statement of [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'",
        "ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'",
        'ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP',
        'ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP'
      ]) await dbRun(statement);
      console.log('Connected to PostgreSQL database.');
    } else {
      await dbRun('PRAGMA foreign_keys = ON');
      await createSchema();
      for (const statement of [
        "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'",
        "ALTER TABLE posts ADD COLUMN status TEXT NOT NULL DEFAULT 'published'",
        'ALTER TABLE posts ADD COLUMN scheduled_at DATETIME',
        'ALTER TABLE posts ADD COLUMN published_at DATETIME'
      ]) {
        try { await dbRun(statement); } catch (error) {
          if (!String(error.message).includes('duplicate column name')) throw error;
        }
      }
    }
    await dbRun("UPDATE posts SET status = 'published', published_at = COALESCE(published_at, created_at) WHERE status IS NULL OR status = ''");
    if (process.env.ADMIN_EMAIL) await dbRun("UPDATE users SET role = 'admin' WHERE lower(email) = lower(?)", [process.env.ADMIN_EMAIL]);
    console.log('Database tables initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  }
};

export default sqlite;
