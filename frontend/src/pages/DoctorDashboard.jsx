import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { getPatient, listPatients } from '../services/patientService.js';
import PatientCard from '../components/PatientCard.jsx';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';

export default function DoctorDashboard() {
  const { user, token } = useAuth();
  const isOnline = useOnlineStatus();

  const [patientId, setPatientId] = useState('');
  const [patient, setPatient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [recentPatients, setRecentPatients] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Load recent patients list on mount
  const loadRecentPatients = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingRecent(true);
      const data = await listPatients(token, 1, 10);
      setRecentPatients(data.patients || data.data || []);
    } catch {
      // Silently fail — recent list is supplementary
      setRecentPatients([]);
    } finally {
      setLoadingRecent(false);
    }
  }, [token]);

  useEffect(() => {
    loadRecentPatients();
  }, [loadRecentPatients]);

  const handleSearch = async (e, overrideId) => {
    if (e) e.preventDefault();
    const id = (overrideId || patientId).trim();
    if (!id) {
      setError('Please enter a Patient ID.');
      return;
    }
    if (!isOnline) {
      setError('You are offline. Patient search requires an internet connection.');
      return;
    }

    setError('');
    setPatient(null);
    setSearching(true);
    try {
      const data = await getPatient(id, token);
      setPatient(data.patient || data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No patient found with ID "${id}".`);
      } else {
        setError(
          err.response?.data?.message ||
          'Failed to fetch patient data. Please try again.'
        );
      }
    } finally {
      setSearching(false);
    }
  };

  const handleRecentClick = (pid) => {
    setPatientId(pid);
    handleSearch(null, pid);
  };

  return (
    <div className="page page-wide">
      {/* Page heading */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={{ marginBottom: 2 }}>Doctor Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Welcome, Dr. <span style={{ color: 'var(--teal)' }}>{user?.name || user?.email}</span>
          </p>
        </div>
        <div style={styles.statusPill}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isOnline ? 'var(--green)' : 'var(--amber)',
              flexShrink: 0,
            }}
          />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Search form */}
      <div className="card fade-up">
        <h2 style={styles.sectionTitle}>🔍 Search Patient</h2>
        <form onSubmit={handleSearch} noValidate className="search-form">
          <input
            id="patientIdSearch"
            type="text"
            placeholder="Enter Patient ID (e.g. PAT-2024-001)"
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              setError('');
              if (!e.target.value) setPatient(null);
            }}
            style={{ flex: 1 }}
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={searching || !patientId.trim()}
            style={{ flexShrink: 0 }}
          >
            {searching ? <Spinner size={16} label="" /> : '🔍'}
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>

        <Alert type="error" message={error} onClose={() => setError('')} />
      </div>

      {/* Patient result */}
      {searching && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Spinner size={28} label="Fetching patient data…" />
        </div>
      )}

      {patient && !searching && <PatientCard patient={patient} />}

      {/* Recent patients list */}
      {!patient && !searching && (
        <div style={{ marginTop: 20 }}>
          <h2 style={styles.sectionTitle}>🕐 Recent Patients</h2>

          {loadingRecent ? (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <Spinner size={20} label="Loading recent patients…" />
            </div>
          ) : recentPatients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>No patient records found in the system yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentPatients.map((p) => {
                const pid = p.patientId || p._id || p.id;
                const evCount = (p.events || p.eventCount || 0);
                const lastTs = p.lastUpdated
                  ? new Date(p.lastUpdated).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                  : '—';

                return (
                  <div
                    key={pid}
                    className="card fade-up"
                    style={{ padding: '14px 16px', cursor: 'pointer' }}
                    onClick={() => handleRecentClick(pid)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleRecentClick(pid)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={styles.miniAvatar}>
                        {String(pid).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          <span className="mono" style={{ color: 'var(--teal)' }}>{pid}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {typeof evCount === 'number'
                            ? `${evCount} event${evCount !== 1 ? 's' : ''}`
                            : Array.isArray(p.events)
                              ? `${p.events.length} event${p.events.length !== 1 ? 's' : ''}`
                              : 'Events available'}
                          {' '} · Last updated: {lastTs}
                        </div>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--navy-card)',
    border: '1px solid var(--border)',
    borderRadius: 999,
    padding: '5px 12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    flexShrink: 0,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    marginBottom: 14,
    color: 'var(--text-primary)',
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'var(--navy)',
    border: '1px solid var(--border)',
    color: 'var(--teal)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 700,
    flexShrink: 0,
  },
};
