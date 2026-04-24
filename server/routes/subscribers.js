const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/subscribers
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscribers WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List subscribers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/subscribers/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscribers WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get subscriber error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/subscribers
router.post('/', auth, async (req, res) => {
  try {
    const { email, name, status, segment_id } = req.body;
    const result = await pool.query(
      'INSERT INTO subscribers (user_id, email, name, status, segment_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, email, name || '', status || 'active', segment_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create subscriber error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/subscribers/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { email, name, status, segment_id } = req.body;
    const result = await pool.query(
      'UPDATE subscribers SET email = COALESCE($1, email), name = COALESCE($2, name), status = COALESCE($3, status), segment_id = COALESCE($4, segment_id), updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING *',
      [email, name, status, segment_id, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update subscriber error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/subscribers/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM subscribers WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    res.json({ message: 'Subscriber deleted', subscriber: result.rows[0] });
  } catch (err) {
    console.error('Delete subscriber error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
