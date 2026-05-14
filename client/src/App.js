import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Newsletters from './pages/Newsletters';
import Subscribers from './pages/Subscribers';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import Analytics from './pages/Analytics';
import Segments from './pages/Segments';
import ABTests from './pages/ABTests';
import Schedules from './pages/Schedules';
import Themes from './pages/Themes';
import DripCampaigns from './pages/DripCampaigns';
import AITools from './pages/AITools';
import AIHistory from './pages/AIHistory';
import AIOptimization from './pages/AIOptimization';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/newsletters" element={<ProtectedRoute><Newsletters /></ProtectedRoute>} />
        <Route path="/subscribers" element={<ProtectedRoute><Subscribers /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/segments" element={<ProtectedRoute><Segments /></ProtectedRoute>} />
        <Route path="/abtests" element={<ProtectedRoute><ABTests /></ProtectedRoute>} />
        <Route path="/schedules" element={<ProtectedRoute><Schedules /></ProtectedRoute>} />
        <Route path="/themes" element={<ProtectedRoute><Themes /></ProtectedRoute>} />
        <Route path="/drip-campaigns" element={<ProtectedRoute><DripCampaigns /></ProtectedRoute>} />
        <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
        <Route path="/ai-history" element={<ProtectedRoute><AIHistory /></ProtectedRoute>} />
        <Route path="/ai-optimization" element={<ProtectedRoute><AIOptimization /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
