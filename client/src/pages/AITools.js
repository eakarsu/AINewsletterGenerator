import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiEdit3, FiType, FiSliders, FiImage, FiFileText, FiStar, FiChevronDown, FiChevronUp, FiZap } from 'react-icons/fi';
import api from '../api';
import AIReport from '../components/AIReport';
import FullFieldPresets from '../components/FullFieldPresets';

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

const promptExamples = {
  generate: [
    { label: 'Weekly industry brief', values: { topic: 'Create a weekly newsletter about practical AI tools for small nonprofit teams. Cover one workflow example, implementation effort, privacy considerations, and questions readers should verify. Treat all details as illustrative unless sources are supplied.', tone: 'professional', length: 'medium' } },
    { label: 'Friendly product update', values: { topic: 'Draft a friendly customer newsletter announcing a fictional spring update: clearer onboarding, improved search, and a new help center. Keep claims cautious and mark placeholder details for review.', tone: 'friendly', length: 'short' } },
    { label: 'Editorial deep dive', values: { topic: 'Prepare a long-form editorial newsletter outline on sustainable urban gardening, with a clear opening, three practical sections, seasonal considerations, and a closing reader prompt. Do not invent statistics or citations.', tone: 'formal', length: 'long' } },
  ],
  'subject-lines': [
    { label: 'Clear and useful', values: { content: 'A practical guide to organizing a weekly team newsletter: choose a reader need, verify source notes, use short sections, and review links before sending.', count: '3' } },
    { label: 'Curiosity-led', values: { content: 'This issue shares three small workflow changes that can help a distributed team reduce meeting overload, along with a checklist for trying them safely.', count: '5' } },
    { label: 'Seasonal campaign', values: { content: 'A spring edition featuring a seasonal planning checklist, a short editor note, and practical ideas readers can adapt to their own schedules.', count: '10' } },
  ],
  tone: [
    { label: 'Professional rewrite', values: { content: 'We have updated the newsletter layout. Please review the new sections and tell us which information is most useful to your team.', target_tone: 'professional' } },
    { label: 'Friendly rewrite', values: { content: 'The new newsletter layout is ready. Take a look, and let us know what would make it more useful for you.', target_tone: 'friendly' } },
    { label: 'Empathetic rewrite', values: { content: 'We know inboxes are busy. This update makes the newsletter easier to scan, and your feedback will help us improve it.', target_tone: 'empathetic' } },
  ],
  images: [
    { label: 'Editorial illustrations', values: { content: 'A newsletter about practical home energy conservation for renters, with accessible tips, neutral imagery, and no identifiable people or addresses.', count: '3' } },
    { label: 'Product story', values: { content: 'A product update about a fictional reusable water bottle, highlighting everyday use, care instructions, and material details that still need source verification.', count: '5' } },
    { label: 'Community spotlight', values: { content: 'A community newsletter about a neighborhood garden event. Suggest inclusive, consent-aware visual concepts that do not identify private individuals.', count: '8' } },
  ],
  summarize: [
    { label: 'Brief summary', values: { content: 'This issue explains how to plan a weekly newsletter. Begin with a reader need, group verified notes into a few sections, use descriptive headings, check every link, and invite feedback. Avoid unsupported claims and keep private information out of shared drafts.', max_length: '50' } },
    { label: 'Standard summary', values: { content: 'A product team is preparing an update for customers. The draft should explain what changed, who benefits, and where to get help. Dates, availability, and performance claims must be confirmed by the product owner before publication. Keep the message accessible and provide a clear way to share feedback.', max_length: '100' } },
    { label: 'Detailed summary', values: { content: 'The editorial team plans a monthly community newsletter with an opening note, local resource roundup, upcoming events, and a reader contribution section. Editors will confirm event dates with organizers, use approved images, label sponsored content, and proofread links. Readers should be able to manage preferences or unsubscribe easily. The first edition is a planning example; confirm all real names, dates, permissions, and claims before sending.', max_length: '200' } },
  ],
  improve: [
    { label: 'Clarity pass', values: { content: 'Our newsletter has several updates about the new planning toolkit. The toolkit is available now to invited pilot users. We will share broader availability only after the release date is confirmed.', focus: 'clarity' } },
    { label: 'Engagement pass', values: { content: 'This month we are sharing a short checklist for writing a useful team newsletter. Choose one audience need, organize the important notes, and verify the details before you publish.', focus: 'engagement' } },
    { label: 'Concise edit', values: { content: 'The upcoming issue includes a note from the editor, a guide to three planning resources, and a short list of dates to confirm with their organizers before publication.', focus: 'conciseness' } },
  ],
};

function formatAIOutput(output, title) {
  return <AIReport response={output} title={title || 'AI response'} />;
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
          <FullFieldPresets
            value={formData}
            presets={promptExamples[tool.id]}
            disabled={loading}
            onChange={(next) => { setFormData(next); setOutput(null); }}
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
                {formatAIOutput(output, tool.title)}
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
