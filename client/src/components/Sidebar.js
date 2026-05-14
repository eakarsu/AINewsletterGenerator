import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiFileText, FiUsers, FiSend, FiLayout, FiBarChart2,
  FiFilter, FiGitBranch, FiClock, FiDroplet, FiZap, FiCpu, FiLogOut, FiList, FiTrendingUp
} from 'react-icons/fi';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FiHome },
  { path: '/newsletters', label: 'Newsletters', icon: FiFileText },
  { path: '/subscribers', label: 'Subscribers', icon: FiUsers },
  { path: '/campaigns', label: 'Campaigns', icon: FiSend },
  { path: '/templates', label: 'Templates', icon: FiLayout },
  { path: '/analytics', label: 'Analytics', icon: FiBarChart2 },
  { path: '/segments', label: 'Segments', icon: FiFilter },
  { path: '/abtests', label: 'A/B Tests', icon: FiGitBranch },
  { path: '/schedules', label: 'Schedules', icon: FiClock },
  { path: '/themes', label: 'Themes', icon: FiDroplet },
  { path: '/drip-campaigns', label: 'Drip Campaigns', icon: FiZap },
  { path: '/ai-tools', label: 'AI Tools', icon: FiCpu },
  { path: '/ai-optimization', label: 'AI Optimization', icon: FiTrendingUp },
  { path: '/ai-history', label: 'AI History', icon: FiList },
];

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">N</div>
        <h1>NewsletterAI</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <item.icon />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout}>
          <FiLogOut />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
