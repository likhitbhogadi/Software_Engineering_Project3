import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner">
          ⚠️ You are offline — data will be saved locally and synced when connection returns
        </div>
      )}

      {/* Top nav */}
      <nav className="topnav">
        <a className="topnav-logo" href="/">
          <span className="logo-icon">M</span>
          MediFlow
        </a>

        <div className="topnav-right">
          {user && (
            <>
              <span className="topnav-role">{user.role}</span>
              <span
                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'none' }}
                className="user-name-desktop"
              >
                {user.name}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
