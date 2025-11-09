const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database/db');
const { requireRole } = require('../middleware/auth');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// Rank candidates for a job
router.post('/rank/:jobId', requireRole('employer'), async (req, res) => {
  try {
    // Get job details
    const job = db.prepare(`
      SELECT * FROM jobs WHERE id = ? AND employer_id = ?
    `).get(req.params.jobId, req.session.userId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Get applications for this job
    const applications = db.prepare(`
      SELECT * FROM applications WHERE job_id = ?
    `).all(req.params.jobId);
    
    if (applications.length === 0) {
      return res.json({ 
        success: true,
        message: 'No applications to rank',
        ranked_applications: []
      });
    }
    
    // Parse candidate data
    const candidates = applications.map(app => ({
      id: app.id,
      name: app.candidate_name,
      email: app.candidate_email,
      data: app.candidate_data ? JSON.parse(app.candidate_data) : {}
    }));
    
    // Call ML API
    try {
      const mlResponse = await axios.post(`${ML_API_URL}/rank`, {
        job: {
          title: job.title,
          description: job.description,
          requirements: job.form_schema ? JSON.parse(job.form_schema) : {}
        },
        candidates: candidates
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      const rankedCandidates = mlResponse.data.ranked_candidates;
      
      // Update applications with rankings
      const updateStmt = db.prepare(`
        UPDATE applications 
        SET rank_score = ?, rank_rationale = ?
        WHERE id = ?
      `);
      
      for (const ranked of rankedCandidates) {
        updateStmt.run(ranked.score, ranked.rationale, ranked.id);
      }
      
      res.json({ 
        success: true,
        ranked_applications: rankedCandidates,
        message: 'Candidates ranked successfully'
      });
      
    } catch (mlError) {
      console.error('ML API error:', mlError.message);
      
      // Fallback: simple ranking based on random scores
      console.log('Using fallback ranking...');
      const fallbackRanked = candidates.map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        score: Math.random() * 100,
        rationale: 'Ranked using fallback algorithm (ML service unavailable)'
      })).sort((a, b) => b.score - a.score);
      
      // Update applications with fallback rankings
      const updateStmt = db.prepare(`
        UPDATE applications 
        SET rank_score = ?, rank_rationale = ?
        WHERE id = ?
      `);
      
      for (const ranked of fallbackRanked) {
        updateStmt.run(ranked.score, ranked.rationale, ranked.id);
      }
      
      res.json({ 
        success: true,
        ranked_applications: fallbackRanked,
        message: 'Candidates ranked using fallback (ML service unavailable)',
        fallback: true
      });
    }
    
  } catch (error) {
    console.error('Rank candidates error:', error);
    res.status(500).json({ error: 'Failed to rank candidates' });
  }
});

// Check ML service health
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/health`, {
      timeout: 5000
    });
    res.json({ 
      ml_service: 'healthy',
      details: response.data
    });
  } catch (error) {
    res.status(503).json({ 
      ml_service: 'unavailable',
      error: error.message
    });
  }
});

module.exports = router;

