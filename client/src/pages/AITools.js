import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCpu, FiEdit3, FiType, FiSliders, FiImage, FiFileText, FiStar, FiChevronDown, FiChevronUp, FiZap } from 'react-icons/fi';
import api from '../api';

const aiTools = [
  {
    id: 'generate',
    title: 'Generate Content',
    description: 'Generate full newsletter content from a topic or brief',
    icon: FiEdit3,
    color: '#6c63ff',
    bg: 'rgba(108,99,255,0.1)',
    endpoint: '/ai/generate-content',
    fields: [
      { name: 'topic', label: 'Topic / Brief', type: 'textarea', placeholder: 'Describe the newsletter topic you want to generate content for...' },
      { name: 'tone', label: 'Tone', type: 'select', options: ['professional', 'casual', 'friendly', 'formal', 'humorous'], placeholder: '' },
      { name: 'length', label: 'Length', type: 'select', options: ['short', 'medium', 'long'], placeholder: '' },
    ],
  },
  {
    id: 'subject-lines',
    title: 'Generate Subject Lines',
    description: 'Create compelling email subject lines that boost open rates',
    icon: FiType,
    color: '#00b894',
    bg: 'rgba(0,184,148,0.1)',
    endpoint: '/ai/generate-subject',
    fields: [
      { name: 'content', label: 'Newsletter Content / Topic', type: 'textarea', placeholder: 'Paste your newsletter content or describe the topic...' },
      { name: 'count', label: 'Number of Suggestions', type: 'select', options: ['3', '5', '10'], placeholder: '' },
    ],
  },
  {
    id: 'tone',
    title: 'Adjust Tone',
    description: 'Rewrite content in a different tone or style',
    icon: FiSliders,
    color: '#e17055',
    bg: 'rgba(225,112,85,0.1)',
    endpoint: '/ai/adjust-tone',
    fields: [
      { name: 'content', label: 'Content to Adjust', type: 'textarea', placeholder: 'Paste the content you want to adjust the tone of...' },
      { name: 'target_tone', label: 'Target Tone', type: 'select', options: ['professional', 'casual', 'friendly', 'formal', 'humorous', 'persuasive', 'empathetic'], placeholder: '' },
    ],
  },
  {
    id: 'images',
    title: 'Suggest Images',
    description: 'Get AI-powered image suggestions for your newsletter',
    icon: FiImage,
    color: '#0984e3',
    bg: 'rgba(9,132,227,0.1)',
    endpoint: '/ai/suggest-images',
    fields: [
      { name: 'content', label: 'Newsletter Content / Topic', type: 'textarea', placeholder: 'Describe your newsletter content for image suggestions...' },
      { name: 'count', label: 'Number of Suggestions', type: 'select', options: ['3', '5', '8'], placeholder: '' },
    ],
  },
  {
    id: 'summarize',
    title: 'Summarize',
    description: 'Create concise summaries of long-form content',
    icon: FiFileText,
    color: '#a29bfe',
    bg: 'rgba(162,155,254,0.1)',
    endpoint: '/ai/summarize',
    fields: [
      { name: 'content', label: 'Content to Summarize', type: 'textarea', placeholder: 'Paste the long-form content you want to summarize...' },
      { name: 'max_length', label: 'Summary Length (words)', type: 'select', options: ['50', '100', '200', '300'], placeholder: '' },
    ],
  },
  {
    id: 'improve',
    title: 'Improve Content',
    description: 'Enhance and polish your newsletter content with AI',
    icon: FiStar,
    color: '#fdcb6e',
    bg: 'rgba(253,203,110,0.2)',
    endpoint: '/ai/improve',
    fields: [
      { name: 'content', label: 'Content to Improve', type: 'textarea', placeholder: 'Paste the content you want to improve...' },
      { name: 'focus', label: 'Improvement Focus', type: 'select', options: ['clarity', 'engagement', 'grammar', 'conciseness', 'persuasiveness'], placeholder: '' },
    ],
  },
];

function formatAIOutput(output) {
  if (!output) return null;

  if (typeof output === 'string') {
    const sections = output.split(/\n\n+/);
    if (sections.length > 1) {
      return sections.map((section, idx) => {
        const lines = section.trim().split('\n');
        const isHeader = lines[0] && (lines[0].startsWith('#') || lines[0].startsWith('**') || lines[0].endsWith(':'));
        let headerText = lines[0];
        if (headerText.startsWith('#')) headerText = headerText.replace(/^#+\s*/, '');
        if (headerText.startsWith('**') && headerText.endsWith('**')) headerText = headerText.slice(2, -2);

        if (isHeader && lines.length > 1) {
          return (
            <div key={idx} className="ai-output-section">
              <h4>{headerText}</h4>
              <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {lines.slice(1).map((line, i) => {
                  const cleaned = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
                  const isBullet = line.match(/^[-*]\s/) || line.match(/^\d+\.\s/);
                  if (isBullet) {
                    return <div key={i} style={{ paddingLeft: 16, position: 'relative', marginBottom: 4 }}>
                      <span style={{ position: 'absolute', left: 0, color: '#6c63ff', fontWeight: 700 }}>&#8226;</span>
                      {cleaned}
                    </div>;
                  }
                  return <div key={i}>{line}</div>;
                })}
              </div>
            </div>
          );
        }

        return (
          <div key={idx} style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {lines.map((line, i) => {
              const cleaned = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
              const isBullet = line.match(/^[-*]\s/) || line.match(/^\d+\.\s/);
              let text = line;
              if (text.startsWith('#')) text = text.replace(/^#+\s*/, '');

              if (isBullet) {
                return <div key={i} style={{ paddingLeft: 16, position: 'relative', marginBottom: 4 }}>
                  <span style={{ position: 'absolute', left: 0, color: '#6c63ff', fontWeight: 700 }}>&#8226;</span>
                  {cleaned}
                </div>;
              }
              return <div key={i} style={{ fontWeight: i === 0 && lines.length > 1 ? 600 : 400 }}>{text}</div>;
            })}
          </div>
        );
      });
    }

    return <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{output}</div>;
  }

  if (Array.isArray(output)) {
    return output.map((item, idx) => {
      if (typeof item === 'string') {
        return (
          <div key={idx} className="ai-output-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ background: '#6c63ff', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>{item}</span>
            </div>
          </div>
        );
      }
      if (typeof item === 'object') {
        return (
          <div key={idx} className="ai-output-section">
            {Object.entries(item).map(([key, val]) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#636e72', textTransform: 'uppercase', letterSpacing: 0.5 }}>{key.replace(/_/g, ' ')}</span>
                <div style={{ fontSize: 14, marginTop: 2 }}>{typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}</div>
              </div>
            ))}
          </div>
        );
      }
      return <div key={idx}>{String(item)}</div>;
    });
  }

  if (typeof output === 'object') {
    const content = output.content || output.result || output.text || output.data || output.output || output.generated_content || output.message;
    if (typeof content === 'string') {
      return formatAIOutput(content);
    }
    if (Array.isArray(content)) {
      return formatAIOutput(content);
    }

    return Object.entries(output).map(([key, val]) => {
      if (key === 'success' || key === 'status') return null;
      return (
        <div key={key} className="ai-output-section">
          <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
          <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {typeof val === 'string' ? val : (Array.isArray(val) ? formatAIOutput(val) : JSON.stringify(val, null, 2))}
          </div>
        </div>
      );
    }).filter(Boolean);
  }

  return <div>{String(output)}</div>;
}

function AIToolCard({ tool }) {
  const [expanded, setExpanded] = useState(false);
  const [formData, setFormData] = useState({});
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const hasContent = Object.values(formData).some(v => v && v.trim());
    if (!hasContent) {
      toast.error('Please fill in the required fields');
      return;
    }

    setLoading(true);
    setOutput(null);
    try {
      const res = await api.post(tool.endpoint, formData);
      const data = res.data;
      const result = data.content || data.result || data.data || data.output || data.generated_content || data.suggestions || data.subjects || data.subject_lines || data.summary || data.improved_content || data.improved || data.images || data;
      setOutput(result);
      toast.success('AI content generated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'AI generation failed. Please try again.';
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
                    <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
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
              <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }}></span> Generating...</>
            ) : (
              <><FiZap /> Generate</>
            )}
          </button>

          {output && (
            <div className="ai-output">
              <div className="ai-output-header">
                <FiCpu />
                AI Generated Output
              </div>
              <div className="ai-output-content">
                {formatAIOutput(output)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AITools() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2>AI Tools</h2>
          <p>AI-powered content generation and optimization tools</p>
        </div>
      </div>

      <div className="ai-tools-grid">
        {aiTools.map((tool) => (
          <AIToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

export default AITools;
