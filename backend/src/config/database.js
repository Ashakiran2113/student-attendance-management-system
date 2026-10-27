const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('./constants');

// Resolve path relative to backend root
const resolvedDbPath = path.isAbsolute(DB_PATH) 
  ? DB_PATH 
  : path.resolve(__dirname, '../../', DB_PATH);

// Ensure the directory exists
const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(resolvedDbPath, (err) => {
      if (err) {
        console.error('Failed to connect to SQLite database at:', resolvedDbPath, err);
      } else {
        console.log(`Connected to SQLite database: ${resolvedDbPath}`);
        // Enable foreign key constraints
        dbInstance.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
          if (pragmaErr) console.error('Failed to enable foreign keys:', pragmaErr);
        });
        dbInstance.run('PRAGMA journal_mode = WAL;');
      }
    });
  }
  return dbInstance;
}

// Promise wrapper helpers
function run(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function exec(sql) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Transaction helper
async function withTransaction(callback) {
  await run('BEGIN TRANSACTION');
  try {
    const result = await callback({ run, get, all, exec });
    await run('COMMIT');
    return result;
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

module.exports = {
  getDatabase,
  resolvedDbPath,
  run,
  get,
  all,
  exec,
  withTransaction
};
