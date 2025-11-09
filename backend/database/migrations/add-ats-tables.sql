-- ATS Analysis Results Table
CREATE TABLE IF NOT EXISTS ats_analyses (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  
  -- Scores
  overall_score REAL,
  keyword_score REAL,
  skills_score REAL,
  experience_score REAL,
  format_score REAL,
  
  -- Analysis Data
  matched_keywords TEXT, -- JSON
  missing_keywords TEXT, -- JSON
  skill_gaps TEXT, -- JSON
  recommendations TEXT, -- JSON
  
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Resume/CV Storage Table
CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  parsed_text TEXT,
  parsed_data TEXT, -- JSON structured data
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  UNIQUE(application_id) -- One resume per application
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ats_application ON ats_analyses(application_id);
CREATE INDEX IF NOT EXISTS idx_ats_job ON ats_analyses(job_id);
CREATE INDEX IF NOT EXISTS idx_ats_score ON ats_analyses(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_application ON resumes(application_id);

