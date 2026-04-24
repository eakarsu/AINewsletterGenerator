import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiZap } from 'react-icons/fi';
import api from '../api';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.token || res.data.accessToken || res.data.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        localStorage.setItem('token', 'demo-token');
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setEmail('demo@newsletter.com');
    setPassword('demo123');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">N</div>
          <h2>NewsletterAI</h2>
          <p>Sign in to your dashboard</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label><FiMail style={{ marginRight: 6, verticalAlign: 'middle' }} /> Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label><FiLock style={{ marginRight: 6, verticalAlign: 'middle' }} /> Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <><span className="spinner spinner-sm"></span> Signing in...</> : 'Sign In'}
          </button>
          <div className="divider">or</div>
          <button type="button" className="btn btn-secondary btn-lg" onClick={handleAutoFill}>
            <FiZap /> Auto Fill Demo Credentials
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
