import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiLayout } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';

const emptyForm = { name: '', subject: '', html_content: '', category: 'general' };

function Templates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/templates');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    try {
      await api.post('/templates', form);
      toast.success('Template created successfully');
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create template');
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/templates/${selectedItem.id || selectedItem._id}`, form);
      toast.success('Template updated successfully');
      setShowEdit(false);
      setShowDetail(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update template');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/templates/${selectedItem.id || selectedItem._id}`);
      toast.success('Template deleted successfully');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const openDetail = (item) => { setSelectedItem(item); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      name: selectedItem.name || '',
      subject: selectedItem.subject || '',
      html_content: selectedItem.html_content || '',
      category: selectedItem.category || 'general',
    });
    setShowDetail(false);
    setShowEdit(true);
  };
  const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading templates...</span></div>;
  }

  const formFields = (
    <>
      <div className="form-group"><label>Name</label><input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Template name" /></div>
      <div className="form-group"><label>Subject</label><input className="form-control" name="subject" value={form.subject} onChange={handleChange} placeholder="Email subject line" /></div>
      <div className="form-group"><label>Category</label><input className="form-control" name="category" value={form.category} onChange={handleChange} placeholder="e.g. general, welcome, promotional" /></div>
      <div className="form-group"><label>HTML Content</label><textarea className="form-control" name="html_content" value={form.html_content} onChange={handleChange} placeholder="Template HTML content" rows={8} style={{ fontFamily: 'monospace', fontSize: 13 }} /></div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div><h2>Templates</h2><p>Design reusable newsletter templates</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Template</button>
      </div>

      {items.length === 0 ? (
        <div className="table-container"><div className="empty-state"><FiLayout /><h3>No templates yet</h3><p>Create your first template to get started</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Subject</th><th>Category</th><th>Created</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item._id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.subject ? item.subject.substring(0, 60) + (item.subject.length > 60 ? '...' : '') : '-'}</td>
                  <td><span className="badge badge-primary">{item.category || '-'}</span></td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Template Details"
        footer={<><button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button><button className="btn btn-primary" onClick={openEdit}><FiEdit2 /> Edit</button><button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button></>}>
        {selectedItem && (
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{selectedItem.name}</div></div>
            <div className="detail-item"><div className="detail-label">Subject</div><div className="detail-value">{selectedItem.subject || '-'}</div></div>
            <div className="detail-item"><div className="detail-label">Category</div><div className="detail-value">{selectedItem.category || '-'}</div></div>
            <div className="detail-item detail-full"><div className="detail-label">HTML Content</div><div className="detail-value" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, maxHeight: 300, overflow: 'auto', background: '#f8f9fa', padding: 12, borderRadius: 6 }}>{selectedItem.html_content || '-'}</div></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Template"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}><FiPlus /> Create</button></>}>
        {formFields}
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Template"
        footer={<><button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button className="btn btn-success" onClick={handleUpdate}><FiEdit2 /> Save Changes</button></>}>
        {formFields}
      </Modal>
    </div>
  );
}

export default Templates;
