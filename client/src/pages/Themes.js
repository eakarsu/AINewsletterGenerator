import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiDroplet } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';

const emptyForm = { name: '', primary_color: '#3B82F6', secondary_color: '#1E40AF', font_family: 'Inter, sans-serif', header_style: '{}', footer_style: '{}' };

function Themes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/themes');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load themes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    try {
      let parsedHeader, parsedFooter;
      try { parsedHeader = JSON.parse(form.header_style); } catch { toast.error('Header Style must be valid JSON'); return; }
      try { parsedFooter = JSON.parse(form.footer_style); } catch { toast.error('Footer Style must be valid JSON'); return; }
      const payload = {
        name: form.name,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        font_family: form.font_family,
        header_style: JSON.stringify(parsedHeader),
        footer_style: JSON.stringify(parsedFooter),
      };
      await api.post('/themes', payload);
      toast.success('Theme created successfully');
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create theme');
    }
  };

  const handleUpdate = async () => {
    try {
      let parsedHeader, parsedFooter;
      try { parsedHeader = JSON.parse(form.header_style); } catch { toast.error('Header Style must be valid JSON'); return; }
      try { parsedFooter = JSON.parse(form.footer_style); } catch { toast.error('Footer Style must be valid JSON'); return; }
      const payload = {
        name: form.name,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        font_family: form.font_family,
        header_style: JSON.stringify(parsedHeader),
        footer_style: JSON.stringify(parsedFooter),
      };
      await api.put(`/themes/${selectedItem.id || selectedItem._id}`, payload);
      toast.success('Theme updated successfully');
      setShowEdit(false);
      setShowDetail(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update theme');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this theme?')) return;
    try {
      await api.delete(`/themes/${selectedItem.id || selectedItem._id}`);
      toast.success('Theme deleted successfully');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete theme');
    }
  };

  const openDetail = (item) => { setSelectedItem(item); setShowDetail(true); };
  const openEdit = () => {
    const headerVal = typeof selectedItem.header_style === 'string'
      ? selectedItem.header_style
      : JSON.stringify(selectedItem.header_style || {}, null, 2);
    const footerVal = typeof selectedItem.footer_style === 'string'
      ? selectedItem.footer_style
      : JSON.stringify(selectedItem.footer_style || {}, null, 2);
    setForm({
      name: selectedItem.name || '',
      primary_color: selectedItem.primary_color || '#3B82F6',
      secondary_color: selectedItem.secondary_color || '#1E40AF',
      font_family: selectedItem.font_family || 'Inter, sans-serif',
      header_style: headerVal,
      footer_style: footerVal,
    });
    setShowDetail(false);
    setShowEdit(true);
  };
  const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };

  const colorSwatch = (color) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 22, height: 22, borderRadius: 4, background: color || '#ccc', display: 'inline-block', border: '1px solid #e1e8ed' }}></span>
      {color || '-'}
    </span>
  );

  const formatJsonField = (value) => {
    if (!value) return '-';
    if (typeof value === 'string') {
      try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
    }
    return JSON.stringify(value, null, 2);
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading themes...</span></div>;
  }

  const formFields = (
    <>
      <div className="form-group"><label>Name</label><input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Theme name" /></div>
      <div className="form-group">
        <label>Primary Color</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input name="primary_color" value={form.primary_color} onChange={handleChange} type="color" style={{ width: 48, height: 42, padding: 2, border: '1px solid #e1e8ed', borderRadius: 6, cursor: 'pointer' }} />
          <input className="form-control" name="primary_color" value={form.primary_color} onChange={handleChange} placeholder="#3B82F6" style={{ flex: 1 }} />
        </div>
      </div>
      <div className="form-group">
        <label>Secondary Color</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input name="secondary_color" value={form.secondary_color} onChange={handleChange} type="color" style={{ width: 48, height: 42, padding: 2, border: '1px solid #e1e8ed', borderRadius: 6, cursor: 'pointer' }} />
          <input className="form-control" name="secondary_color" value={form.secondary_color} onChange={handleChange} placeholder="#1E40AF" style={{ flex: 1 }} />
        </div>
      </div>
      <div className="form-group"><label>Font Family</label><input className="form-control" name="font_family" value={form.font_family} onChange={handleChange} placeholder="e.g. Inter, sans-serif" /></div>
      <div className="form-group"><label>Header Style (JSON)</label><textarea className="form-control" name="header_style" value={form.header_style} onChange={handleChange} placeholder='{"backgroundColor":"#fff","padding":"20px"}' rows={4} style={{ fontFamily: 'monospace', fontSize: 13 }} /></div>
      <div className="form-group"><label>Footer Style (JSON)</label><textarea className="form-control" name="footer_style" value={form.footer_style} onChange={handleChange} placeholder='{"backgroundColor":"#f5f5f5","padding":"16px"}' rows={4} style={{ fontFamily: 'monospace', fontSize: 13 }} /></div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div><h2>Themes</h2><p>Customize newsletter visual themes</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Theme</button>
      </div>

      {items.length === 0 ? (
        <div className="table-container"><div className="empty-state"><FiDroplet /><h3>No themes yet</h3><p>Create your first theme to get started</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Primary Color</th><th>Secondary Color</th><th>Font Family</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item._id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{colorSwatch(item.primary_color)}</td>
                  <td>{colorSwatch(item.secondary_color)}</td>
                  <td>{item.font_family || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Theme Details"
        footer={<><button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button><button className="btn btn-primary" onClick={openEdit}><FiEdit2 /> Edit</button><button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button></>}>
        {selectedItem && (
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{selectedItem.name}</div></div>
            <div className="detail-item"><div className="detail-label">Font Family</div><div className="detail-value">{selectedItem.font_family || '-'}</div></div>
            <div className="detail-item">
              <div className="detail-label">Primary Color</div>
              <div className="detail-value">{colorSwatch(selectedItem.primary_color)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Secondary Color</div>
              <div className="detail-value">{colorSwatch(selectedItem.secondary_color)}</div>
            </div>
            <div className="detail-item detail-full">
              <div className="detail-label">Header Style</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, background: '#f8f9fa', padding: 12, borderRadius: 6 }}>{formatJsonField(selectedItem.header_style)}</div>
            </div>
            <div className="detail-item detail-full">
              <div className="detail-label">Footer Style</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, background: '#f8f9fa', padding: 12, borderRadius: 6 }}>{formatJsonField(selectedItem.footer_style)}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Theme"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}><FiPlus /> Create</button></>}>
        {formFields}
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Theme"
        footer={<><button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button className="btn btn-success" onClick={handleUpdate}><FiEdit2 /> Save Changes</button></>}>
        {formFields}
      </Modal>
    </div>
  );
}

export default Themes;
