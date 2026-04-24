import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiZap } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';

const emptyForm = { name: '', description: '', trigger_event: 'signup', delay_days: '1', steps: '[]', status: 'draft' };

function DripCampaigns() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/drip-campaigns');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load drip campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    try {
      let parsedSteps;
      try {
        parsedSteps = JSON.parse(form.steps);
      } catch {
        toast.error('Steps must be valid JSON');
        return;
      }
      const payload = {
        name: form.name,
        description: form.description,
        trigger_event: form.trigger_event,
        delay_days: form.delay_days ? parseInt(form.delay_days, 10) : 1,
        steps: JSON.stringify(parsedSteps),
        status: form.status,
      };
      await api.post('/drip-campaigns', payload);
      toast.success('Drip campaign created successfully');
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create drip campaign');
    }
  };

  const handleUpdate = async () => {
    try {
      let parsedSteps;
      try {
        parsedSteps = JSON.parse(form.steps);
      } catch {
        toast.error('Steps must be valid JSON');
        return;
      }
      const payload = {
        name: form.name,
        description: form.description,
        trigger_event: form.trigger_event,
        delay_days: form.delay_days ? parseInt(form.delay_days, 10) : 1,
        steps: JSON.stringify(parsedSteps),
        status: form.status,
      };
      await api.put(`/drip-campaigns/${selectedItem.id || selectedItem._id}`, payload);
      toast.success('Drip campaign updated successfully');
      setShowEdit(false);
      setShowDetail(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update drip campaign');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this drip campaign?')) return;
    try {
      await api.delete(`/drip-campaigns/${selectedItem.id || selectedItem._id}`);
      toast.success('Drip campaign deleted successfully');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete drip campaign');
    }
  };

  const openDetail = (item) => { setSelectedItem(item); setShowDetail(true); };
  const openEdit = () => {
    const stepsValue = typeof selectedItem.steps === 'string'
      ? selectedItem.steps
      : JSON.stringify(selectedItem.steps || [], null, 2);
    setForm({
      name: selectedItem.name || '',
      description: selectedItem.description || '',
      trigger_event: selectedItem.trigger_event || 'signup',
      delay_days: selectedItem.delay_days != null ? String(selectedItem.delay_days) : '1',
      steps: stepsValue,
      status: selectedItem.status || 'draft',
    });
    setShowDetail(false);
    setShowEdit(true);
  };
  const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };

  const getStatusBadge = (status) => {
    const map = { draft: 'badge-warning', active: 'badge-success' };
    return <span className={`badge ${map[status] || 'badge-primary'}`}>{status || 'draft'}</span>;
  };

  const formatSteps = (steps) => {
    let arr = steps;
    if (typeof steps === 'string') {
      try { arr = JSON.parse(steps); } catch { return steps || '-'; }
    }
    if (!Array.isArray(arr) || arr.length === 0) return 'No steps defined';
    return (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {arr.map((step, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {typeof step === 'object' ? (
              <span>{step.name || step.subject || step.action || `Step ${i + 1}`}{step.delay ? ` (delay: ${step.delay})` : ''}</span>
            ) : (
              <span>{String(step)}</span>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const getStepsCount = (steps) => {
    let arr = steps;
    if (typeof steps === 'string') {
      try { arr = JSON.parse(steps); } catch { return 0; }
    }
    return Array.isArray(arr) ? arr.length : 0;
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading drip campaigns...</span></div>;
  }

  const formFields = (
    <>
      <div className="form-group"><label>Name</label><input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Campaign name" /></div>
      <div className="form-group"><label>Description</label><textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="Campaign description" rows={3} /></div>
      <div className="form-group"><label>Trigger Event</label><input className="form-control" name="trigger_event" value={form.trigger_event} onChange={handleChange} placeholder="e.g. signup, purchase, abandoned_cart" /></div>
      <div className="form-group"><label>Delay Days</label><input className="form-control" name="delay_days" value={form.delay_days} onChange={handleChange} type="number" min="0" placeholder="Days between steps" /></div>
      <div className="form-group"><label>Steps (JSON Array)</label><textarea className="form-control" name="steps" value={form.steps} onChange={handleChange} placeholder='[{"name":"Welcome Email","delay":"0d"},{"name":"Follow Up","delay":"3d"}]' rows={6} style={{ fontFamily: 'monospace', fontSize: 13 }} /></div>
      <div className="form-group"><label>Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange}><option value="draft">Draft</option><option value="active">Active</option></select></div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div><h2>Drip Campaigns</h2><p>Set up automated email sequences</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Drip Campaign</button>
      </div>

      {items.length === 0 ? (
        <div className="table-container"><div className="empty-state"><FiZap /><h3>No drip campaigns yet</h3><p>Create your first drip campaign to get started</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Trigger Event</th><th>Delay Days</th><th>Steps</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item._id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.trigger_event || '-'}</td>
                  <td>{item.delay_days != null ? item.delay_days : '-'}</td>
                  <td><span className="badge badge-info">{getStepsCount(item.steps)} steps</span></td>
                  <td>{getStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Drip Campaign Details"
        footer={<><button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button><button className="btn btn-primary" onClick={openEdit}><FiEdit2 /> Edit</button><button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button></>}>
        {selectedItem && (
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{selectedItem.name}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value">{getStatusBadge(selectedItem.status)}</div></div>
            <div className="detail-item"><div className="detail-label">Trigger Event</div><div className="detail-value">{selectedItem.trigger_event || '-'}</div></div>
            <div className="detail-item"><div className="detail-label">Delay Days</div><div className="detail-value">{selectedItem.delay_days != null ? selectedItem.delay_days : '-'}</div></div>
            <div className="detail-item detail-full"><div className="detail-label">Description</div><div className="detail-value">{selectedItem.description || '-'}</div></div>
            <div className="detail-item detail-full"><div className="detail-label">Steps</div><div className="detail-value">{formatSteps(selectedItem.steps)}</div></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Drip Campaign"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}><FiPlus /> Create</button></>}>
        {formFields}
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Drip Campaign"
        footer={<><button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button className="btn btn-success" onClick={handleUpdate}><FiEdit2 /> Save Changes</button></>}>
        {formFields}
      </Modal>
    </div>
  );
}

export default DripCampaigns;
