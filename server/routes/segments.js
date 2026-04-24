const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/segments
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM segments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List segments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/segments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM segments WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get segment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/segments
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, criteria } = req.body;
    const result = await pool.query(
      'INSERT INTO segments (user_id, name, description, criteria) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, description || '', criteria || '{}']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create segment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/segments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, criteria } = req.body;
    const result = await pool.query(
      'UPDATE segments SET name = COALESCE($1, name), description = COALESCE($2, description), criteria = COALESCE($3, criteria), updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, description, criteria, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update segment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/segments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM segments WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json({ message: 'Segment deleted', segment: result.rows[0] });
  } catch (err) {
    console.error('Delete segment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
