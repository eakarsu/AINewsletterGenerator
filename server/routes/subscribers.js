const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../db');
const auth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Simple CSV parser (handles quoted fields)
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

// GET /api/subscribers?page=1&limit=20
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM subscribers WHERE user_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM subscribers WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('List subscribers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/unsubscribe/:token — public, no auth required
router.get('/unsubscribe/:token', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE subscribers SET status = 'unsubscribed', updated_at = NOW() WHERE unsubscribe_token = $1 RETURNING *",
      [req.params.token]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('<html><body><h2>Invalid unsubscribe link.</h2></body></html>');
    }
    res.send(`
      <html>
        <head><title>Unsubscribed</title><style>body{font-family:sans-serif;text-align:center;padding:60px;}</style></head>
        <body>
          <h2>You have been unsubscribed.</h2>
          <p>You will no longer receive emails from us.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).send('<html><body><h2>Server error. Please try again later.</h2></body></html>');
  }
});

// POST /api/subscribers/import-csv — multipart CSV upload
router.post('/import-csv', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const csvText = req.file.buffer.toString('utf-8');
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has no data rows' });
    }

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      const email = row.email || row['e-mail'] || row['email address'] || '';
      const name = row.name || row['full name'] || row['first name'] || '';

      if (!email || !email.includes('@')) {
        skipped++;
        continue;
      }

      const result = await pool.query(
        'INSERT INTO subscribers (user_id, email, name, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id',
        [req.user.id, email.toLowerCase(), name, 'active']
      );

      if (result.rows.length > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }

    res.json({ message: 'Import complete', inserted, skipped, total: rows.length });
  } catch (err) {
    console.error('CSV import error:', err);
    res.status(500).json({ error: 'Server error during import' });
  }
});

// GET /api/subscribers/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscribers WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get subscriber error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/subscribers
router.post('/', auth, async (req, res) => {
  try {
    const { email, name, status, segment_id } = req.body;
    const result = await pool.query(
      'INSERT INTO subscribers (user_id, email, name, status, segment_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, email, name || '', status || 'active', segment_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create subscriber error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/subscribers/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { email, name, status, segment_id } = req.body;
    const result = await pool.query(
      'UPDATE subscribers SET email = COALESCE($1, email), name = COALESCE($2, name), status = COALESCE($3, status), segment_id = COALESCE($4, segment_id), updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING *',
      [email, name, status, segment_id, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update subscriber error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/subscribers/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM subscribers WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    res.json({ message: 'Subscriber deleted', subscriber: result.rows[0] });
  } catch (err) {
    console.error('Delete subscriber error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
