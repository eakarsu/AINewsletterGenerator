const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/abtests
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM abtests WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List abtests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/abtests/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM abtests WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'A/B test not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get abtest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/abtests
router.post('/', auth, async (req, res) => {
  try {
    const { name, campaign_id, variant_a, variant_b, metric, status, winner } = req.body;
    const result = await pool.query(
      'INSERT INTO abtests (user_id, name, campaign_id, variant_a, variant_b, metric, status, winner) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, name, campaign_id || null, variant_a || '', variant_b || '', metric || 'open_rate', status || 'draft', winner || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create abtest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/abtests/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, campaign_id, variant_a, variant_b, metric, status, winner } = req.body;
    const result = await pool.query(
      'UPDATE abtests SET name = COALESCE($1, name), campaign_id = COALESCE($2, campaign_id), variant_a = COALESCE($3, variant_a), variant_b = COALESCE($4, variant_b), metric = COALESCE($5, metric), status = COALESCE($6, status), winner = COALESCE($7, winner), updated_at = NOW() WHERE id = $8 AND user_id = $9 RETURNING *',
      [name, campaign_id, variant_a, variant_b, metric, status, winner, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'A/B test not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update abtest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/abtests/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM abtests WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'A/B test not found' });
    }
    res.json({ message: 'A/B test deleted', abtest: result.rows[0] });
  } catch (err) {
    console.error('Delete abtest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
