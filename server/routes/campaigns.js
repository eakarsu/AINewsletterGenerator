const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/campaigns
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List campaigns error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/campaigns/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/campaigns
router.post('/', auth, async (req, res) => {
  try {
    const { name, newsletter_id, segment_id, status, scheduled_at } = req.body;
    const result = await pool.query(
      'INSERT INTO campaigns (user_id, name, newsletter_id, segment_id, status, scheduled_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, name, newsletter_id || null, segment_id || null, status || 'draft', scheduled_at || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/campaigns/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, newsletter_id, segment_id, status, scheduled_at } = req.body;
    const result = await pool.query(
      'UPDATE campaigns SET name = COALESCE($1, name), newsletter_id = COALESCE($2, newsletter_id), segment_id = COALESCE($3, segment_id), status = COALESCE($4, status), scheduled_at = COALESCE($5, scheduled_at), updated_at = NOW() WHERE id = $6 AND user_id = $7 RETURNING *',
      [name, newsletter_id, segment_id, status, scheduled_at, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/campaigns/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM campaigns WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted', campaign: result.rows[0] });
  } catch (err) {
    console.error('Delete campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
