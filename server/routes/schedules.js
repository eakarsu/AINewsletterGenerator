const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/schedules
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM schedules WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List schedules error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/schedules/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM schedules WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/schedules
router.post('/', auth, async (req, res) => {
  try {
    const { campaign_id, send_at, timezone, recurrence, status } = req.body;
    const result = await pool.query(
      'INSERT INTO schedules (user_id, campaign_id, send_at, timezone, recurrence, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, campaign_id || null, send_at, timezone || 'UTC', recurrence || 'once', status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/schedules/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { campaign_id, send_at, timezone, recurrence, status } = req.body;
    const result = await pool.query(
      'UPDATE schedules SET campaign_id = COALESCE($1, campaign_id), send_at = COALESCE($2, send_at), timezone = COALESCE($3, timezone), recurrence = COALESCE($4, recurrence), status = COALESCE($5, status), updated_at = NOW() WHERE id = $6 AND user_id = $7 RETURNING *',
      [campaign_id, send_at, timezone, recurrence, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/schedules/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM schedules WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted', schedule: result.rows[0] });
  } catch (err) {
    console.error('Delete schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
