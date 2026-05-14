import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCpu, FiUsers, FiClock, FiAlertTriangle, FiChevronDown, FiChevronUp, FiZap, FiTrendingUp, FiCopy } from 'react-icons/fi';
import api from '../api';

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

function renderResult(output) {
  if (!output) return null;
  if (typeof output === 'string') {
    return <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{output}</pre>;
  }
  if (Array.isArray(output)) {
    return output.map((item, idx) => (
      <div key={idx} className="ai-output-section">
        {typeof item === 'object'
          ? Object.entries(item).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#636e72', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.replace(/_/g, ' ')}</span>
                <div style={{ fontSize: 14, marginTop: 2 }}>{typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}</div>
              </div>
            ))
          : String(item)}
      </div>
    ));
  }
  if (typeof output === 'object') {
    return Object.entries(output).map(([key, val]) => {
      if (key === 'success' || key === 'status' || key === 'id') return null;
      return (
        <div key={key} className="ai-output-section">
          <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</h4>
          <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {typeof val === 'string' ? val : Array.isArray(val) ? renderResult(val) : JSON.stringify(val, null, 2)}
          </div>
        </div>
      );
    }).filter(Boolean);
  }
  return <div>{String(output)}</div>;
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
              <div className="ai-output-content">{renderResult(output)}</div>
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
