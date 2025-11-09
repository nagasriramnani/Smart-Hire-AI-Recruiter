const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireRole } = require('../middleware/auth');

// Get all jobs for an employer
router.get('/', requireAuth, (req, res) => {
  try {
    let jobs;
    
    if (req.session.role === 'employer') {
      // Employers see only their jobs
      jobs = db.prepare(`
        SELECT j.*, COUNT(a.id) as application_count
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE j.employer_id = ?
        GROUP BY j.id
        ORDER BY j.created_at DESC
      `).all(req.session.userId);
    } else {
      // Recruiters can see all published jobs
      jobs = db.prepare(`
        SELECT j.*, COUNT(a.id) as application_count
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE j.status = 'published'
        GROUP BY j.id
        ORDER BY j.created_at DESC
      `).all();
    }
    
    // Parse JSON fields
    jobs = jobs.map(job => ({
      ...job,
      form_schema: job.form_schema ? JSON.parse(job.form_schema) : null
    }));
    
    res.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get single job by ID
router.get('/:id', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Parse JSON fields
    job.form_schema = job.form_schema ? JSON.parse(job.form_schema) : null;
    
    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create new job
router.post('/', requireRole('employer'), (req, res) => {
  const { 
    title, 
    description, 
    company_name, 
    location, 
    job_type, 
    salary_range, 
    form_schema,
    status = 'draft'
  } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  try {
    const jobId = uuidv4();
    const formSchemaStr = form_schema ? JSON.stringify(form_schema) : null;
    
    db.prepare(`
      INSERT INTO jobs (
        id, employer_id, title, description, company_name, 
        location, job_type, salary_range, form_schema, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      jobId, req.session.userId, title, description, company_name,
      location, job_type, salary_range, formSchemaStr, status
    );
    
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    job.form_schema = job.form_schema ? JSON.parse(job.form_schema) : null;
    
    res.status(201).json({ 
      success: true, 
      job,
      message: 'Job created successfully'
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', requireRole('employer'), (req, res) => {
  const { 
    title, 
    description, 
    company_name, 
    location, 
    job_type, 
    salary_range, 
    form_schema,
    status
  } = req.body;
  
  try {
    // Check if job exists and belongs to employer
    const existingJob = db.prepare(`
      SELECT * FROM jobs WHERE id = ? AND employer_id = ?
    `).get(req.params.id, req.session.userId);
    
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const formSchemaStr = form_schema ? JSON.stringify(form_schema) : existingJob.form_schema;
    
    db.prepare(`
      UPDATE jobs 
      SET title = ?, description = ?, company_name = ?, location = ?,
          job_type = ?, salary_range = ?, form_schema = ?, status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || existingJob.title,
      description !== undefined ? description : existingJob.description,
      company_name || existingJob.company_name,
      location || existingJob.location,
      job_type || existingJob.job_type,
      salary_range || existingJob.salary_range,
      formSchemaStr,
      status || existingJob.status,
      req.params.id
    );
    
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    job.form_schema = job.form_schema ? JSON.parse(job.form_schema) : null;
    
    res.json({ 
      success: true, 
      job,
      message: 'Job updated successfully'
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job
router.delete('/:id', requireRole('employer'), (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM jobs WHERE id = ? AND employer_id = ?
    `).run(req.params.id, req.session.userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Get job statistics
router.get('/:id/stats', requireRole('employer'), (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed,
        COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM applications
      WHERE job_id = ?
    `).get(req.params.id);
    
    res.json({ stats });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;

