const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/newsletters
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM newsletters WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List newsletters error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/newsletters/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM newsletters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get newsletter error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/newsletters
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, subject, status } = req.body;
    const result = await pool.query(
      'INSERT INTO newsletters (user_id, title, content, subject, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, title, content, subject, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create newsletter error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/newsletters/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, subject, status } = req.body;
    const result = await pool.query(
      'UPDATE newsletters SET title = COALESCE($1, title), content = COALESCE($2, content), subject = COALESCE($3, subject), status = COALESCE($4, status), updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING *',
      [title, content, subject, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update newsletter error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/newsletters/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM newsletters WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }
    res.json({ message: 'Newsletter deleted', newsletter: result.rows[0] });
  } catch (err) {
    console.error('Delete newsletter error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
