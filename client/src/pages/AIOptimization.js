import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCpu, FiUsers, FiClock, FiAlertTriangle, FiChevronDown, FiChevronUp, FiZap, FiTrendingUp, FiCopy } from 'react-icons/fi';
import api from '../api';
import AIReport from '../components/AIReport';
import FullFieldPresets from '../components/FullFieldPresets';

const tools = [
  {
    id: 'segment-optimize',
    title: 'Segment Optimizer',
    description: 'Analyze subscriber data and propose optimized segments',
    icon: FiUsers,
    color: '#6c63ff',
    bg: 'rgba(108,99,255,0.1)',
    endpoint: '/ai/segment-optimize',
    fields: [
      { name: 'subscribers', label: 'Subscribers (JSON array)', type: 'textarea', placeholder: '[{"id":1,"engagement":"high","tags":"fashion"}]' },
      { name: 'goal', label: 'Goal', type: 'text', placeholder: 'Increase open rate' },
      { name: 'current_segments', label: 'Current Segments (optional)', type: 'text', placeholder: 'New, Active, Lapsed' },
    ],
  },
  {
    id: 'send-time-optimize',
    title: 'Send Time Optimizer',
    description: 'Pick the best time-of-day and day-of-week for sends',
    icon: FiClock,
    color: '#00b894',
    bg: 'rgba(0,184,148,0.1)',
    endpoint: '/ai/send-time-optimize',
    fields: [
      { name: 'audience', label: 'Audience Description', type: 'textarea', placeholder: 'e.g. SMB owners in EU, age 30-50' },
      { name: 'timezone', label: 'Timezone', type: 'text', placeholder: 'America/New_York' },
      { name: 'past_performance', label: 'Past Performance (optional JSON)', type: 'textarea', placeholder: '[{"day":"Tue","hour":10,"open_rate":0.42}]' },
    ],
  },
  {
    id: 'churn-detection',
    title: 'Churn Detection',
    description: 'Identify at-risk subscribers and recommend re-engagement',
    icon: FiAlertTriangle,
    color: '#e17055',
    bg: 'rgba(225,112,85,0.1)',
    endpoint: '/ai/churn-detection',
    fields: [
      { name: 'subscribers', label: 'Subscribers (JSON array)', type: 'textarea', placeholder: '[{"id":1,"last_open_days":42,"opens_last_30":0}]' },
      { name: 'lookback_days', label: 'Lookback (days)', type: 'select', options: ['30', '60', '90', '180'], placeholder: '' },
    ],
  },
  {
    id: 'subscriber-prediction',
    title: 'Subscriber Prediction',
    description: 'Forecast engagement, opens, clicks, and unsubscribes per subscriber',
    icon: FiTrendingUp,
    color: '#0984e3',
    bg: 'rgba(9,132,227,0.1)',
    endpoint: '/ai/subscriber-prediction',
    fields: [
      { name: 'subscribers', label: 'Subscribers (JSON array)', type: 'textarea', placeholder: '[{"id":1,"opens_last_30":3,"clicks_last_30":1}]' },
      { name: 'target_metric', label: 'Target Metric', type: 'select', options: ['engagement', 'open_rate', 'click_rate', 'churn'], placeholder: '' },
      { name: 'horizon_days', label: 'Horizon (days)', type: 'select', options: ['14', '30', '60', '90'], placeholder: '' },
    ],
  },
  {
    id: 'list-dedupe',
    title: 'List Import Dedupe',
    description: 'Identify duplicates and normalization issues in an imported list',
    icon: FiCopy,
    color: '#fdcb6e',
    bg: 'rgba(253,203,110,0.15)',
    endpoint: '/ai/list-dedupe',
    fields: [
      { name: 'subscribers', label: 'Subscribers (JSON array)', type: 'textarea', placeholder: '[{"id":1,"email":"a@x.com","name":"A"}, {"id":2,"email":"A@X.COM","name":"A."}]' },
    ],
  },
  // Apply pass 5 backlog tools
  {
    id: 'agentic-campaign-orchestrate',
    title: 'Campaign Orchestrator',
    description: 'Plan a multi-step campaign for a goal (plan-only, no auto-send)',
    icon: FiZap,
    color: '#a29bfe',
    bg: 'rgba(162,155,254,0.15)',
    endpoint: '/ai/agentic-campaign-orchestrate',
    fields: [
      { name: 'goal', label: 'Goal', type: 'text', placeholder: 'e.g. drive 1000 product trial signups in 30 days' },
      { name: 'audience', label: 'Audience', type: 'text', placeholder: 'e.g. SMB owners' },
      { name: 'brand_voice', label: 'Brand Voice', type: 'text', placeholder: 'friendly, expert' },
      { name: 'time_horizon_days', label: 'Horizon (days)', type: 'select', options: ['7', '14', '30', '60', '90'], placeholder: '' },
    ],
  },
  {
    id: 'batch-content-variants',
    title: 'Batch Content Variants',
    description: 'Generate N variants of one brief for A/B testing',
    icon: FiCpu,
    color: '#fd79a8',
    bg: 'rgba(253,121,168,0.15)',
    endpoint: '/ai/batch-content-variants',
    fields: [
      { name: 'brief', label: 'Brief', type: 'textarea', placeholder: 'Describe the email goal, key message, and any must-include points.' },
      { name: 'audience', label: 'Audience', type: 'text', placeholder: 'general' },
      { name: 'variant_count', label: 'Variants', type: 'select', options: ['2', '3', '4', '5', '6'], placeholder: '' },
      { name: 'tones', label: 'Tones (JSON array)', type: 'textarea', placeholder: '["confident","curious","urgent"]' },
    ],
  },
  {
    id: 'vertical-template',
    title: 'Vertical Template',
    description: 'Generate a reusable newsletter template for a vertical',
    icon: FiCpu,
    color: '#74b9ff',
    bg: 'rgba(116,185,255,0.15)',
    endpoint: '/ai/vertical-template',
    fields: [
      { name: 'vertical', label: 'Vertical', type: 'text', placeholder: 'e.g. SaaS, e-commerce, fintech, healthcare' },
      { name: 'tone', label: 'Tone', type: 'text', placeholder: 'professional' },
      { name: 'sections', label: 'Sections (JSON array)', type: 'textarea', placeholder: '["hero","main_story","tips","community","cta"]' },
    ],
  },
  {
    id: 'dynamic-content-blocks',
    title: 'Dynamic Content Blocks',
    description: 'Per-segment content blocks for personalization',
    icon: FiUsers,
    color: '#55efc4',
    bg: 'rgba(85,239,196,0.15)',
    endpoint: '/ai/dynamic-content-blocks',
    fields: [
      { name: 'segments', label: 'Segments (JSON array)', type: 'textarea', placeholder: '[{"name":"new","desc":"<7d"},{"name":"vip","desc":"top 5%"}]' },
      { name: 'base_content', label: 'Base Content', type: 'textarea', placeholder: 'Optional: shared message all segments should ladder up to.' },
    ],
  },
  {
    id: 'realtime-subscriber-intel',
    title: 'Realtime Subscriber Intel',
    description: 'Synthesize recent subscriber activity into a briefing',
    icon: FiTrendingUp,
    color: '#ff7675',
    bg: 'rgba(255,118,117,0.15)',
    endpoint: '/ai/realtime-subscriber-intel',
    fields: [
      { name: 'recent_activity', label: 'Recent Activity (text or JSON)', type: 'textarea', placeholder: 'Paste recent opens / clicks / unsubscribes / signups.' },
      { name: 'lookback_days', label: 'Lookback (days)', type: 'select', options: ['1', '7', '14', '30'], placeholder: '' },
    ],
  },
];

const examples = {
  'segment-optimize': [
    { label: 'Engagement groups', values: { subscribers: JSON.stringify([{ id: 'sample-1', engagement: 'high', tags: ['product'] }, { id: 'sample-2', engagement: 'medium', tags: ['events'] }, { id: 'sample-3', engagement: 'low', tags: ['product'] }], null, 2), goal: 'Improve newsletter relevance while keeping segments large enough to evaluate.', current_segments: 'New, Active, Lapsed' } },
    { label: 'Topic preferences', values: { subscribers: JSON.stringify([{ id: 'sample-4', engagement: 'high', tags: ['research', 'events'] }, { id: 'sample-5', engagement: 'medium', tags: ['product'] }, { id: 'sample-6', engagement: 'low', tags: ['research'] }], null, 2), goal: 'Suggest interpretable topic-based segments and identify missing evidence.', current_segments: 'General, Product, Community' } },
    { label: 'Reactivation review', values: { subscribers: JSON.stringify([{ id: 'sample-7', engagement: 'low', tags: ['newsletter'] }, { id: 'sample-8', engagement: 'medium', tags: ['community'] }, { id: 'sample-9', engagement: 'high', tags: ['product'] }], null, 2), goal: 'Compare a cautious re-engagement group with active readers; avoid implying consent to send.', current_segments: 'Active, Quiet, Recently joined' } },
  ],
  'send-time-optimize': [
    { label: 'Eastern audience', values: { audience: 'Illustrative US East Coast small-business readers; sample is fictional.', timezone: 'America/New_York', past_performance: JSON.stringify([{ day: 'Tue', hour: 10, open_rate: 0.31 }, { day: 'Thu', hour: 14, open_rate: 0.28 }], null, 2) } },
    { label: 'Central audience', values: { audience: 'Illustrative Central time community subscribers; confirm location and consent data.', timezone: 'America/Chicago', past_performance: JSON.stringify([{ day: 'Wed', hour: 9, open_rate: 0.29 }, { day: 'Fri', hour: 11, open_rate: 0.26 }], null, 2) } },
    { label: 'UK audience', values: { audience: 'Illustrative UK professional readership; synthetic engagement examples only.', timezone: 'Europe/London', past_performance: JSON.stringify([{ day: 'Tue', hour: 8, open_rate: 0.32 }, { day: 'Thu', hour: 16, open_rate: 0.25 }], null, 2) } },
  ],
  'churn-detection': [
    { label: '30-day review', values: { subscribers: JSON.stringify([{ id: 'sample-a', last_open_days: 42, opens_last_30: 0 }, { id: 'sample-b', last_open_days: 18, opens_last_30: 1 }], null, 2), lookback_days: '30' } },
    { label: '60-day review', values: { subscribers: JSON.stringify([{ id: 'sample-c', last_open_days: 73, opens_last_30: 0 }, { id: 'sample-d', last_open_days: 37, opens_last_30: 2 }], null, 2), lookback_days: '60' } },
    { label: '90-day review', values: { subscribers: JSON.stringify([{ id: 'sample-e', last_open_days: 105, opens_last_30: 0 }, { id: 'sample-f', last_open_days: 60, opens_last_30: 1 }], null, 2), lookback_days: '90' } },
  ],
  'subscriber-prediction': [
    { label: 'Open-rate forecast', values: { subscribers: JSON.stringify([{ id: 'sample-g', opens_last_30: 3, clicks_last_30: 1 }, { id: 'sample-h', opens_last_30: 1, clicks_last_30: 0 }], null, 2), target_metric: 'open_rate', horizon_days: '30' } },
    { label: 'Engagement forecast', values: { subscribers: JSON.stringify([{ id: 'sample-i', opens_last_30: 6, clicks_last_30: 2 }, { id: 'sample-j', opens_last_30: 2, clicks_last_30: 1 }], null, 2), target_metric: 'engagement', horizon_days: '60' } },
    { label: 'Churn forecast', values: { subscribers: JSON.stringify([{ id: 'sample-k', opens_last_30: 0, clicks_last_30: 0 }, { id: 'sample-l', opens_last_30: 1, clicks_last_30: 0 }], null, 2), target_metric: 'churn', horizon_days: '90' } },
  ],
  'list-dedupe': [
    { label: 'Case normalization', values: { subscribers: JSON.stringify([{ id: 'sample-10', email: 'reader1@example.invalid', name: 'Sample Reader' }, { id: 'sample-11', email: 'READER1@example.invalid', name: 'Sample Reader' }], null, 2) } },
    { label: 'Whitespace review', values: { subscribers: JSON.stringify([{ id: 'sample-12', email: 'reader2@example.invalid', name: 'Example Two' }, { id: 'sample-13', email: ' reader2@example.invalid ', name: 'Example 2' }], null, 2) } },
    { label: 'Similar records', values: { subscribers: JSON.stringify([{ id: 'sample-14', email: 'reader3@example.invalid', name: 'Sample Three' }, { id: 'sample-15', email: 'reader-three@example.invalid', name: 'Sample Three' }], null, 2) } },
  ],
  'agentic-campaign-orchestrate': [
    { label: 'Trial education plan', values: { goal: 'Plan a 30-day educational campaign for a fictional product trial. Plan only; do not send messages or assume consent.', audience: 'Small-business operators who opted in to product updates; illustrative audience.', brand_voice: 'Helpful, concise, evidence-led', time_horizon_days: '30' } },
    { label: 'Event awareness plan', values: { goal: 'Outline a two-week newsletter campaign to raise awareness of a fictional online workshop. Include review checkpoints and no automatic sends.', audience: 'Existing subscribers interested in professional development; illustrative only.', brand_voice: 'Warm, practical, inclusive', time_horizon_days: '14' } },
    { label: 'Community digest plan', values: { goal: 'Plan a monthly community digest with editorial approval before every send.', audience: 'Readers who explicitly subscribed to community updates; sample segment.', brand_voice: 'Friendly, transparent, accessible', time_horizon_days: '30' } },
  ],
  'batch-content-variants': [
    { label: 'Feature announcement', values: { brief: 'Explain a fictional newsletter search feature, its reader benefit, and where to find a short guide. Avoid unsupported performance claims.', audience: 'Existing product newsletter readers', variant_count: '3', tones: JSON.stringify(['clear', 'curious', 'friendly'], null, 2) } },
    { label: 'Event invitation', values: { brief: 'Invite readers to a fictional 30-minute online planning workshop. Leave date, registration link, and presenter names as placeholders for editor review.', audience: 'Busy independent business owners', variant_count: '4', tones: JSON.stringify(['warm', 'direct', 'professional', 'playful'], null, 2) } },
    { label: 'Monthly digest', values: { brief: 'Introduce a monthly digest with three verified resources and a reader feedback prompt. Do not invent links or facts.', audience: 'Community subscribers', variant_count: '5', tones: JSON.stringify(['concise', 'helpful', 'optimistic'], null, 2) } },
  ],
  'vertical-template': [
    { label: 'SaaS newsletter', values: { vertical: 'B2B SaaS product updates', tone: 'Professional, practical, and transparent', sections: JSON.stringify(['editor_note', 'product_update', 'customer_tip', 'verified_resource', 'feedback_cta'], null, 2) } },
    { label: 'Community newsletter', values: { vertical: 'Local community organization', tone: 'Warm, inclusive, accessible', sections: JSON.stringify(['welcome', 'upcoming_events', 'community_story', 'local_resources', 'preferences_cta'], null, 2) } },
    { label: 'Education digest', values: { vertical: 'Continuing education and professional learning', tone: 'Encouraging, evidence-led, concise', sections: JSON.stringify(['learning_highlight', 'practical_exercise', 'verified_reading', 'schedule_note', 'reader_question'], null, 2) } },
  ],
  'dynamic-content-blocks': [
    { label: 'New and returning readers', values: { segments: JSON.stringify([{ name: 'new_reader', desc: 'Recently opted in; needs a clear introduction' }, { name: 'returning_reader', desc: 'Engaged with prior issues; appreciates useful follow-up' }], null, 2), base_content: 'Shared theme: a practical monthly planning checklist. Keep every block accurate and easy to scan.' } },
    { label: 'Topic preferences', values: { segments: JSON.stringify([{ name: 'product_updates', desc: 'Selected product news preferences' }, { name: 'community_events', desc: 'Selected community event preferences' }, { name: 'learning_resources', desc: 'Selected educational resource preferences' }], null, 2), base_content: 'Shared theme: highlight one verified resource and respect each subscriber’s saved preferences.' } },
    { label: 'Engagement stages', values: { segments: JSON.stringify([{ name: 'active', desc: 'Recent voluntary engagement' }, { name: 'quiet', desc: 'Limited recent engagement; avoid pressure' }], null, 2), base_content: 'Shared theme: provide useful editorial content and a clear preference-management link.' } },
  ],
  'realtime-subscriber-intel': [
    { label: 'Recent week', values: { recent_activity: JSON.stringify([{ event: 'open', day: 'Mon', count: 24 }, { event: 'click', day: 'Tue', count: 7 }, { event: 'unsubscribe', day: 'Fri', count: 1 }], null, 2), lookback_days: '7' } },
    { label: 'Two-week pulse', values: { recent_activity: JSON.stringify([{ event: 'signup', day: 'Mon', count: 9 }, { event: 'open', day: 'Wed', count: 42 }, { event: 'click', day: 'Thu', count: 11 }], null, 2), lookback_days: '14' } },
    { label: 'Monthly review', values: { recent_activity: JSON.stringify([{ event: 'open', day: 'week_1', count: 86 }, { event: 'click', day: 'week_2', count: 19 }, { event: 'unsubscribe', day: 'week_4', count: 3 }], null, 2), lookback_days: '30' } },
  ],
};

function renderResult(output, title) {
  return <AIReport response={output} title={title || 'AI optimization result'} />;
}

function ToolCard({ tool }) {
  const [expanded, setExpanded] = useState(false);
  const [formData, setFormData] = useState({});
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true);
    setOutput(null);
    setError('');
    try {
      const body = {};
      const jsonFields = new Set(['subscribers', 'past_performance', 'segments', 'tones', 'sections', 'recent_activity']);
      const intFields = new Set(['lookback_days', 'horizon_days', 'variant_count', 'time_horizon_days']);
      for (const f of tool.fields) {
        const val = formData[f.name];
        if (val == null || val === '') continue;
        if (jsonFields.has(f.name)) {
          try {
            body[f.name] = JSON.parse(val);
          } catch {
            body[f.name] = val;
          }
        } else if (intFields.has(f.name)) {
          body[f.name] = parseInt(val, 10);
        } else {
          body[f.name] = val;
        }
      }
      const res = await api.post(tool.endpoint, body);
      const data = res.data;
      const result = data.result || data.data || data.output || data.parsed || data;
      setOutput(result);
      toast.success('AI analysis complete');
    } catch (err) {
      let msg = err.response?.data?.message || err.response?.data?.error || 'AI request failed. Please try again.';
      if (err.response?.status === 503) {
        msg = 'AI service unavailable (503). Configure OPENROUTER_API_KEY on the server.';
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const Icon = tool.icon;
  return (
    <div className="ai-tool-card">
      <div className="ai-tool-header" onClick={() => setExpanded(!expanded)}>
        <div className="ai-tool-icon" style={{ background: tool.bg, color: tool.color }}>
          <Icon />
        </div>
        <div style={{ flex: 1 }}>
          <h3>{tool.title}</h3>
          <p>{tool.description}</p>
        </div>
        <div style={{ color: '#b2bec3', fontSize: 20 }}>
          {expanded ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </div>

      {expanded && (
        <div className="ai-tool-body">
          <FullFieldPresets
            value={formData}
            presets={examples[tool.id]}
            disabled={loading}
            onChange={(next) => { setFormData(next); setOutput(null); setError(''); }}
          />
          {tool.fields.map((field) => (
            <div className="form-group" key={field.name}>
              <label>{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  className="form-control"
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  rows={4}
                />
              ) : field.type === 'select' ? (
                <select
                  className="form-control"
                  name={field.name}
                  value={formData[field.name] || field.options[0]}
                  onChange={handleChange}
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="form-control"
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}

          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? (
              <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }}></span> Analyzing...</>
            ) : (
              <><FiZap /> Run</>
            )}
          </button>

          {error && <div style={{ color: '#e17055', marginTop: 12, fontSize: 13 }}>{error}</div>}

          {output && (
            <div className="ai-output">
              <div className="ai-output-header">
                <FiCpu />
                AI Result
              </div>
              <div className="ai-output-content">{renderResult(output, tool.title)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AIOptimization() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2>AI Optimization</h2>
          <p>Segment, send-time, and churn intelligence</p>
        </div>
      </div>

      <div className="ai-tools-grid">
        {tools.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>
    </div>
  );
}

export default AIOptimization;
