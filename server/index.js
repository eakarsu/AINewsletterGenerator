const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = require('./db');
const {validateRuntime}=require('./governance/runtime');
const {createProviderGate}=require('./governance/providerGate');
const governanceRouter=require('./governance/router');
validateRuntime();
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
const allowedOrigins=String(process.env.CORS_ORIGINS||process.env.CLIENT_URL||'http://localhost:3000').split(',').map(v=>v.trim()).filter(Boolean);
app.use(cors({origin:(origin,cb)=>!origin||allowedOrigins.includes(origin)?cb(null,true):cb(new Error('Origin not allowed by CORS')),credentials:true}));
app.use(express.json({ limit: '10mb' }));
app.use(createProviderGate(['/api/ai','/api/gap','/api/newsletter-agent','/api/content-personalization','/api/send-time-optimize']));

// Tracking: open pixel
// GET /t/open/:trackingId.gif
app.get('/t/open/:trackingId.gif', async (req, res) => {
  const { trackingId } = req.params;
  try {
    // Increment open_count on analytics row where campaign_id matches trackingId
    await pool.query(
      'UPDATE analytics SET open_count = open_count + 1, updated_at = NOW() WHERE campaign_id = $1',
      [trackingId]
    );
  } catch (err) {
    // silently ignore tracking errors
  }
  // 1x1 transparent GIF
  const gif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.end(gif);
});

// Tracking: click redirect
// GET /t/click/:linkId?url=https://...
app.get('/t/click/:linkId', async (req, res) => {
  const { linkId } = req.params;
  const targetUrl = req.query.url;
  try {
    await pool.query(
      'UPDATE analytics SET click_count = click_count + 1, updated_at = NOW() WHERE campaign_id = $1',
      [linkId]
    );
  } catch (err) {
    // silently ignore tracking errors
  }
  if (targetUrl) {
    return res.redirect(decodeURIComponent(targetUrl));
  }
  res.status(400).json({ error: 'No redirect URL provided' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/newsletters', require('./routes/newsletters'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/segments', require('./routes/segments'));
app.use('/api/abtests', require('./routes/abtests'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/themes', require('./routes/themes'));
app.use('/api/drip-campaigns', require('./routes/drip-campaigns'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/editorial-calendar', require('./routes/editorialCalendar'));
app.use('/api/governed-newsletter-releases',governanceRouter);

// Convenience unsubscribe route at /api/unsubscribe/:token (same handler as in subscribers router)
app.get('/api/unsubscribe/:token', async (req, res) => {
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/campaign-orchestrator-agent', require('./routes/campaign-orchestrator-agent'));
app.use('/api/subscriber-intel-stream', require('./routes/subscriber-intel-stream'));
app.use('/api/segment-batch-test', require('./routes/segment-batch-test'));
app.use('/api/integration-ecosystem', require('./routes/integration-ecosystem'));
app.use('/api/subscriber-community', require('./routes/subscriber-community'));

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_segment_optimize = require('./routes/gap-segment-optimize'); app.use('/api/gap-segment-optimize', _gap_segment_optimize); } catch(e) { console.error('gap mount fail segment-optimize:', e.message); }
try { const _gap_send_time_optimize = require('./routes/gap-send-time-optimize'); app.use('/api/gap-send-time-optimize', _gap_send_time_optimize); } catch(e) { console.error('gap mount fail send-time-optimize:', e.message); }
try { const _gap_subscriber_prediction = require('./routes/gap-subscriber-prediction'); app.use('/api/gap-subscriber-prediction', _gap_subscriber_prediction); } catch(e) { console.error('gap mount fail subscriber-prediction:', e.message); }
try { const _gap_churn_detection = require('./routes/gap-churn-detection'); app.use('/api/gap-churn-detection', _gap_churn_detection); } catch(e) { console.error('gap mount fail churn-detection:', e.message); }
try { const _gap_preference = require('./routes/gap-preference'); app.use('/api/gap-preference', _gap_preference); } catch(e) { console.error('gap mount fail preference:', e.message); }
try { const _gap_compliance = require('./routes/gap-compliance'); app.use('/api/gap-compliance', _gap_compliance); } catch(e) { console.error('gap mount fail compliance:', e.message); }
try { const _gap_list = require('./routes/gap-list'); app.use('/api/gap-list', _gap_list); } catch(e) { console.error('gap mount fail list:', e.message); }
try { const _gap_dynamic = require('./routes/gap-dynamic'); app.use('/api/gap-dynamic', _gap_dynamic); } catch(e) { console.error('gap mount fail dynamic:', e.message); }
try { const _gap_native = require('./routes/gap-native'); app.use('/api/gap-native', _gap_native); } catch(e) { console.error('gap mount fail native:', e.message); }
try { const _gap_real_time = require('./routes/gap-real-time'); app.use('/api/gap-real-time', _gap_real_time); } catch(e) { console.error('gap mount fail real-time:', e.message); }
try { const _gap_unsubscribe = require('./routes/gap-unsubscribe'); app.use('/api/gap-unsubscribe', _gap_unsubscribe); } catch(e) { console.error('gap mount fail unsubscribe:', e.message); }
try { const _gap_public = require('./routes/gap-public'); app.use('/api/gap-public', _gap_public); } catch(e) { console.error('gap mount fail public:', e.message); }
// === End Batch 05 Mounts ===
