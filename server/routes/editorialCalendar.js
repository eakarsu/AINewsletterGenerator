const express = require('express');

const router = express.Router();

router.post('/plan', (req, res) => {
  const {
    audience = 'B2B operators',
    cadence = 'weekly',
    themes = ['industry trend', 'customer story', 'product tip'],
    nextSendDate = new Date().toISOString(),
  } = req.body || {};
  const start = new Date(nextSendDate);
  const gapDays = cadence === 'daily' ? 1 : cadence === 'monthly' ? 30 : 7;
  const issues = themes.map((theme, index) => {
    const sendAt = new Date(start.getTime() + index * gapDays * 86400000);
    return {
      sendAt: sendAt.toISOString().slice(0, 10),
      subject: `${theme}: what ${audience} should watch`,
      segment: index % 2 === 0 ? 'engaged subscribers' : 're-activation segment',
      cta: index % 2 === 0 ? 'Read the full guide' : 'Update preferences',
    };
  });
  res.json({
    audience,
    cadence,
    issues,
    productionChecklist: ['Lock source links 3 days before send.', 'QA personalization tokens.', 'Review unsubscribe and preference-center links.'],
  });
});

module.exports = router;
