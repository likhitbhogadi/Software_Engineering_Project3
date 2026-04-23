import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { loginUser } from '../services/authService.js';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ASHA' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'DOCTOR' ? '/doctor' : '/asha');
    }
  }, [user, navigate]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (tab === 'login') {
        data = await loginUser(form.email, form.password);
      } else {
        const { registerUser } = await import('../services/authService.js');
        data = await registerUser(form.name, form.email, form.password, form.role);
      }
      login(data.user, data.token);
      navigate(data.user.role === 'DOCTOR' ? '/doctor' : '/asha');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (navigator.onLine ? 'Something went wrong. Please try again.' : 'You are offline. Cannot login.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* Background decoration */}
      <div style={styles.bgDecor} aria-hidden="true" />

      <div style={styles.wrapper}>
        {/* Logo */}
        <div style={styles.logoBlock}>
          <div style={styles.logoIcon}>M</div>
          <h1 style={styles.logoText}>MediFlow</h1>
          <p style={styles.logoSub}>Offline-First Patient Data System</p>
        </div>

        {/* Card */}
        <div className="card fade-up" style={styles.card}>
          {/* Tabs */}
          <div style={styles.tabs}>
            {['login', 'register'].map((t) => (
              <button
                key={t}
                style={{
                  ...styles.tab,
                  ...(tab === t ? styles.tabActive : {}),
                }}
                onClick={() => { setTab(t); setError(''); }}
                type="button"
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <Alert type="error" message={error} onClose={() => setError('')} />

            {tab === 'register' && (
              <div className="field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Priya Sharma"
                  value={form.name}
                  onChange={set('name')}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {tab === 'register' && (
              <div className="field">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={form.role}
                  onChange={set('role')}
                  required
                >
                  <option value="ASHA">ASHA Worker</option>
                  <option value="DOCTOR">Doctor / Medical Officer</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 6 }}
            >
              {loading ? <Spinner size={16} label="" /> : null}
              {loading
                ? tab === 'login' ? 'Signing in…' : 'Registering…'
                : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p style={styles.switchText}>
            {tab === 'login' ? "Don't have an account? " : 'Already registered? '}
            <button
              type="button"
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
              style={styles.switchBtn}
            >
              {tab === 'login' ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Demo hint */}
        <div style={styles.hint}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Demo: Register as ASHA Worker or Doctor to get started
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgDecor: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,212,191,0.08) 0%, transparent 70%),' +
      'radial-gradient(ellipse 40% 30% at 80% 80%, rgba(15,39,68,0.6) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  wrapper: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
    zIndex: 1,
  },
  logoBlock: {
    textAlign: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    width: 52,
    height: 52,
    background: 'var(--teal)',
    color: 'var(--navy)',
    borderRadius: 14,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.6rem',
    fontWeight: 800,
    marginBottom: 12,
    boxShadow: '0 4px 20px rgba(45,212,191,0.3)',
  },
  logoText: {
    fontSize: '1.7rem',
    fontWeight: 700,
    marginBottom: 4,
  },
  logoSub: {
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
  },
  card: {
    padding: '28px 24px',
  },
  tabs: {
    display: 'flex',
    background: 'var(--navy)',
    borderRadius: 8,
    padding: 3,
    marginBottom: 22,
    gap: 2,
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    fontWeight: 600,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 180ms ease',
  },
  tabActive: {
    background: 'var(--navy-card)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  switchText: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--teal)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: '0.82rem',
    fontWeight: 600,
    padding: 0,
    textDecoration: 'underline',
  },
  hint: {
    textAlign: 'center',
    marginTop: 18,
  },
};
