import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';

const emptyForm = { title: '', subject: '', content: '', status: 'draft', category: '' };

function Newsletters() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/newsletters');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load newsletters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    try {
      await api.post('/newsletters', form);
      toast.success('Newsletter created successfully');
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create newsletter');
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/newsletters/${selectedItem.id || selectedItem._id}`, form);
      toast.success('Newsletter updated successfully');
      setShowEdit(false);
      setShowDetail(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update newsletter');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this newsletter?')) return;
    try {
      await api.delete(`/newsletters/${selectedItem.id || selectedItem._id}`);
      toast.success('Newsletter deleted successfully');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete newsletter');
    }
  };

  const openDetail = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const openEdit = () => {
    setForm({
      title: selectedItem.title || '',
      subject: selectedItem.subject || '',
      content: selectedItem.content || '',
      status: selectedItem.status || 'draft',
      category: selectedItem.category || '',
    });
    setShowDetail(false);
    setShowEdit(true);
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setShowCreate(true);
  };

  const getStatusBadge = (status) => {
    const map = { draft: 'badge-warning', published: 'badge-success', sent: 'badge-success', archived: 'badge-info' };
    return <span className={`badge ${map[status] || 'badge-primary'}`}>{status || 'draft'}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">Loading newsletters...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Newsletters</h2>
          <p>Create and manage your AI-powered newsletters</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> New Newsletter
        </button>
      </div>

      {items.length === 0 ? (
        <div className="table-container">
          <div className="empty-state">
            <FiFileText />
            <h3>No newsletters yet</h3>
            <p>Create your first newsletter to get started</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Category</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item._id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600 }}>{item.title}</td>
                  <td>{item.subject}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>{item.category || '-'}</td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Newsletter Details"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button>
            <button className="btn btn-primary" onClick={openEdit}><FiEdit2 /> Edit</button>
            <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button>
          </>
        }
      >
        {selectedItem && (
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Title</div>
              <div className="detail-value">{selectedItem.title}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Status</div>
              <div className="detail-value">{getStatusBadge(selectedItem.status)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Subject</div>
              <div className="detail-value">{selectedItem.subject || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Category</div>
              <div className="detail-value">{selectedItem.category || '-'}</div>
            </div>
            <div className="detail-item detail-full">
              <div className="detail-label">Content</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedItem.content || '-'}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Newsletter"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate}><FiPlus /> Create</button>
          </>
        }
      >
        <div className="form-group">
          <label>Title</label>
          <input className="form-control" name="title" value={form.title} onChange={handleChange} placeholder="Newsletter title" />
        </div>
        <div className="form-group">
          <label>Subject</label>
          <input className="form-control" name="subject" value={form.subject} onChange={handleChange} placeholder="Email subject line" />
        </div>
        <div className="form-group">
          <label>Category</label>
          <input className="form-control" name="category" value={form.category} onChange={handleChange} placeholder="e.g. Tech, Business" />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="form-control" name="status" value={form.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="form-group">
          <label>Content</label>
          <textarea className="form-control" name="content" value={form.content} onChange={handleChange} placeholder="Newsletter content..." rows={5} />
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Newsletter"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
            <button className="btn btn-success" onClick={handleUpdate}><FiEdit2 /> Save Changes</button>
          </>
        }
      >
        <div className="form-group">
          <label>Title</label>
          <input className="form-control" name="title" value={form.title} onChange={handleChange} placeholder="Newsletter title" />
        </div>
        <div className="form-group">
          <label>Subject</label>
          <input className="form-control" name="subject" value={form.subject} onChange={handleChange} placeholder="Email subject line" />
        </div>
        <div className="form-group">
          <label>Category</label>
          <input className="form-control" name="category" value={form.category} onChange={handleChange} placeholder="e.g. Tech, Business" />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="form-control" name="status" value={form.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="form-group">
          <label>Content</label>
          <textarea className="form-control" name="content" value={form.content} onChange={handleChange} placeholder="Newsletter content..." rows={5} />
        </div>
      </Modal>
    </div>
  );
}

export default Newsletters;
