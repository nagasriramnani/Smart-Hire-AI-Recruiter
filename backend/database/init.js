const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'smarthire.db');

// Create database directory if it doesn't exist
if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🗄️  Initializing SmartHire local database...');

// Create tables
const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('employer', 'recruiter')) NOT NULL,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  employer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  company_name TEXT,
  location TEXT,
  job_type TEXT,
  salary_range TEXT,
  form_schema TEXT, -- JSON string
  status TEXT CHECK(status IN ('draft', 'published', 'closed')) DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employer_id) REFERENCES users(id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_data TEXT, -- JSON string with form responses
  resume_path TEXT,
  rank_score REAL,
  rank_rationale TEXT,
  status TEXT CHECK(status IN ('pending', 'reviewed', 'shortlisted', 'rejected')) DEFAULT 'pending',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Candidate profiles (for recruiter search)
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  location TEXT,
  bio TEXT,
  skills TEXT, -- JSON array
  experience_years INTEGER DEFAULT 0,
  education TEXT, -- JSON array
  work_history TEXT, -- JSON array
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  avatar TEXT,
  available BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookmarks (for recruiters to save candidates)
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  recruiter_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recruiter_id) REFERENCES users(id),
  FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id),
  UNIQUE(recruiter_id, candidate_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_candidates_location ON candidate_profiles(location);
CREATE INDEX IF NOT EXISTS idx_bookmarks_recruiter ON bookmarks(recruiter_id);
`;

// Execute schema
db.exec(schema);

console.log('✅ Database schema created successfully');
console.log(`📍 Database location: ${DB_PATH}`);

// Close database
db.close();

console.log('🎉 Database initialization complete!');

