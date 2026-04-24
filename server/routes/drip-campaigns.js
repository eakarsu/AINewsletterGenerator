const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/drip-campaigns
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM drip_campaigns WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List drip campaigns error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/drip-campaigns/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM drip_campaigns WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Drip campaign not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get drip campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/drip-campaigns
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, trigger_event, delay_days, steps, status } = req.body;
    const result = await pool.query(
      'INSERT INTO drip_campaigns (user_id, name, description, trigger_event, delay_days, steps, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, name, description || '', trigger_event || 'signup', delay_days || 1, steps || '[]', status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create drip campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/drip-campaigns/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, trigger_event, delay_days, steps, status } = req.body;
    const result = await pool.query(
      'UPDATE drip_campaigns SET name = COALESCE($1, name), description = COALESCE($2, description), trigger_event = COALESCE($3, trigger_event), delay_days = COALESCE($4, delay_days), steps = COALESCE($5, steps), status = COALESCE($6, status), updated_at = NOW() WHERE id = $7 AND user_id = $8 RETURNING *',
      [name, description, trigger_event, delay_days, steps, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Drip campaign not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update drip campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/drip-campaigns/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM drip_campaigns WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Drip campaign not found' });
    }
    res.json({ message: 'Drip campaign deleted', drip_campaign: result.rows[0] });
  } catch (err) {
    console.error('Delete drip campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
