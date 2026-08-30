import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Promisified database operations
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize schema tables
export const initDatabase = async () => {
  try {
    // Enable foreign keys
    await dbRun('PRAGMA foreign_keys = ON');

    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Posts table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        audience TEXT NOT NULL,
        media_url TEXT,
        status TEXT NOT NULL DEFAULT 'published',
        scheduled_at DATETIME,
        published_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Lightweight migrations for installations created before scheduling/admin support.
    for (const statement of [
      "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'",
      "ALTER TABLE posts ADD COLUMN status TEXT NOT NULL DEFAULT 'published'",
      'ALTER TABLE posts ADD COLUMN scheduled_at DATETIME',
      'ALTER TABLE posts ADD COLUMN published_at DATETIME'
    ]) {
      try {
        await dbRun(statement);
      } catch (error) {
        if (!String(error.message).includes('duplicate column name')) throw error;
      }
    }

    await dbRun("UPDATE posts SET status = 'published', published_at = COALESCE(published_at, created_at) WHERE status IS NULL OR status = ''");
    if (process.env.ADMIN_EMAIL) {
      await dbRun("UPDATE users SET role = 'admin' WHERE lower(email) = lower(?)", [process.env.ADMIN_EMAIL]);
    }

    console.log('Database tables initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  }
};

export default db;
