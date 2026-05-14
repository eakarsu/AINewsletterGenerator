import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSend } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

const emptyForm = { name: '', newsletter_id: '', segment_id: '', status: 'draft', scheduled_at: '' };

function Campaigns() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchItems = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/campaigns', { params: { page: p, limit: 20 } });
      const data = res.data.data || (Array.isArray(res.data) ? res.data : []);
      setItems(data);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(page); }, [fetchItems, page]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    try {
      const payload = {
        name: form.name,
        newsletter_id: form.newsletter_id ? parseInt(form.newsletter_id, 10) : null,
        segment_id: form.segment_id ? parseInt(form.segment_id, 10) : null,
        status: form.status,
        scheduled_at: form.scheduled_at || null,
      };
      await api.post('/campaigns', payload);
      toast.success('Campaign created successfully');
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchItems(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        name: form.name,
        newsletter_id: form.newsletter_id ? parseInt(form.newsletter_id, 10) : null,
        segment_id: form.segment_id ? parseInt(form.segment_id, 10) : null,
        status: form.status,
        scheduled_at: form.scheduled_at || null,
      };
      await api.put(`/campaigns/${selectedItem.id || selectedItem._id}`, payload);
      toast.success('Campaign updated successfully');
      setShowEdit(false);
      setShowDetail(false);
      fetchItems(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update campaign');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${selectedItem.id || selectedItem._id}`);
      toast.success('Campaign deleted successfully');
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const openDetail = (item) => { setSelectedItem(item); setShowDetail(true); };
  const openEdit = () => {
    setForm({
      name: selectedItem.name || '',
      newsletter_id: selectedItem.newsletter_id != null ? String(selectedItem.newsletter_id) : '',
      segment_id: selectedItem.segment_id != null ? String(selectedItem.segment_id) : '',
      status: selectedItem.status || 'draft',
      scheduled_at: selectedItem.scheduled_at ? selectedItem.scheduled_at.slice(0, 16) : '',
    });
    setShowDetail(false);
    setShowEdit(true);
  };
  const openCreate = () => { setForm({ ...emptyForm }); setShowCreate(true); };

  const getStatusBadge = (status) => {
    const map = { draft: 'badge-warning', sent: 'badge-success', scheduled: 'badge-info', active: 'badge-success', completed: 'badge-primary' };
    return <span className={`badge ${map[status] || 'badge-primary'}`}>{status || 'draft'}</span>;
  };

  if (loading && items.length === 0) {
    return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading campaigns...</span></div>;
  }

  const formFields = (
    <>
      <div className="form-group"><label>Name</label><input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Campaign name" /></div>
      <div className="form-group"><label>Newsletter ID</label><input className="form-control" name="newsletter_id" value={form.newsletter_id} onChange={handleChange} type="number" placeholder="Newsletter ID" /></div>
      <div className="form-group"><label>Segment ID</label><input className="form-control" name="segment_id" value={form.segment_id} onChange={handleChange} type="number" placeholder="Segment ID" /></div>
      <div className="form-group"><label>Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="sent">Sent</option><option value="active">Active</option><option value="completed">Completed</option></select></div>
      <div className="form-group"><label>Scheduled At</label><input className="form-control" name="scheduled_at" value={form.scheduled_at} onChange={handleChange} type="datetime-local" /></div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div><h2>Campaigns</h2><p>Launch and track email campaigns ({pagination.total || 0} total)</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Campaign</button>
      </div>

      {items.length === 0 && !loading ? (
        <div className="table-container"><div className="empty-state"><FiSend /><h3>No campaigns yet</h3><p>Create your first campaign to get started</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Status</th><th>Scheduled At</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item._id} onClick={() => openDetail(item)}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>{item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Campaign Details"
        footer={<><button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button><button className="btn btn-primary" onClick={openEdit}><FiEdit2 /> Edit</button><button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button></>}>
        {selectedItem && (
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{selectedItem.name}</div></div>
            <div className="detail-item"><div className="detail-label">Newsletter ID</div><div className="detail-value">{selectedItem.newsletter_id != null ? selectedItem.newsletter_id : '-'}</div></div>
            <div className="detail-item"><div className="detail-label">Segment ID</div><div className="detail-value">{selectedItem.segment_id != null ? selectedItem.segment_id : '-'}</div></div>
            <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value">{getStatusBadge(selectedItem.status)}</div></div>
            <div className="detail-item"><div className="detail-label">Scheduled At</div><div className="detail-value">{selectedItem.scheduled_at ? new Date(selectedItem.scheduled_at).toLocaleString() : '-'}</div></div>
            <div className="detail-item detail-full">
              <div className="detail-label">Tracking Pixel</div>
              <div className="detail-value">
                <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                  {`<img src="http://localhost:3001/t/open/${selectedItem.id}.gif" width="1" height="1" style="display:none" />`}
                </code>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Campaign"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}><FiPlus /> Create</button></>}>
        {formFields}
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Campaign"
        footer={<><button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button className="btn btn-success" onClick={handleUpdate}><FiEdit2 /> Save Changes</button></>}>
        {formFields}
      </Modal>
    </div>
  );
}

export default Campaigns;
