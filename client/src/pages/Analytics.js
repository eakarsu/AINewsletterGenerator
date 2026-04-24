import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiBarChart2 } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';

const emptyForm = { campaign_id: '', sent_count: '', open_count: '', click_count: '', bounce_count: '', unsubscribe_count: '' };

function Analytics() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/analytics');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    try {
      await api.post('/analytics', {
        campaign_id: form.campaign_id || null,
        sent_count: parseInt(form.sent_count) || 0,
        open_count: parseInt(form.open_count) || 0,
        click_count: parseInt(form.click_count) || 0,
        bounce_count: parseInt(form.bounce_count) || 0,
        unsubscribe_count: parseInt(form.unsubscribe_count) || 0,
      });
      toast.success('Analytics record created');
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create record');
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/analytics/${selectedItem.id}`, {
        campaign_id: form.campaign_id || null,
        sent_count: parseInt(form.sent_count) || 0,
        open_count: parseInt(form.open_count) || 0,
        click_count: parseInt(form.click_count) || 0,
        bounce_count: parseInt(form.bounce_count) || 0,
        unsubscribe_count: parseInt(form.unsubscribe_count) || 0,
      });
      toast.success('Analytics record updated');
      setShowEdit(false);
      setShowDetail(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update record');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/analytics/${selectedItem.id}`);
      toast.success('Analytics record deleted');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const openDetail = (item) => { setSelectedItem(item); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      campaign_id: selectedItem.campaign_id || '',
      sent_count: selectedItem.sent_count || '',
      open_count: selectedItem.open_count || '',
      click_count: selectedItem.click_count || '',
      bounce_count: selectedItem.bounce_count || '',
      unsubscribe_count: selectedItem.unsubscribe_count || '',
    });
    setShowDetail(false);
    setShowEdit(true);
  };
  const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };

  const openRate = (item) => item.sent_count > 0 ? ((item.open_count / item.sent_count) * 100).toFixed(1) + '%' : '0%';
  const clickRate = (item) => item.sent_count > 0 ? ((item.click_count / item.sent_count) * 100).toFixed(1) + '%' : '0%';

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading analytics...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>Analytics</h2><p>Track performance metrics and insights</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Record</button>
      </div>

      {items.length === 0 ? (
        <div className="table-container"><div className="empty-state"><FiBarChart2 /><h3>No analytics data yet</h3><p>Analytics records will appear here</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Campaign</th><th>Sent</th><th>Opens</th><th>Open Rate</th><th>Clicks</th><th>Click Rate</th><th>Bounces</th><th>Unsubs</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600 }}>{item.campaign_name || `Campaign #${item.campaign_id}`}</td>
                  <td>{(item.sent_count || 0).toLocaleString()}</td>
                  <td>{(item.open_count || 0).toLocaleString()}</td>
                  <td><span className="badge badge-success">{openRate(item)}</span></td>
                  <td>{(item.click_count || 0).toLocaleString()}</td>
                  <td><span className="badge badge-info">{clickRate(item)}</span></td>
                  <td>{item.bounce_count || 0}</td>
                  <td>{item.unsubscribe_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Analytics Details"
        footer={<><button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button><button className="btn btn-primary" onClick={openEdit}><FiEdit2 /> Edit</button><button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button></>}>
        {selectedItem && (
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Campaign</div><div className="detail-value">{selectedItem.campaign_name || `Campaign #${selectedItem.campaign_id}`}</div></div>
            <div className="detail-item"><div className="detail-label">Date</div><div className="detail-value">{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleDateString() : '-'}</div></div>
            <div className="detail-item"><div className="detail-label">Sent</div><div className="detail-value">{(selectedItem.sent_count || 0).toLocaleString()}</div></div>
            <div className="detail-item"><div className="detail-label">Opens</div><div className="detail-value">{(selectedItem.open_count || 0).toLocaleString()}</div></div>
            <div className="detail-item"><div className="detail-label">Open Rate</div><div className="detail-value"><span className="badge badge-success">{openRate(selectedItem)}</span></div></div>
            <div className="detail-item"><div className="detail-label">Clicks</div><div className="detail-value">{(selectedItem.click_count || 0).toLocaleString()}</div></div>
            <div className="detail-item"><div className="detail-label">Click Rate</div><div className="detail-value"><span className="badge badge-info">{clickRate(selectedItem)}</span></div></div>
            <div className="detail-item"><div className="detail-label">Bounces</div><div className="detail-value">{selectedItem.bounce_count || 0}</div></div>
            <div className="detail-item"><div className="detail-label">Unsubscribes</div><div className="detail-value">{selectedItem.unsubscribe_count || 0}</div></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Analytics Record"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}><FiPlus /> Create</button></>}>
        <div className="form-group"><label>Campaign ID</label><input className="form-control" name="campaign_id" value={form.campaign_id} onChange={handleChange} type="number" placeholder="Campaign ID" /></div>
        <div className="form-group"><label>Sent Count</label><input className="form-control" name="sent_count" value={form.sent_count} onChange={handleChange} type="number" placeholder="0" /></div>
        <div className="form-group"><label>Open Count</label><input className="form-control" name="open_count" value={form.open_count} onChange={handleChange} type="number" placeholder="0" /></div>
        <div className="form-group"><label>Click Count</label><input className="form-control" name="click_count" value={form.click_count} onChange={handleChange} type="number" placeholder="0" /></div>
        <div className="form-group"><label>Bounce Count</label><input className="form-control" name="bounce_count" value={form.bounce_count} onChange={handleChange} type="number" placeholder="0" /></div>
        <div className="form-group"><label>Unsubscribe Count</label><input className="form-control" name="unsubscribe_count" value={form.unsubscribe_count} onChange={handleChange} type="number" placeholder="0" /></div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Analytics Record"
        footer={<><button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button className="btn btn-success" onClick={handleUpdate}><FiEdit2 /> Save Changes</button></>}>
        <div className="form-group"><label>Campaign ID</label><input className="form-control" name="campaign_id" value={form.campaign_id} onChange={handleChange} type="number" /></div>
        <div className="form-group"><label>Sent Count</label><input className="form-control" name="sent_count" value={form.sent_count} onChange={handleChange} type="number" /></div>
        <div className="form-group"><label>Open Count</label><input className="form-control" name="open_count" value={form.open_count} onChange={handleChange} type="number" /></div>
        <div className="form-group"><label>Click Count</label><input className="form-control" name="click_count" value={form.click_count} onChange={handleChange} type="number" /></div>
        <div className="form-group"><label>Bounce Count</label><input className="form-control" name="bounce_count" value={form.bounce_count} onChange={handleChange} type="number" /></div>
        <div className="form-group"><label>Unsubscribe Count</label><input className="form-control" name="unsubscribe_count" value={form.unsubscribe_count} onChange={handleChange} type="number" /></div>
      </Modal>
    </div>
  );
}

export default Analytics;
