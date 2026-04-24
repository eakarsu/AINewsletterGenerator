import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';

const emptyForm = { name: '', email: '', status: 'active', subscribed_date: '', tags: '' };

function Subscribers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/subscribers');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
      await api.post('/subscribers', payload);
      toast.success('Subscriber added successfully');
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subscriber');
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = { ...form, tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()) : form.tags };
      await api.put(`/subscribers/${selectedItem.id || selectedItem._id}`, payload);
      toast.success('Subscriber updated successfully');
      setShowEdit(false);
      setShowDetail(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update subscriber');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) return;
    try {
      await api.delete(`/subscribers/${selectedItem.id || selectedItem._id}`);
      toast.success('Subscriber deleted successfully');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subscriber');
    }
  };

  const openDetail = (item) => { setSelectedItem(item); setShowDetail(true); };
  const openEdit = () => {
    const tags = Array.isArray(selectedItem.tags) ? selectedItem.tags.join(', ') : (selectedItem.tags || '');
    setForm({
      name: selectedItem.name || '',
      email: selectedItem.email || '',
      status: selectedItem.status || 'active',
      subscribed_date: selectedItem.subscribed_date || '',
      tags,
    });
    setShowDetail(false);
    setShowEdit(true);
  };
  const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };

  const getStatusBadge = (status) => {
    const map = { active: 'badge-success', unsubscribed: 'badge-danger', pending: 'badge-warning' };
    return <span className={`badge ${map[status] || 'badge-primary'}`}>{status || 'active'}</span>;
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading subscribers...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>Subscribers</h2><p>Manage your subscriber base and contacts</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Subscriber</button>
      </div>

      {items.length === 0 ? (
        <div className="table-container"><div className="empty-state"><FiUsers /><h3>No subscribers yet</h3><p>Add your first subscriber to get started</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Subscribed</th><th>Tags</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item._id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>{item.subscribed_date ? new Date(item.subscribed_date).toLocaleDateString() : '-'}</td>
                  <td>{Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '-')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Subscriber Details"
        footer={<><button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button><button className="btn btn-primary" onClick={openEdit}><FiEdit2 /> Edit</button><button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button></>}>
        {selectedItem && (
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{selectedItem.name}</div></div>
            <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{selectedItem.email}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value">{getStatusBadge(selectedItem.status)}</div></div>
            <div className="detail-item"><div className="detail-label">Subscribed Date</div><div className="detail-value">{selectedItem.subscribed_date ? new Date(selectedItem.subscribed_date).toLocaleDateString() : '-'}</div></div>
            <div className="detail-item detail-full"><div className="detail-label">Tags</div><div className="detail-value">{Array.isArray(selectedItem.tags) ? selectedItem.tags.join(', ') : (selectedItem.tags || '-')}</div></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Subscriber"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}><FiPlus /> Add</button></>}>
        <div className="form-group"><label>Name</label><input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Full name" /></div>
        <div className="form-group"><label>Email</label><input className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="Email address" type="email" /></div>
        <div className="form-group"><label>Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange}><option value="active">Active</option><option value="unsubscribed">Unsubscribed</option></select></div>
        <div className="form-group"><label>Subscribed Date</label><input className="form-control" name="subscribed_date" value={form.subscribed_date} onChange={handleChange} type="date" /></div>
        <div className="form-group"><label>Tags (comma separated)</label><input className="form-control" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. tech, vip, early-adopter" /></div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Subscriber"
        footer={<><button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button className="btn btn-success" onClick={handleUpdate}><FiEdit2 /> Save Changes</button></>}>
        <div className="form-group"><label>Name</label><input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Full name" /></div>
        <div className="form-group"><label>Email</label><input className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="Email address" type="email" /></div>
        <div className="form-group"><label>Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange}><option value="active">Active</option><option value="unsubscribed">Unsubscribed</option></select></div>
        <div className="form-group"><label>Subscribed Date</label><input className="form-control" name="subscribed_date" value={form.subscribed_date} onChange={handleChange} type="date" /></div>
        <div className="form-group"><label>Tags (comma separated)</label><input className="form-control" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. tech, vip, early-adopter" /></div>
      </Modal>
    </div>
  );
}

export default Subscribers;
