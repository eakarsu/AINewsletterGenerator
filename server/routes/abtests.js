const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/abtests?page=1&limit=20
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM abtests WHERE user_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM abtests WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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

// POST /api/abtests/:id/pick-winner — compare variants by open/click rate from analytics
router.post('/:id/pick-winner', auth, async (req, res) => {
  try {
    const abtestResult = await pool.query(
      'SELECT * FROM abtests WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (abtestResult.rows.length === 0) {
      return res.status(404).json({ error: 'A/B test not found' });
    }
    const abtest = abtestResult.rows[0];

    // Fetch analytics for both variants' campaign_ids if available
    // Strategy: compare open_rate and click_rate for campaign linked to this test
    // If campaign_id is present, pull analytics for that campaign
    // We compare by looking at analytics events for the two subject lines stored as variant_a / variant_b
    // Simpler robust approach: pull all analytics for campaigns owned by user and for the linked campaign
    let aScore = 0;
    let bScore = 0;
    let reason = 'No analytics data found; defaulting to variant A';

    if (abtest.campaign_id) {
      const analyticsResult = await pool.query(
        'SELECT open_count, click_count, sent_count FROM analytics WHERE campaign_id = $1 AND user_id = $2',
        [abtest.campaign_id, req.user.id]
      );

      if (analyticsResult.rows.length >= 2) {
        const rowA = analyticsResult.rows[0];
        const rowB = analyticsResult.rows[1];
        const openRateA = rowA.sent_count > 0 ? rowA.open_count / rowA.sent_count : 0;
        const openRateB = rowB.sent_count > 0 ? rowB.open_count / rowB.sent_count : 0;
        const clickRateA = rowA.sent_count > 0 ? rowA.click_count / rowA.sent_count : 0;
        const clickRateB = rowB.sent_count > 0 ? rowB.click_count / rowB.sent_count : 0;

        // Weight open rate 60%, click rate 40%
        aScore = openRateA * 0.6 + clickRateA * 0.4;
        bScore = openRateB * 0.6 + clickRateB * 0.4;
        reason = `Variant A score: ${(aScore * 100).toFixed(2)}% | Variant B score: ${(bScore * 100).toFixed(2)}%`;
      } else if (analyticsResult.rows.length === 1) {
        // Only one analytics row — use open_count as proxy
        const row = analyticsResult.rows[0];
        aScore = row.open_count || 0;
        bScore = 0;
        reason = 'Only one analytics row found; comparing against zero baseline';
      }
    }

    const winner = aScore >= bScore ? 'A' : 'B';

    const updated = await pool.query(
      `UPDATE abtests SET winner = $1, status = 'completed', updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
      [winner, req.params.id, req.user.id]
    );

    res.json({
      winner,
      reason,
      scores: { A: aScore, B: bScore },
      abtest: updated.rows[0],
    });
  } catch (err) {
    console.error('Pick winner error:', err);
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
