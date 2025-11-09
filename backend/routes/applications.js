const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireRole } = require('../middleware/auth');

// Get applications for a job (employers only)
router.get('/job/:jobId', requireRole('employer'), (req, res) => {
  try {
    // Verify job belongs to employer
    const job = db.prepare(`
      SELECT * FROM jobs WHERE id = ? AND employer_id = ?
    `).get(req.params.jobId, req.session.userId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const applications = db.prepare(`
      SELECT * FROM applications 
      WHERE job_id = ? 
      ORDER BY rank_score DESC, submitted_at DESC
    `).all(req.params.jobId);
    
    // Parse JSON fields
    const parsedApplications = applications.map(app => ({
      ...app,
      candidate_data: app.candidate_data ? JSON.parse(app.candidate_data) : null
    }));
    
    res.json({ applications: parsedApplications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get single application
router.get('/:id', requireAuth, (req, res) => {
  try {
    const application = db.prepare(`
      SELECT a.*, j.title as job_title, j.company_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `).get(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Parse JSON fields
    application.candidate_data = application.candidate_data ? 
      JSON.parse(application.candidate_data) : null;
    
    res.json({ application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Submit application (public route - no auth required)
router.post('/submit', (req, res) => {
  const { job_id, candidate_name, candidate_email, candidate_data } = req.body;
  
  if (!job_id || !candidate_name || !candidate_email || !candidate_data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Check if job exists and is published
    const job = db.prepare(`
      SELECT * FROM jobs WHERE id = ? AND status = 'published'
    `).get(job_id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found or not accepting applications' });
    }
    
    // Create application
    const applicationId = uuidv4();
    const candidateDataStr = JSON.stringify(candidate_data);
    
    db.prepare(`
      INSERT INTO applications (
        id, job_id, candidate_name, candidate_email, candidate_data, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(applicationId, job_id, candidate_name, candidate_email, candidateDataStr);
    
    res.status(201).json({ 
      success: true,
      application_id: applicationId,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Update application status
router.patch('/:id/status', requireRole('employer'), (req, res) => {
  const { status } = req.body;
  
  if (!['pending', 'reviewed', 'shortlisted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  try {
    const result = db.prepare(`
      UPDATE applications 
      SET status = ? 
      WHERE id = ?
    `).run(status, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Application status updated'
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Update application ranking
router.patch('/:id/ranking', requireRole('employer'), (req, res) => {
  const { rank_score, rank_rationale } = req.body;
  
  try {
    db.prepare(`
      UPDATE applications 
      SET rank_score = ?, rank_rationale = ?
      WHERE id = ?
    `).run(rank_score, rank_rationale, req.params.id);
    
    res.json({ 
      success: true,
      message: 'Application ranking updated'
    });
  } catch (error) {
    console.error('Update ranking error:', error);
    res.status(500).json({ error: 'Failed to update ranking' });
  }
});

// Delete application
router.delete('/:id', requireRole('employer'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM applications WHERE id = ?')
      .run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

module.exports = router;

