const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth, requireRole } = require('../middleware/auth');

// Search candidates (recruiters only)
router.get('/search', requireRole('recruiter'), (req, res) => {
  const { 
    skills, 
    location, 
    experience_min, 
    experience_max,
    available,
    query,
    limit = 50,
    offset = 0
  } = req.query;
  
  try {
    let sql = 'SELECT * FROM candidate_profiles WHERE 1=1';
    const params = [];
    
    // Filter by skills (simple text search in JSON)
    if (skills) {
      sql += ' AND skills LIKE ?';
      params.push(`%${skills}%`);
    }
    
    // Filter by location
    if (location) {
      sql += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    
    // Filter by experience
    if (experience_min) {
      sql += ' AND experience_years >= ?';
      params.push(parseInt(experience_min));
    }
    if (experience_max) {
      sql += ' AND experience_years <= ?';
      params.push(parseInt(experience_max));
    }
    
    // Filter by availability
    if (available !== undefined) {
      sql += ' AND available = ?';
      params.push(available === 'true' ? 1 : 0);
    }
    
    // Search by name or bio
    if (query) {
      sql += ' AND (name LIKE ? OR bio LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const candidates = db.prepare(sql).all(...params);
    
    // Parse JSON fields
    const parsedCandidates = candidates.map(candidate => ({
      ...candidate,
      skills: candidate.skills ? JSON.parse(candidate.skills) : [],
      education: candidate.education ? JSON.parse(candidate.education) : [],
      work_history: candidate.work_history ? JSON.parse(candidate.work_history) : []
    }));
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM candidate_profiles WHERE 1=1';
    const countParams = params.slice(0, -2); // Remove limit and offset
    
    if (skills) countSql += ' AND skills LIKE ?';
    if (location) countSql += ' AND location LIKE ?';
    if (experience_min) countSql += ' AND experience_years >= ?';
    if (experience_max) countSql += ' AND experience_years <= ?';
    if (available !== undefined) countSql += ' AND available = ?';
    if (query) countSql += ' AND (name LIKE ? OR bio LIKE ?)';
    
    const { total } = db.prepare(countSql).get(...countParams);
    
    res.json({ 
      candidates: parsedCandidates,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Search candidates error:', error);
    res.status(500).json({ error: 'Failed to search candidates' });
  }
});

// Get single candidate profile
router.get('/:id', requireAuth, (req, res) => {
  try {
    const candidate = db.prepare(`
      SELECT * FROM candidate_profiles WHERE id = ?
    `).get(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    // Parse JSON fields
    candidate.skills = candidate.skills ? JSON.parse(candidate.skills) : [];
    candidate.education = candidate.education ? JSON.parse(candidate.education) : [];
    candidate.work_history = candidate.work_history ? JSON.parse(candidate.work_history) : [];
    
    res.json({ candidate });
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// Bookmark candidate (recruiters only)
router.post('/:id/bookmark', requireRole('recruiter'), (req, res) => {
  const { notes } = req.body;
  
  try {
    const candidate = db.prepare(`
      SELECT id FROM candidate_profiles WHERE id = ?
    `).get(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const bookmarkId = require('uuid').v4();
    
    db.prepare(`
      INSERT INTO bookmarks (id, recruiter_id, candidate_id, notes)
      VALUES (?, ?, ?, ?)
    `).run(bookmarkId, req.session.userId, req.params.id, notes || null);
    
    res.status(201).json({ 
      success: true,
      message: 'Candidate bookmarked successfully'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Candidate already bookmarked' });
    }
    console.error('Bookmark candidate error:', error);
    res.status(500).json({ error: 'Failed to bookmark candidate' });
  }
});

// Remove bookmark
router.delete('/:id/bookmark', requireRole('recruiter'), (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM bookmarks 
      WHERE recruiter_id = ? AND candidate_id = ?
    `).run(req.session.userId, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

// Get bookmarked candidates
router.get('/bookmarks/list', requireRole('recruiter'), (req, res) => {
  try {
    const bookmarks = db.prepare(`
      SELECT 
        b.id as bookmark_id,
        b.notes,
        b.created_at as bookmarked_at,
        c.*
      FROM bookmarks b
      JOIN candidate_profiles c ON b.candidate_id = c.id
      WHERE b.recruiter_id = ?
      ORDER BY b.created_at DESC
    `).all(req.session.userId);
    
    // Parse JSON fields
    const parsedBookmarks = bookmarks.map(bookmark => ({
      ...bookmark,
      skills: bookmark.skills ? JSON.parse(bookmark.skills) : [],
      education: bookmark.education ? JSON.parse(bookmark.education) : [],
      work_history: bookmark.work_history ? JSON.parse(bookmark.work_history) : []
    }));
    
    res.json({ bookmarks: parsedBookmarks });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

module.exports = router;

