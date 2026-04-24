const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/templates
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM templates WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List templates error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/templates/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM templates WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get template error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/templates
router.post('/', auth, async (req, res) => {
  try {
    const { name, subject, html_content, category } = req.body;
    const result = await pool.query(
      'INSERT INTO templates (user_id, name, subject, html_content, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, name, subject || '', html_content || '', category || 'general']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create template error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/templates/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, subject, html_content, category } = req.body;
    const result = await pool.query(
      'UPDATE templates SET name = COALESCE($1, name), subject = COALESCE($2, subject), html_content = COALESCE($3, html_content), category = COALESCE($4, category), updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING *',
      [name, subject, html_content, category, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update template error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ message: 'Template deleted', template: result.rows[0] });
  } catch (err) {
    console.error('Delete template error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
