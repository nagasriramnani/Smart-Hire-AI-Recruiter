const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'smarthire.db');

// Create and export database instance
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Helper function to serialize database results
db.serialize = (rows) => {
  if (Array.isArray(rows)) {
    return rows.map(row => ({ ...row }));
  }
  return rows ? { ...rows } : null;
};

module.exports = db;

