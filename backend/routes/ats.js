const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { requireRole } = require('../middleware/auth');
const ResumeParser = require('../services/resume-parser');
const ATSService = require('../services/ats-service');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/resumes');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  }
});

const resumeParser = new ResumeParser();
const atsService = new ATSService();

// Parse and analyze resume
router.post('/parse-resume', requireRole('employer'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Read file buffer
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Parse resume
    const parsedData = await resumeParser.parseResume(fileBuffer, req.file.mimetype);
    
    // Calculate quality metrics
    const qualityMetrics = resumeParser.calculateQualityMetrics(parsedData);
    
    res.json({
      success: true,
      parsed_data: parsedData,
      quality_metrics: qualityMetrics,
      file_info: {
        original_name: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    res.status(500).json({ error: 'Failed to parse resume', details: error.message });
  }
});

// Analyze application with ATS
router.post('/analyze-application', requireRole('employer'), async (req, res) => {
  try {
    const { application_id, job_id } = req.body;
    
    if (!application_id || !job_id) {
      return res.status(400).json({ error: 'Application ID and Job ID are required' });
    }
    
    // Get application
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(application_id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Get job
    const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND employer_id = ?')
      .get(job_id, req.session.userId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Get resume if exists
    const resume = db.prepare('SELECT * FROM resumes WHERE application_id = ?').get(application_id);
    
    let resumeData = {};
    if (resume && resume.parsed_data) {
      resumeData = JSON.parse(resume.parsed_data);
    } else {
      // Fallback: use application data
      resumeData = {
        raw_text: JSON.stringify(JSON.parse(application.candidate_data || '{}')),
        contact: {
          email: application.candidate_email,
          phone: null
        },
        experience: [],
        education: [],
        skills: [],
        summary: ''
      };
    }
    
    // Extract required skills from job description
    const requiredSkills = atsService.extractKeywords(job.description || '');
    
    // Perform ATS analysis
    const analysis = await atsService.analyzeApplication(
      resumeData,
      job.description || '',
      requiredSkills
    );
    
    // Save analysis to database
    const analysisId = uuidv4();
    db.prepare(`
      INSERT INTO ats_analyses (
        id, application_id, job_id, overall_score, keyword_score, 
        skills_score, experience_score, format_score,
        matched_keywords, missing_keywords, skill_gaps, recommendations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      analysisId,
      application_id,
      job_id,
      analysis.overall_score,
      analysis.keyword_score,
      analysis.skills_score,
      analysis.experience_score,
      analysis.format_score,
      JSON.stringify(analysis.matched_keywords),
      JSON.stringify(analysis.missing_keywords),
      JSON.stringify(analysis.skill_gaps),
      JSON.stringify(analysis.recommendations)
    );
    
    // Update application with scores
    db.prepare(`
      UPDATE applications 
      SET rank_score = ?, rank_rationale = ?
      WHERE id = ?
    `).run(
      analysis.overall_score,
      `ATS Score: ${analysis.overall_score}/100. Keyword Match: ${analysis.keyword_score}%, Skills Match: ${analysis.skills_score}%`,
      application_id
    );
    
    res.json({
      success: true,
      analysis_id: analysisId,
      analysis: analysis
    });
  } catch (error) {
    console.error('ATS analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze application', details: error.message });
  }
});

// Get ATS analysis by ID
router.get('/analysis/:analysisId', requireRole('employer'), (req, res) => {
  try {
    const analysis = db.prepare(`
      SELECT 
        a.*,
        app.candidate_name,
        app.candidate_email,
        j.title as job_title
      FROM ats_analyses a
      JOIN applications app ON a.application_id = app.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `).get(req.params.analysisId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    // Parse JSON fields
    analysis.matched_keywords = JSON.parse(analysis.matched_keywords || '[]');
    analysis.missing_keywords = JSON.parse(analysis.missing_keywords || '[]');
    analysis.skill_gaps = JSON.parse(analysis.skill_gaps || '[]');
    analysis.recommendations = JSON.parse(analysis.recommendations || '[]');
    
    res.json({ analysis });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Batch analyze all applications for a job
router.post('/batch-analyze/:jobId', requireRole('employer'), async (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    // Verify job belongs to employer
    const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND employer_id = ?')
      .get(jobId, req.session.userId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Get all applications
    const applications = db.prepare('SELECT * FROM applications WHERE job_id = ?').all(jobId);
    
    if (applications.length === 0) {
      return res.json({ success: true, message: 'No applications to analyze', analyzed: 0 });
    }
    
    const results = [];
    const requiredSkills = atsService.extractKeywords(job.description || '');
    
    // Analyze each application
    for (const application of applications) {
      try {
        // Get resume if exists
        const resume = db.prepare('SELECT * FROM resumes WHERE application_id = ?').get(application.id);
        
        let resumeData = {};
        if (resume && resume.parsed_data) {
          resumeData = JSON.parse(resume.parsed_data);
        } else {
          resumeData = {
            raw_text: JSON.stringify(JSON.parse(application.candidate_data || '{}')),
            contact: { email: application.candidate_email, phone: null },
            experience: [],
            education: [],
            skills: [],
            summary: ''
          };
        }
        
        // Perform ATS analysis
        const analysis = await atsService.analyzeApplication(
          resumeData,
          job.description || '',
          requiredSkills
        );
        
        // Save analysis
        const analysisId = uuidv4();
        db.prepare(`
          INSERT INTO ats_analyses (
            id, application_id, job_id, overall_score, keyword_score,
            skills_score, experience_score, format_score,
            matched_keywords, missing_keywords, skill_gaps, recommendations
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          analysisId,
          application.id,
          jobId,
          analysis.overall_score,
          analysis.keyword_score,
          analysis.skills_score,
          analysis.experience_score,
          analysis.format_score,
          JSON.stringify(analysis.matched_keywords),
          JSON.stringify(analysis.missing_keywords),
          JSON.stringify(analysis.skill_gaps),
          JSON.stringify(analysis.recommendations)
        );
        
        // Update application ranking
        db.prepare(`
          UPDATE applications
          SET rank_score = ?, rank_rationale = ?
          WHERE id = ?
        `).run(
          analysis.overall_score,
          `ATS Score: ${analysis.overall_score}/100`,
          application.id
        );
        
        results.push({
          application_id: application.id,
          candidate_name: application.candidate_name,
          score: analysis.overall_score,
          analysis_id: analysisId
        });
      } catch (error) {
        console.error(`Error analyzing application ${application.id}:`, error);
        results.push({
          application_id: application.id,
          candidate_name: application.candidate_name,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      analyzed: results.length,
      results: results
    });
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({ error: 'Failed to batch analyze applications' });
  }
});

// Compare multiple candidates
router.post('/compare', requireRole('employer'), async (req, res) => {
  try {
    const { analysis_ids } = req.body;
    
    if (!analysis_ids || !Array.isArray(analysis_ids)) {
      return res.status(400).json({ error: 'analysis_ids array is required' });
    }
    
    const analyses = [];
    for (const id of analysis_ids) {
      const analysis = db.prepare(`
        SELECT a.*, app.candidate_name
        FROM ats_analyses a
        JOIN applications app ON a.application_id = app.id
        WHERE a.id = ?
      `).get(id);
      
      if (analysis) {
        analysis.matched_keywords = JSON.parse(analysis.matched_keywords || '[]');
        analysis.missing_keywords = JSON.parse(analysis.missing_keywords || '[]');
        analysis.skill_gaps = JSON.parse(analysis.skill_gaps || '[]');
        analysis.recommendations = JSON.parse(analysis.recommendations || '[]');
        analyses.push(analysis);
      }
    }
    
    const comparison = atsService.compareCandidates(analyses);
    
    res.json({
      success: true,
      comparison: comparison
    });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: 'Failed to compare candidates' });
  }
});

module.exports = router;

