import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiGitBranch, FiAward } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

const emptyForm = { name: '', variant_a: '', variant_b: '', status: 'draft', winner: '', start_date: '' };

function ABTests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [pickingWinner, setPickingWinner] = useState(false);

  const fetchItems = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/abtests', { params: { page: p, limit: 20 } });
      const data = res.data.data || (Array.isArray(res.data) ? res.data : []);
      setItems(data);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(page); }, [fetchItems, page]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    try {
      await api.post('/abtests', form);
      toast.success('A/B test created successfully');
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchItems(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create A/B test');
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/abtests/${selectedItem.id || selectedItem._id}`, form);
      toast.success('A/B test updated successfully');
      setShowEdit(false);
      setShowDetail(false);
      fetchItems(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update A/B test');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this A/B test?')) return;
    try {
      await api.delete(`/abtests/${selectedItem.id || selectedItem._id}`);
      toast.success('A/B test deleted successfully');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete A/B test');
    }
  };

  const handlePickWinner = async (item) => {
    const id = item.id || item._id;
    setPickingWinner(true);
    try {
      const res = await api.post(`/abtests/${id}/pick-winner`);
      toast.success(`Winner declared: Variant ${res.data.winner} — ${res.data.reason}`);
      // Update selectedItem if detail modal is open
      if (selectedItem && (selectedItem.id || selectedItem._id) === id) {
        setSelectedItem(res.data.abtest);
      }
      fetchItems(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to pick winner');
    } finally {
      setPickingWinner(false);
    }
  };

  const openDetail = (item) => { setSelectedItem(item); setShowDetail(true); };
  const openEdit = () => {
    setForm({ name: selectedItem.name || '', variant_a: selectedItem.variant_a || '', variant_b: selectedItem.variant_b || '', status: selectedItem.status || 'draft', winner: selectedItem.winner || '', start_date: selectedItem.start_date || '' });
    setShowDetail(false);
    setShowEdit(true);
  };
  const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };

  const getStatusBadge = (status) => {
    const map = { draft: 'badge-warning', running: 'badge-info', completed: 'badge-success', active: 'badge-info' };
    return <span className={`badge ${map[status] || 'badge-primary'}`}>{status || 'draft'}</span>;
  };

  if (loading && items.length === 0) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading A/B tests...</span></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>A/B Tests</h2><p>Run split tests to optimize content ({pagination.total || 0} total)</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New A/B Test</button>
      </div>

      {items.length === 0 && !loading ? (
        <div className="table-container"><div className="empty-state"><FiGitBranch /><h3>No A/B tests yet</h3><p>Create your first A/B test to get started</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Variant A</th><th>Variant B</th><th>Status</th><th>Winner</th><th>Start Date</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item._id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.variant_a ? item.variant_a.substring(0, 30) + (item.variant_a.length > 30 ? '...' : '') : '-'}</td>
                  <td>{item.variant_b ? item.variant_b.substring(0, 30) + (item.variant_b.length > 30 ? '...' : '') : '-'}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>{item.winner ? <span className="badge badge-success">Variant {item.winner}</span> : '-'}</td>
                  <td>{item.start_date ? new Date(item.start_date).toLocaleDateString() : '-'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {item.status !== 'completed' && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        disabled={pickingWinner}
                        onClick={() => handlePickWinner(item)}
                      >
                        <FiAward /> Pick Winner
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="A/B Test Details"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button>
            {selectedItem && selectedItem.status !== 'completed' && (
              <button
                className="btn btn-warning"
                disabled={pickingWinner}
                onClick={() => handlePickWinner(selectedItem)}
              >
                <FiAward /> {pickingWinner ? 'Picking...' : 'Pick Winner'}
              </button>
            )}
            <button className="btn btn-primary" onClick={openEdit}><FiEdit2 /> Edit</button>
            <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button>
          </>
        }>
        {selectedItem && (
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{selectedItem.name}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value">{getStatusBadge(selectedItem.status)}</div></div>
            <div className="detail-item detail-full"><div className="detail-label">Variant A</div><div className="detail-value">{selectedItem.variant_a || '-'}</div></div>
            <div className="detail-item detail-full"><div className="detail-label">Variant B</div><div className="detail-value">{selectedItem.variant_b || '-'}</div></div>
            <div className="detail-item"><div className="detail-label">Winner</div><div className="detail-value">{selectedItem.winner ? <span className="badge badge-success">Variant {selectedItem.winner}</span> : 'Pending'}</div></div>
            <div className="detail-item"><div className="detail-label">Start Date</div><div className="detail-value">{selectedItem.start_date ? new Date(selectedItem.start_date).toLocaleDateString() : '-'}</div></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create A/B Test"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}><FiPlus /> Create</button></>}>
        <div className="form-group"><label>Name</label><input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Test name" /></div>
        <div className="form-group"><label>Variant A</label><textarea className="form-control" name="variant_a" value={form.variant_a} onChange={handleChange} placeholder="Content for variant A" rows={3} /></div>
        <div className="form-group"><label>Variant B</label><textarea className="form-control" name="variant_b" value={form.variant_b} onChange={handleChange} placeholder="Content for variant B" rows={3} /></div>
        <div className="form-group"><label>Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange}><option value="draft">Draft</option><option value="running">Running</option><option value="completed">Completed</option></select></div>
        <div className="form-group"><label>Start Date</label><input className="form-control" name="start_date" value={form.start_date} onChange={handleChange} type="date" /></div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit A/B Test"
        footer={<><button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button className="btn btn-success" onClick={handleUpdate}><FiEdit2 /> Save Changes</button></>}>
        <div className="form-group"><label>Name</label><input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Test name" /></div>
        <div className="form-group"><label>Variant A</label><textarea className="form-control" name="variant_a" value={form.variant_a} onChange={handleChange} placeholder="Content for variant A" rows={3} /></div>
        <div className="form-group"><label>Variant B</label><textarea className="form-control" name="variant_b" value={form.variant_b} onChange={handleChange} placeholder="Content for variant B" rows={3} /></div>
        <div className="form-group"><label>Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange}><option value="draft">Draft</option><option value="running">Running</option><option value="completed">Completed</option></select></div>
        <div className="form-group"><label>Start Date</label><input className="form-control" name="start_date" value={form.start_date} onChange={handleChange} type="date" /></div>
      </Modal>
    </div>
  );
}

export default ABTests;
