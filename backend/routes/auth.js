const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

// Local login (no OAuth)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.name = user.name;
    req.session.role = user.role;
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      success: true, 
      user: userWithoutPassword,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register new user
router.post('/register', (req, res) => {
  const { email, password, name, role } = req.body;
  
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (!['employer', 'recruiter'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  try {
    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Create user
    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, email, hashedPassword, name, role);
    
    // Create session
    req.session.userId = userId;
    req.session.email = email;
    req.session.name = name;
    req.session.role = role;
    
    res.status(201).json({ 
      success: true,
      user: { id: userId, email, name, role },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const user = db.prepare(`
      SELECT id, email, name, role, avatar, created_at 
      FROM users WHERE id = ?
    `).get(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Update role (for role selection after login)
router.post('/select-role', (req, res) => {
  const { role } = req.body;
  
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (!['employer', 'recruiter'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  try {
    // Update user role
    db.prepare('UPDATE users SET role = ? WHERE id = ?')
      .run(role, req.session.userId);
    
    // Update session
    req.session.role = role;
    
    res.json({ 
      success: true, 
      role,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Role selection error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

module.exports = router;

