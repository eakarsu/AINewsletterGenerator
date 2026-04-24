const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(messages) {
  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
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

// POST /api/ai/generate-content
router.post('/generate-content', auth, async (req, res) => {
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
    res.json({ content });
  } catch (err) {
    console.error('AI generate-content error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// POST /api/ai/generate-subject
router.post('/generate-subject', auth, async (req, res) => {
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
    let subjects;
    try {
      subjects = JSON.parse(result);
    } catch {
      subjects = result.split('\n').filter((line) => line.trim().length > 0);
    }
    res.json({ subjects });
  } catch (err) {
    console.error('AI generate-subject error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate subject lines' });
  }
});

// POST /api/ai/adjust-tone
router.post('/adjust-tone', auth, async (req, res) => {
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
    res.json({ content: result });
  } catch (err) {
    console.error('AI adjust-tone error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to adjust tone' });
  }
});

// POST /api/ai/suggest-images
router.post('/suggest-images', auth, async (req, res) => {
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
    let suggestions;
    try {
      suggestions = JSON.parse(result);
    } catch {
      suggestions = [{ description: result, search_terms: '', placement: 'header' }];
    }
    res.json({ suggestions });
  } catch (err) {
    console.error('AI suggest-images error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to suggest images' });
  }
});

// POST /api/ai/summarize
router.post('/summarize', auth, async (req, res) => {
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
    res.json({ summary: result });
  } catch (err) {
    console.error('AI summarize error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to summarize content' });
  }
});

// POST /api/ai/improve
router.post('/improve', auth, async (req, res) => {
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
    res.json({ improved_content: result });
  } catch (err) {
    console.error('AI improve error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to improve content' });
  }
});

module.exports = router;
