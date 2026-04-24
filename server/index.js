const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
