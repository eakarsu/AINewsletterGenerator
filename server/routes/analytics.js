const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/analytics
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT a.*, c.name as campaign_name FROM analytics a LEFT JOIN campaigns c ON a.campaign_id = c.id WHERE a.user_id = $1 ORDER BY a.created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM analytics WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/analytics
router.post('/', auth, async (req, res) => {
  try {
    const { campaign_id, sent_count, open_count, click_count, bounce_count, unsubscribe_count } = req.body;
    const result = await pool.query(
      'INSERT INTO analytics (user_id, campaign_id, sent_count, open_count, click_count, bounce_count, unsubscribe_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, campaign_id || null, sent_count || 0, open_count || 0, click_count || 0, bounce_count || 0, unsubscribe_count || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/analytics/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { campaign_id, sent_count, open_count, click_count, bounce_count, unsubscribe_count } = req.body;
    const result = await pool.query(
      'UPDATE analytics SET campaign_id = COALESCE($1, campaign_id), sent_count = COALESCE($2, sent_count), open_count = COALESCE($3, open_count), click_count = COALESCE($4, click_count), bounce_count = COALESCE($5, bounce_count), unsubscribe_count = COALESCE($6, unsubscribe_count), updated_at = NOW() WHERE id = $7 AND user_id = $8 RETURNING *',
      [campaign_id, sent_count, open_count, click_count, bounce_count, unsubscribe_count, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/analytics/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM analytics WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analytics record not found' });
    }
    res.json({ message: 'Analytics record deleted', analytics: result.rows[0] });
  } catch (err) {
    console.error('Delete analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
