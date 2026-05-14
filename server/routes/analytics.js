const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/analytics?page=1&limit=20
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM analytics WHERE user_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT a.*, c.name as campaign_name FROM analytics a LEFT JOIN campaigns c ON a.campaign_id = c.id WHERE a.user_id = $1 ORDER BY a.created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         SUM(sent_count) AS total_sent,
         SUM(open_count) AS total_opens,
         SUM(click_count) AS total_clicks,
         SUM(bounce_count) AS total_bounces,
         SUM(unsubscribe_count) AS total_unsubs,
         CASE WHEN SUM(sent_count) > 0 THEN ROUND((SUM(open_count)::numeric / SUM(sent_count)) * 100, 2) ELSE 0 END AS open_rate,
         CASE WHEN SUM(sent_count) > 0 THEN ROUND((SUM(click_count)::numeric / SUM(sent_count)) * 100, 2) ELSE 0 END AS click_rate,
         CASE WHEN SUM(sent_count) > 0 THEN ROUND((SUM(bounce_count)::numeric / SUM(sent_count)) * 100, 2) ELSE 0 END AS bounce_rate
       FROM analytics
       WHERE user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Analytics summary error:', err);
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

// POST /api/analytics — track an event
router.post('/', auth, async (req, res) => {
  try {
    const { campaign_id, sent_count, open_count, click_count, bounce_count, unsubscribe_count, type, subscriber_id, metadata } = req.body;
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
