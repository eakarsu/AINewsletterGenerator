const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  // Key by user ID if authenticated, otherwise fall back to normalized IP
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `user_${req.user.id}`;
    }
    return ipKeyGenerator(req);
  },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many AI requests. Limit is 20 per hour.' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimiter };
