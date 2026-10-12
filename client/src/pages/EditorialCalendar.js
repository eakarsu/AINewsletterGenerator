import React, { useState } from 'react';
import api from '../api';
import '../components/AIWorkspace.css';

const sample = JSON.stringify({
  audience: 'B2B operators',
  cadence: 'weekly',
  themes: ['industry trend', 'customer story', 'product tip'],
  nextSendDate: new Date().toISOString()
}, null, 2);

const calendarExamples = [
  { label: 'Weekly editorial plan', payload: { audience: 'B2B operators; illustrative audience only', cadence: 'weekly', themes: ['verified industry trend', 'practical workflow', 'reader question'], nextSendDate: new Date(Date.now() + 7 * 86400000).toISOString() } },
  { label: 'Community digest', payload: { audience: 'Opted-in community newsletter readers', cadence: 'biweekly', themes: ['upcoming events', 'community story with permission', 'local resource'], nextSendDate: new Date(Date.now() + 14 * 86400000).toISOString() } },
  { label: 'Product education series', payload: { audience: 'Subscribers who selected product education', cadence: 'monthly', themes: ['feature guide', 'verified customer tip', 'support resource'], nextSendDate: new Date(Date.now() + 30 * 86400000).toISOString() } },
];

export default function EditorialCalendar() {
  const [payload, setPayload] = useState(sample);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function run() {
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/editorial-calendar/plan', JSON.parse(payload));
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Editorial Calendar Planner</h1>
        <p>Turn audience, cadence, and themes into issue dates, subject lines, segments, and CTAs.</p>
      </div>
      <div className="content-grid">
        <div className="card">
          <div className="ai-preset-bar" aria-label="Fill all editorial calendar inputs">
            <div><strong>Fill all fields</strong><p>Each example fills the complete calendar request. Review the audience, themes, and date before planning.</p></div>
            <div className="ai-actions">{calendarExamples.map((example) => <button key={example.label} type="button" className="btn btn-secondary" onClick={() => { setPayload(JSON.stringify(example.payload, null, 2)); setResult(null); setError(''); }}>{example.label}</button>)}</div>
          </div>
          <textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={12} style={{ width: '100%', fontFamily: 'monospace' }} />
          {error && <div className="error-message">{error}</div>}
          <button className="btn btn-primary" onClick={run}>Plan calendar</button>
        </div>
        <div className="card">
          {result ? (
            <>
              {result.issues.map((issue) => (
                <div key={issue.sendAt} style={{ borderBottom: '1px solid #e5e7eb', padding: '10px 0' }}>
                  <strong>{issue.sendAt}: {issue.subject}</strong>
                  <div>{issue.segment} | {issue.cta}</div>
                </div>
              ))}
              <ul>{result.productionChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          ) : <p>Run a plan to build the upcoming newsletter calendar.</p>}
        </div>
      </div>
    </div>
  );
}
