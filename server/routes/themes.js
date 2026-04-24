const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/themes
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM themes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List themes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/themes/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM themes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get theme error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/themes
router.post('/', auth, async (req, res) => {
  try {
    const { name, primary_color, secondary_color, font_family, header_style, footer_style } = req.body;
    const result = await pool.query(
      'INSERT INTO themes (user_id, name, primary_color, secondary_color, font_family, header_style, footer_style) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, name, primary_color || '#3B82F6', secondary_color || '#1E40AF', font_family || 'Inter, sans-serif', header_style || '{}', footer_style || '{}']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create theme error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/themes/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, primary_color, secondary_color, font_family, header_style, footer_style } = req.body;
    const result = await pool.query(
      'UPDATE themes SET name = COALESCE($1, name), primary_color = COALESCE($2, primary_color), secondary_color = COALESCE($3, secondary_color), font_family = COALESCE($4, font_family), header_style = COALESCE($5, header_style), footer_style = COALESCE($6, footer_style), updated_at = NOW() WHERE id = $7 AND user_id = $8 RETURNING *',
      [name, primary_color, secondary_color, font_family, header_style, footer_style, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update theme error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/themes/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM themes WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Theme not found' });
    }
    res.json({ message: 'Theme deleted', theme: result.rows[0] });
  } catch (err) {
    console.error('Delete theme error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
