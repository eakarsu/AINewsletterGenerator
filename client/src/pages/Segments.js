import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiFilter } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';

const emptyForm = { name: '', description: '', criteria: '{}' };

function Segments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/segments');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load segments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    try {
      let parsedCriteria;
      try { parsedCriteria = JSON.parse(form.criteria); } catch { toast.error('Criteria must be valid JSON'); return; }
      const payload = {
        name: form.name,
        description: form.description,
        criteria: JSON.stringify(parsedCriteria),
      };
      await api.post('/segments', payload);
      toast.success('Segment created successfully');
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create segment');
    }
  };

  const handleUpdate = async () => {
    try {
      let parsedCriteria;
      try { parsedCriteria = JSON.parse(form.criteria); } catch { toast.error('Criteria must be valid JSON'); return; }
      const payload = {
        name: form.name,
        description: form.description,
        criteria: JSON.stringify(parsedCriteria),
      };
      await api.put(`/segments/${selectedItem.id || selectedItem._id}`, payload);
      toast.success('Segment updated successfully');
      setShowEdit(false);
      setShowDetail(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update segment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this segment?')) return;
    try {
      await api.delete(`/segments/${selectedItem.id || selectedItem._id}`);
      toast.success('Segment deleted successfully');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete segment');
    }
  };

  const openDetail = (item) => { setSelectedItem(item); setShowDetail(true); };
  const openEdit = () => {
    const criteriaVal = typeof selectedItem.criteria === 'string'
      ? selectedItem.criteria
      : JSON.stringify(selectedItem.criteria || {}, null, 2);
    setForm({
      name: selectedItem.name || '',
      description: selectedItem.description || '',
      criteria: criteriaVal,
    });
    setShowDetail(false);
    setShowEdit(true);
  };
  const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };

  const formatCriteria = (criteria) => {
    if (!criteria) return '-';
    if (typeof criteria === 'string') {
      try { return JSON.stringify(JSON.parse(criteria), null, 2); } catch { return criteria; }
    }
    return JSON.stringify(criteria, null, 2);
  };

  const getCriteriaSummary = (criteria) => {
    if (!criteria) return '-';
    let obj = criteria;
    if (typeof criteria === 'string') {
      try { obj = JSON.parse(criteria); } catch { return criteria.substring(0, 40) + (criteria.length > 40 ? '...' : ''); }
    }
    const keys = Object.keys(obj);
    if (keys.length === 0) return 'No criteria';
    return keys.length + ' rule' + (keys.length !== 1 ? 's' : '');
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading segments...</span></div>;
  }

  const formFields = (
    <>
      <div className="form-group"><label>Name</label><input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Segment name" /></div>
      <div className="form-group"><label>Description</label><textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="Segment description" rows={3} /></div>
      <div className="form-group"><label>Criteria (JSON)</label><textarea className="form-control" name="criteria" value={form.criteria} onChange={handleChange} placeholder='{"age_gt": 25, "location": "US", "subscribed": true}' rows={6} style={{ fontFamily: 'monospace', fontSize: 13 }} /></div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div><h2>Segments</h2><p>Create targeted subscriber segments</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Segment</button>
      </div>

      {items.length === 0 ? (
        <div className="table-container"><div className="empty-state"><FiFilter /><h3>No segments yet</h3><p>Create your first segment to get started</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Description</th><th>Criteria</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item._id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.description ? item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '') : '-'}</td>
                  <td><span className="badge badge-info">{getCriteriaSummary(item.criteria)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Segment Details"
        footer={<><button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button><button className="btn btn-primary" onClick={openEdit}><FiEdit2 /> Edit</button><button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button></>}>
        {selectedItem && (
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{selectedItem.name}</div></div>
            <div className="detail-item detail-full"><div className="detail-label">Description</div><div className="detail-value">{selectedItem.description || '-'}</div></div>
            <div className="detail-item detail-full">
              <div className="detail-label">Criteria</div>
              <div className="detail-value" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, background: '#f8f9fa', padding: 12, borderRadius: 6 }}>{formatCriteria(selectedItem.criteria)}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Segment"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}><FiPlus /> Create</button></>}>
        {formFields}
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Segment"
        footer={<><button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button className="btn btn-success" onClick={handleUpdate}><FiEdit2 /> Save Changes</button></>}>
        {formFields}
      </Modal>
    </div>
  );
}

export default Segments;
