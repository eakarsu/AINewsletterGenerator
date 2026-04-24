import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';

const emptyForm = { campaign_id: '', send_at: '', timezone: 'UTC', recurrence: 'once', status: 'pending' };

function Schedules() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/schedules');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    try {
      const payload = {
        campaign_id: form.campaign_id ? parseInt(form.campaign_id, 10) : null,
        send_at: form.send_at || null,
        timezone: form.timezone,
        recurrence: form.recurrence,
        status: form.status,
      };
      await api.post('/schedules', payload);
      toast.success('Schedule created successfully');
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create schedule');
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        campaign_id: form.campaign_id ? parseInt(form.campaign_id, 10) : null,
        send_at: form.send_at || null,
        timezone: form.timezone,
        recurrence: form.recurrence,
        status: form.status,
      };
      await api.put(`/schedules/${selectedItem.id || selectedItem._id}`, payload);
      toast.success('Schedule updated successfully');
      setShowEdit(false);
      setShowDetail(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update schedule');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await api.delete(`/schedules/${selectedItem.id || selectedItem._id}`);
      toast.success('Schedule deleted successfully');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete schedule');
    }
  };

  const openDetail = (item) => { setSelectedItem(item); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      campaign_id: selectedItem.campaign_id != null ? String(selectedItem.campaign_id) : '',
      send_at: selectedItem.send_at ? selectedItem.send_at.slice(0, 16) : '',
      timezone: selectedItem.timezone || 'UTC',
      recurrence: selectedItem.recurrence || 'once',
      status: selectedItem.status || 'pending',
    });
    setShowDetail(false);
    setShowEdit(true);
  };
  const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-warning', active: 'badge-success', completed: 'badge-primary' };
    return <span className={`badge ${map[status] || 'badge-primary'}`}>{status || 'pending'}</span>;
  };

  const getRecurrenceBadge = (recurrence) => {
    return <span className="badge badge-info">{recurrence || 'once'}</span>;
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading schedules...</span></div>;
  }

  const formFields = (
    <>
      <div className="form-group"><label>Campaign ID</label><input className="form-control" name="campaign_id" value={form.campaign_id} onChange={handleChange} type="number" placeholder="Campaign ID" /></div>
      <div className="form-group"><label>Send At</label><input className="form-control" name="send_at" value={form.send_at} onChange={handleChange} type="datetime-local" /></div>
      <div className="form-group"><label>Timezone</label><input className="form-control" name="timezone" value={form.timezone} onChange={handleChange} placeholder="e.g. UTC, America/New_York" /></div>
      <div className="form-group"><label>Recurrence</label><select className="form-control" name="recurrence" value={form.recurrence} onChange={handleChange}><option value="once">Once</option><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option></select></div>
      <div className="form-group"><label>Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange}><option value="pending">Pending</option><option value="active">Active</option><option value="completed">Completed</option></select></div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div><h2>Schedules</h2><p>Schedule automated newsletter delivery</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Schedule</button>
      </div>

      {items.length === 0 ? (
        <div className="table-container"><div className="empty-state"><FiClock /><h3>No schedules yet</h3><p>Create your first schedule to get started</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Campaign ID</th><th>Send At</th><th>Timezone</th><th>Recurrence</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item._id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600 }}>{item.campaign_id != null ? item.campaign_id : '-'}</td>
                  <td>{item.send_at ? new Date(item.send_at).toLocaleString() : '-'}</td>
                  <td>{item.timezone || 'UTC'}</td>
                  <td>{getRecurrenceBadge(item.recurrence)}</td>
                  <td>{getStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Schedule Details"
        footer={<><button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button><button className="btn btn-primary" onClick={openEdit}><FiEdit2 /> Edit</button><button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button></>}>
        {selectedItem && (
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Campaign ID</div><div className="detail-value">{selectedItem.campaign_id != null ? selectedItem.campaign_id : '-'}</div></div>
            <div className="detail-item"><div className="detail-label">Send At</div><div className="detail-value">{selectedItem.send_at ? new Date(selectedItem.send_at).toLocaleString() : '-'}</div></div>
            <div className="detail-item"><div className="detail-label">Timezone</div><div className="detail-value">{selectedItem.timezone || 'UTC'}</div></div>
            <div className="detail-item"><div className="detail-label">Recurrence</div><div className="detail-value">{getRecurrenceBadge(selectedItem.recurrence)}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value">{getStatusBadge(selectedItem.status)}</div></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Schedule"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}><FiPlus /> Create</button></>}>
        {formFields}
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Schedule"
        footer={<><button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button className="btn btn-success" onClick={handleUpdate}><FiEdit2 /> Save Changes</button></>}>
        {formFields}
      </Modal>
    </div>
  );
}

export default Schedules;
