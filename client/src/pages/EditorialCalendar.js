import React, { useState } from 'react';
import api from '../api';

const sample = JSON.stringify({
  audience: 'B2B operators',
  cadence: 'weekly',
  themes: ['industry trend', 'customer story', 'product tip'],
  nextSendDate: new Date().toISOString()
}, null, 2);

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
