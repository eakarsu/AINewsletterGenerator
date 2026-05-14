const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const pool = require('../db');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Create ai_results table on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint VARCHAR(100),
    input_data JSONB,
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch((err) => console.error('Failed to create ai_results table:', err));

function parseAIJson(text) {
  try { return JSON.parse(text); } catch (e) {}
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(stripped); } catch (e) {}
  const s = text.indexOf('{'); const e2 = text.lastIndexOf('}');
  if (s !== -1 && e2 !== -1) { try { return JSON.parse(text.slice(s, e2 + 1)); } catch (e) {} }
  return null;
}

async function callOpenRouter(messages) {
  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
        'X-Title': 'AI Newsletter Generator',
      },
    }
  );

  return response.data.choices[0].message.content;
}

async function persistResult(userId, endpoint, inputData, result) {
  try {
    await pool.query(
      'INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)',
      [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result)]
    );
  } catch (err) {
    console.error('Failed to persist AI result:', err);
  }
}

// GET /api/ai/history — paginated AI generation history
router.get('/history', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM ai_results WHERE user_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM ai_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
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
    console.error('AI history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/ai/generate-content
router.post('/generate-content', auth, aiRateLimiter, async (req, res) => {
  try {
    const { topic, tone, length, audience } = req.body;
    const content = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an expert newsletter content writer. Generate engaging, well-structured newsletter content in HTML format suitable for email.',
      },
      {
        role: 'user',
        content: `Write a newsletter about "${topic}". Tone: ${tone || 'professional'}. Length: ${length || 'medium'}. Target audience: ${audience || 'general'}. Return the content in clean HTML format with headings, paragraphs, and bullet points where appropriate.`,
      },
    ]);
    await persistResult(req.user.id, 'generate-content', { topic, tone, length, audience }, { content });
    res.json({ content });
  } catch (err) {
    console.error('AI generate-content error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// POST /api/ai/generate-subject
router.post('/generate-subject', auth, aiRateLimiter, async (req, res) => {
  try {
    const { content, tone, count } = req.body;
    const result = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an email marketing expert specializing in subject line optimization. Generate compelling subject lines that maximize open rates.',
      },
      {
        role: 'user',
        content: `Generate ${count || 5} email subject lines for the following newsletter content. Tone: ${tone || 'professional'}.\n\nContent:\n${content}\n\nReturn as a JSON array of strings.`,
      },
    ]);
    let subjects = parseAIJson(result);
    if (!Array.isArray(subjects)) {
      subjects = result.split('\n').filter((line) => line.trim().length > 0);
    }
    await persistResult(req.user.id, 'generate-subject', { tone, count }, { subjects });
    res.json({ subjects });
  } catch (err) {
    console.error('AI generate-subject error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate subject lines' });
  }
});

// POST /api/ai/adjust-tone
router.post('/adjust-tone', auth, aiRateLimiter, async (req, res) => {
  try {
    const { content, target_tone } = req.body;
    const result = await callOpenRouter([
      {
        role: 'system',
        content: 'You are a content editor who excels at adjusting the tone of written content while preserving the original meaning and structure.',
      },
      {
        role: 'user',
        content: `Rewrite the following content in a ${target_tone || 'professional'} tone. Keep the same structure and key information.\n\nContent:\n${content}`,
      },
    ]);
    await persistResult(req.user.id, 'adjust-tone', { target_tone }, { content: result });
    res.json({ content: result });
  } catch (err) {
    console.error('AI adjust-tone error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to adjust tone' });
  }
});

// POST /api/ai/suggest-images
router.post('/suggest-images', auth, aiRateLimiter, async (req, res) => {
  try {
    const { content, count } = req.body;
    const result = await callOpenRouter([
      {
        role: 'system',
        content: 'You are a visual content strategist. Suggest relevant stock photo descriptions and search terms for newsletter imagery.',
      },
      {
        role: 'user',
        content: `Suggest ${count || 5} image ideas for the following newsletter content. For each suggestion, provide: a description, recommended search terms for stock photo sites, and placement recommendation.\n\nContent:\n${content}\n\nReturn as a JSON array of objects with fields: description, search_terms, placement.`,
      },
    ]);
    let suggestions = parseAIJson(result);
    if (!Array.isArray(suggestions)) {
      suggestions = [{ description: result, search_terms: '', placement: 'header' }];
    }
    await persistResult(req.user.id, 'suggest-images', { count }, { suggestions });
    res.json({ suggestions });
  } catch (err) {
    console.error('AI suggest-images error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to suggest images' });
  }
});

// POST /api/ai/summarize
router.post('/summarize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { content, max_length } = req.body;
    const result = await callOpenRouter([
      {
        role: 'system',
        content: 'You are a concise content summarizer. Create clear, engaging summaries that capture the key points.',
      },
      {
        role: 'user',
        content: `Summarize the following content in ${max_length || 100} words or fewer. Make it engaging and suitable for a newsletter preview.\n\nContent:\n${content}`,
      },
    ]);
    await persistResult(req.user.id, 'summarize', { max_length }, { summary: result });
    res.json({ summary: result });
  } catch (err) {
    console.error('AI summarize error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to summarize content' });
  }
});

// POST /api/ai/improve
router.post('/improve', auth, aiRateLimiter, async (req, res) => {
  try {
    const { content, focus } = req.body;
    const result = await callOpenRouter([
      {
        role: 'system',
        content: 'You are a senior content editor specializing in email marketing. Improve content for better engagement, clarity, and conversion.',
      },
      {
        role: 'user',
        content: `Improve the following newsletter content. Focus area: ${focus || 'overall quality, readability, and engagement'}.\n\nContent:\n${content}\n\nReturn the improved content along with a brief list of changes made.`,
      },
    ]);
    await persistResult(req.user.id, 'improve', { focus }, { improved_content: result });
    res.json({ improved_content: result });
  } catch (err) {
    console.error('AI improve error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to improve content' });
  }
});

// POST /api/ai/segment-optimize
router.post('/segment-optimize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { subscribers_summary, goals, current_segments } = req.body || {};
    const result = await callOpenRouter([
      { role: 'system', content: 'You design email subscriber segmentation strategies. Always return JSON only.' },
      { role: 'user', content: `Recommend optimal subscriber segments.\nSubscriber summary: ${JSON.stringify(subscribers_summary || {})}\nGoals: ${JSON.stringify(goals || [])}\nCurrent segments: ${JSON.stringify(current_segments || [])}\n\nReturn JSON only: { "recommended_segments": [{"name": string, "description": string, "criteria": object, "est_size": number, "campaign_ideas": [string]}], "consolidation_suggestions": [string], "rationale": string }` },
    ]);
    const parsed = parseAIJson(result) || { raw: result };
    await persistResult(req.user.id, 'segment-optimize', { subscribers_summary, goals }, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI segment-optimize error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to optimize segments' });
  }
});

// POST /api/ai/send-time-optimize
router.post('/send-time-optimize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { audience, timezone, prior_engagement, content_type } = req.body || {};
    const result = await callOpenRouter([
      { role: 'system', content: 'You predict optimal email send times. Always return JSON only.' },
      { role: 'user', content: `Predict the best send time and day.\nAudience: ${audience || 'general'}\nPrimary timezone: ${timezone || 'US/Eastern'}\nPrior engagement summary: ${JSON.stringify(prior_engagement || {})}\nContent type: ${content_type || 'newsletter'}\n\nReturn JSON only: { "best_day": string, "best_hour_local": number, "alternative_windows": [{"day": string, "hour": number, "reason": string}], "confidence": "low"|"medium"|"high", "rationale": string }` },
    ]);
    const parsed = parseAIJson(result) || { raw: result };
    await persistResult(req.user.id, 'send-time-optimize', { audience, timezone, content_type }, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI send-time-optimize error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to optimize send time' });
  }
});

// POST /api/ai/churn-detection
router.post('/churn-detection', auth, aiRateLimiter, async (req, res) => {
  try {
    const { subscribers } = req.body || {};
    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(400).json({ error: 'subscribers array required' });
    }
    const result = await callOpenRouter([
      { role: 'system', content: 'You detect at-risk email subscribers and recommend re-engagement actions. Always return JSON only.' },
      { role: 'user', content: `Score subscribers for churn risk.\nSubscribers (sample): ${JSON.stringify(subscribers).slice(0, 6000)}\n\nReturn JSON only: { "at_risk": [{"id": any, "risk": "low"|"medium"|"high", "signals": [string], "recommended_action": string}], "summary": string, "win_back_offers": [string] }` },
    ]);
    const parsed = parseAIJson(result) || { raw: result };
    await persistResult(req.user.id, 'churn-detection', { count: subscribers.length }, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI churn-detection error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to detect churn risk' });
  }
});

// POST /api/ai/subscriber-prediction
router.post('/subscriber-prediction', auth, aiRateLimiter, async (req, res) => {
  try {
    const { subscribers, target_metric, horizon_days } = req.body || {};
    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(400).json({ error: 'subscribers array required' });
    }
    const horizon = horizon_days || 30;
    const metric = target_metric || 'engagement';
    const result = await callOpenRouter([
      { role: 'system', content: 'You predict future newsletter subscriber behaviour and outcomes. Always return JSON only.' },
      { role: 'user', content: `Predict subscriber outcomes over the next ${horizon} days.\nTarget metric: ${metric}\nSubscribers (sample): ${JSON.stringify(subscribers).slice(0, 6000)}\n\nReturn JSON only: { "predictions": [{"id": any, "predicted_metric_score": number, "tier": "low"|"medium"|"high", "expected_actions": [string], "confidence": "low"|"medium"|"high"}], "cohort_summary": { "expected_open_rate": number, "expected_click_rate": number, "expected_unsubscribe_rate": number }, "recommended_focus": [string] }` },
    ]);
    const parsed = parseAIJson(result) || { raw: result };
    await persistResult(req.user.id, 'subscriber-prediction', { count: subscribers.length, target_metric: metric, horizon_days: horizon }, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI subscriber-prediction error:', err.response?.data || err.message);
    if (err.response?.status === 401 || /api[_ ]?key/i.test(err.message || '')) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.' });
    }
    res.status(500).json({ error: 'Failed to predict subscriber outcomes' });
  }
});

// POST /api/ai/list-dedupe
// Deduplicates a subscriber list and groups likely-duplicate accounts.
router.post('/list-dedupe', auth, aiRateLimiter, async (req, res) => {
  try {
    const { subscribers } = req.body || {};
    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return res.status(400).json({ error: 'subscribers array required' });
    }
    const result = await callOpenRouter([
      { role: 'system', content: 'You audit subscriber lists for duplicates, normalization issues, and import hygiene. Always return JSON only.' },
      { role: 'user', content: `Identify duplicate / near-duplicate subscribers and propose a clean list.\nSubscribers (sample): ${JSON.stringify(subscribers).slice(0, 6000)}\n\nReturn JSON only: { "duplicate_groups": [{"canonical_email": string, "ids": [any], "reason": string, "merge_strategy": string}], "normalization_issues": [{"id": any, "field": string, "issue": string, "suggested_value": string}], "summary": { "input_count": number, "estimated_duplicates": number, "estimated_clean_count": number }, "recommended_actions": [string] }` },
    ]);
    const parsed = parseAIJson(result) || { raw: result };
    await persistResult(req.user.id, 'list-dedupe', { count: subscribers.length }, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI list-dedupe error:', err.response?.data || err.message);
    if (err.response?.status === 401 || /api[_ ]?key/i.test(err.message || '')) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.' });
    }
    res.status(500).json({ error: 'Failed to dedupe list' });
  }
});

// ----------------------------------------------------------------------
// Apply pass 5 (backlog) — additive AI endpoints.
// Required env vars: OPENROUTER_API_KEY (returns 503 + missing if absent).
// All endpoints reuse callOpenRouter + parseAIJson + persistResult.
// ----------------------------------------------------------------------

function requireKey(res) {
  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
    return true;
  }
  return false;
}

function handleKeyErr(res, err) {
  if (err.response?.status === 401 || /api[_ ]?key/i.test(err.message || '')) {
    return res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
  }
}

// POST /api/ai/agentic-campaign-orchestrate
// Backlog custom: agentic campaign orchestrator. PRODUCT-DECISION: returns a
// PLAN of newsletter campaign steps for a goal+audience. Plan-only — no
// auto-send.
router.post('/agentic-campaign-orchestrate', auth, aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { goal, audience, brand_voice, time_horizon_days } = req.body || {};
    if (!goal) return res.status(400).json({ error: 'goal is required' });
    const result = await callOpenRouter([
      { role: 'system', content: 'You design multi-step newsletter campaigns. Always return JSON only. Plans must be drafts only — never auto-execute.' },
      { role: 'user', content: `Plan a campaign for the goal.\nGoal: ${goal}\nAudience: ${audience || 'general'}\nBrand voice: ${brand_voice || 'friendly, expert'}\nHorizon (days): ${time_horizon_days || 30}\n\nReturn JSON: { "campaign_name": string, "objective": string, "steps": [{ "day_offset": number, "action": "send"|"segment"|"a_b_test"|"wait"|"branch", "subject_line_draft": string, "audience_segment": string, "cta": string, "success_metric": string }], "expected_outcome": string, "risks": [string] }` },
    ]);
    const parsed = parseAIJson(result) || { raw: result };
    await persistResult(req.user.id, 'agentic-campaign-orchestrate', { goal, time_horizon_days }, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI agentic-campaign-orchestrate error:', err.response?.data || err.message);
    if (handleKeyErr(res, err)) return;
    res.status(500).json({ error: 'Failed to orchestrate campaign' });
  }
});

// POST /api/ai/batch-content-variants
// Backlog custom: batch content variants — generate N variants for the same
// content brief, ready for A/B testing.
router.post('/batch-content-variants', auth, aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { brief, audience, variant_count, tones } = req.body || {};
    if (!brief) return res.status(400).json({ error: 'brief is required' });
    const n = Math.min(Math.max(parseInt(variant_count) || 3, 1), 6);
    const result = await callOpenRouter([
      { role: 'system', content: 'You generate multiple newsletter copy variants suitable for A/B testing. Always return JSON only.' },
      { role: 'user', content: `Generate ${n} variants of this newsletter brief, varying in tone/structure.\nBrief: ${brief}\nAudience: ${audience || 'general'}\nTones: ${JSON.stringify(tones || ['confident', 'curious', 'urgent'])}\n\nReturn JSON: { "variants": [{ "id": string, "tone": string, "subject_line": string, "preview_text": string, "body_html": string, "rationale": string, "predicted_engagement": "low"|"medium"|"high" }] }` },
    ]);
    const parsed = parseAIJson(result) || { raw: result };
    await persistResult(req.user.id, 'batch-content-variants', { brief, variant_count: n }, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI batch-content-variants error:', err.response?.data || err.message);
    if (handleKeyErr(res, err)) return;
    res.status(500).json({ error: 'Failed to generate content variants' });
  }
});

// POST /api/ai/vertical-template
// Backlog: vertical template library. PRODUCT-DECISION: rather than ship
// hardcoded templates, generate a reusable template for the requested
// vertical on demand and return its structure.
router.post('/vertical-template', auth, aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { vertical, tone, sections } = req.body || {};
    if (!vertical) return res.status(400).json({ error: 'vertical is required' });
    const result = await callOpenRouter([
      { role: 'system', content: 'You design newsletter templates for specific verticals. Always return JSON only.' },
      { role: 'user', content: `Design a reusable newsletter template for the vertical.\nVertical: ${vertical}\nTone: ${tone || 'professional'}\nSections requested: ${JSON.stringify(sections || ['hero', 'main_story', 'tips', 'community', 'cta'])}\n\nReturn JSON: { "vertical": string, "template_name": string, "sections": [{ "name": string, "purpose": string, "placeholder_html": string, "guidance": string }], "subject_line_formulas": [string], "kpi_focus": [string] }` },
    ]);
    const parsed = parseAIJson(result) || { raw: result };
    await persistResult(req.user.id, 'vertical-template', { vertical }, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI vertical-template error:', err.response?.data || err.message);
    if (handleKeyErr(res, err)) return;
    res.status(500).json({ error: 'Failed to generate vertical template' });
  }
});

// POST /api/ai/dynamic-content-blocks
// Backlog: dynamic content blocks. PRODUCT-DECISION: implemented as a
// recommendation engine — given subscriber segments, returns block
// suggestions per segment for personalization.
router.post('/dynamic-content-blocks', auth, aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { segments, base_content } = req.body || {};
    if (!Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({ error: 'segments array required' });
    }
    const result = await callOpenRouter([
      { role: 'system', content: 'You design personalized newsletter content blocks per audience segment. Always return JSON only.' },
      { role: 'user', content: `Recommend dynamic content blocks per segment.\nSegments: ${JSON.stringify(segments).slice(0, 4000)}\nBase content: ${base_content || ''}\n\nReturn JSON: { "blocks": [{ "segment": string, "block_id": string, "headline": string, "body_html": string, "cta": string, "rationale": string }], "fallback_block": { "block_id": string, "headline": string, "body_html": string, "cta": string } }` },
    ]);
    const parsed = parseAIJson(result) || { raw: result };
    await persistResult(req.user.id, 'dynamic-content-blocks', { segment_count: segments.length }, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI dynamic-content-blocks error:', err.response?.data || err.message);
    if (handleKeyErr(res, err)) return;
    res.status(500).json({ error: 'Failed to generate content blocks' });
  }
});

// POST /api/ai/realtime-subscriber-intel
// Backlog custom: real-time subscriber intelligence. PRODUCT-DECISION:
// summary report, not a streaming pipeline — caller passes recent activity.
router.post('/realtime-subscriber-intel', auth, aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { recent_activity, lookback_days } = req.body || {};
    if (!recent_activity) return res.status(400).json({ error: 'recent_activity is required' });
    const result = await callOpenRouter([
      { role: 'system', content: 'You synthesize real-time newsletter subscriber intelligence. Always return JSON only.' },
      { role: 'user', content: `Summarize subscriber activity intelligence.\nLookback: ${lookback_days || 7} days\nActivity: ${typeof recent_activity === 'string' ? recent_activity.slice(0, 6000) : JSON.stringify(recent_activity).slice(0, 6000)}\n\nReturn JSON: { "summary": string, "engagement_trends": [{ "metric": string, "direction": "up"|"down"|"flat", "delta_pct": number, "note": string }], "top_actions": [string], "alerts": [{ "level": "info"|"warning"|"critical", "message": string }], "next_best_action": string }` },
    ]);
    const parsed = parseAIJson(result) || { raw: result };
    await persistResult(req.user.id, 'realtime-subscriber-intel', { lookback_days: lookback_days || 7 }, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI realtime-subscriber-intel error:', err.response?.data || err.message);
    if (handleKeyErr(res, err)) return;
    res.status(500).json({ error: 'Failed to generate intelligence' });
  }
});

module.exports = router;
