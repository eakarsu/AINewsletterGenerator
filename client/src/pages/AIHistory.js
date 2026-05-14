import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiCpu } from 'react-icons/fi';
import api from '../api';
import Pagination from '../components/Pagination';

function AIHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [expanded, setExpanded] = useState(null);

  const fetchItems = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/ai/history', { params: { page: p, limit: 20 } });
      const data = res.data.data || (Array.isArray(res.data) ? res.data : []);
      setItems(data);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load AI history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(page); }, [fetchItems, page]);

  const toggleExpand = (id) => setExpanded(expanded === id ? null : id);

  const endpointLabel = (endpoint) => {
    const map = {
      'generate-content': 'Generate Content',
      'generate-subject': 'Generate Subject Lines',
      'adjust-tone': 'Adjust Tone',
      'suggest-images': 'Suggest Images',
      'summarize': 'Summarize',
      'improve': 'Improve Content',
    };
    return map[endpoint] || endpoint;
  };

  const endpointBadgeColor = (endpoint) => {
    const map = {
      'generate-content': 'badge-primary',
      'generate-subject': 'badge-info',
      'adjust-tone': 'badge-warning',
      'suggest-images': 'badge-success',
      'summarize': 'badge-secondary',
      'improve': 'badge-danger',
    };
    return map[endpoint] || 'badge-primary';
  };

  if (loading && items.length === 0) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading AI history...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>AI Generation History</h2><p>Past AI content generations ({pagination.total || 0} total)</p></div>
      </div>

      {items.length === 0 && !loading ? (
        <div className="table-container">
          <div className="empty-state">
            <FiCpu />
            <h3>No AI generations yet</h3>
            <p>Use the AI Tools to generate content and it will appear here</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Input</th>
                <th>Result Preview</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const inputData = item.input_data || {};
                const result = item.result || {};
                const resultText = JSON.stringify(result).substring(0, 80);
                const inputText = Object.entries(inputData)
                  .filter(([, v]) => v)
                  .map(([k, v]) => `${k}: ${String(v).substring(0, 30)}`)
                  .join(', ')
                  .substring(0, 60);

                return (
                  <React.Fragment key={item.id}>
                    <tr onClick={() => toggleExpand(item.id)} style={{ cursor: 'pointer' }}>
                      <td><span className={`badge ${endpointBadgeColor(item.endpoint)}`}>{endpointLabel(item.endpoint)}</span></td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{inputText || '-'}</td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{resultText + (resultText.length >= 80 ? '...' : '')}</td>
                      <td style={{ fontSize: '12px' }}>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td>
                      <td style={{ fontSize: '12px', color: '#6366f1' }}>{expanded === item.id ? 'Hide' : 'View'}</td>
                    </tr>
                    {expanded === item.id && (
                      <tr>
                        <td colSpan={5}>
                          <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '12px', fontSize: '13px' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <strong>Input:</strong>
                              <pre style={{ marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px', color: '#475569' }}>
                                {JSON.stringify(item.input_data, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <strong>Result:</strong>
                              <pre style={{ marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px', color: '#475569' }}>
                                {JSON.stringify(item.result, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      )}
    </div>
  );
}

export default AIHistory;
