const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'smarthire.db');

console.log('🔄 Running ATS database migrations...');

// Open database
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

try {
  // Read and execute migration SQL
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'migrations/add-ats-tables.sql'),
    'utf8'
  );
  
  db.exec(migrationSQL);
  
  console.log('✅ ATS tables created successfully');
  console.log('   - ats_analyses');
  console.log('   - resumes');
  console.log('   - Indexes created');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}

console.log('🎉 Migration complete!');

