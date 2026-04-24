import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText, FiUsers, FiSend, FiLayout, FiBarChart2,
  FiFilter, FiGitBranch, FiClock, FiDroplet, FiZap, FiCpu
} from 'react-icons/fi';
import api from '../api';

const features = [
  { path: '/newsletters', label: 'Newsletters', icon: FiFileText, color: '#6c63ff', bg: 'rgba(108,99,255,0.1)', desc: 'Create and manage AI-powered newsletters', endpoint: '/newsletters' },
  { path: '/subscribers', label: 'Subscribers', icon: FiUsers, color: '#00b894', bg: 'rgba(0,184,148,0.1)', desc: 'Manage your subscriber base and contacts', endpoint: '/subscribers' },
  { path: '/campaigns', label: 'Campaigns', icon: FiSend, color: '#e17055', bg: 'rgba(225,112,85,0.1)', desc: 'Launch and track email campaigns', endpoint: '/campaigns' },
  { path: '/templates', label: 'Templates', icon: FiLayout, color: '#0984e3', bg: 'rgba(9,132,227,0.1)', desc: 'Design reusable newsletter templates', endpoint: '/templates' },
  { path: '/analytics', label: 'Analytics', icon: FiBarChart2, color: '#fdcb6e', bg: 'rgba(253,203,110,0.2)', desc: 'Track performance metrics and insights', endpoint: '/analytics' },
  { path: '/segments', label: 'Segments', icon: FiFilter, color: '#a29bfe', bg: 'rgba(162,155,254,0.1)', desc: 'Create targeted subscriber segments', endpoint: '/segments' },
  { path: '/abtests', label: 'A/B Tests', icon: FiGitBranch, color: '#fd79a8', bg: 'rgba(253,121,168,0.1)', desc: 'Run split tests to optimize content', endpoint: '/abtests' },
  { path: '/schedules', label: 'Schedules', icon: FiClock, color: '#00cec9', bg: 'rgba(0,206,201,0.1)', desc: 'Schedule automated newsletter delivery', endpoint: '/schedules' },
  { path: '/themes', label: 'Themes', icon: FiDroplet, color: '#e84393', bg: 'rgba(232,67,147,0.1)', desc: 'Customize newsletter visual themes', endpoint: '/themes' },
  { path: '/drip-campaigns', label: 'Drip Campaigns', icon: FiZap, color: '#f39c12', bg: 'rgba(243,156,18,0.1)', desc: 'Set up automated email sequences', endpoint: '/drip-campaigns' },
  { path: '/ai-tools', label: 'AI Tools', icon: FiCpu, color: '#6c63ff', bg: 'rgba(108,99,255,0.1)', desc: 'AI-powered content generation tools', endpoint: null },
];

function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      const endpoints = features.filter(f => f.endpoint).map(f => f.endpoint);
      const results = {};
      await Promise.allSettled(
        endpoints.map(async (ep) => {
          try {
            const res = await api.get(ep);
            const data = res.data;
            const items = Array.isArray(data) ? data : (data.data || data.items || []);
            results[ep] = Array.isArray(items) ? items.length : 0;
          } catch {
            results[ep] = 0;
          }
        })
      );
      setCounts(results);
      setLoading(false);
    };
    fetchCounts();
  }, []);

  const totalNewsletters = counts['/newsletters'] || 0;
  const totalSubscribers = counts['/subscribers'] || 0;
  const totalCampaigns = counts['/campaigns'] || 0;
  const totalTemplates = counts['/templates'] || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back! Here's an overview of your newsletter platform.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.1)', color: '#6c63ff' }}>
            <FiFileText />
          </div>
          <div className="stat-value">{loading ? '-' : totalNewsletters}</div>
          <div className="stat-label">Newsletters</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,184,148,0.1)', color: '#00b894' }}>
            <FiUsers />
          </div>
          <div className="stat-value">{loading ? '-' : totalSubscribers}</div>
          <div className="stat-label">Subscribers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(225,112,85,0.1)', color: '#e17055' }}>
            <FiSend />
          </div>
          <div className="stat-value">{loading ? '-' : totalCampaigns}</div>
          <div className="stat-label">Campaigns</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(9,132,227,0.1)', color: '#0984e3' }}>
            <FiLayout />
          </div>
          <div className="stat-value">{loading ? '-' : totalTemplates}</div>
          <div className="stat-label">Templates</div>
        </div>
      </div>

      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#2d3436' }}>Features</h3>
      <div className="feature-grid">
        {features.map((f) => (
          <div
            key={f.path}
            className="feature-card"
            onClick={() => navigate(f.path)}
          >
            <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
              <f.icon />
            </div>
            <h3>{f.label}</h3>
            <p>{f.desc}</p>
            {f.endpoint && (
              <span className="feature-count">
                {loading ? '...' : `${counts[f.endpoint] || 0} items`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
