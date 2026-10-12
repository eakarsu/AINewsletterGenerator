import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiLock } from 'react-icons/fi';
import api from '../api';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async (loginEmail, loginPassword) => {
    const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
    const token = res.data.token || res.data.accessToken || res.data.data?.token;
    if (!token) throw new Error('Login response did not include an access token');
    localStorage.setItem('token', token);
    toast.success('Login successful!');
    navigate('/dashboard');
  };

  const handleDemoLogin = async () => {
    const demoEmail = process.env.REACT_APP_DEMO_EMAIL;
    const demoPassword = process.env.REACT_APP_DEMO_PASSWORD;
    if (loading) return;
    if (!demoEmail || !demoPassword) {
      toast.error('Demo login is not configured for this environment.');
      return;
    }
    setLoading(true);
    try { await signIn(demoEmail, demoPassword); }
    catch (err) { toast.error(err.response?.data?.message || err.response?.data?.error || err.message || 'Demo login failed'); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading || !process.env.REACT_APP_DEMO_EMAIL || !process.env.REACT_APP_DEMO_PASSWORD}
            aria-label="Log In as Demo"
            style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Log In as Demo'}
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <><span className="spinner spinner-sm"></span> Signing in...</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
