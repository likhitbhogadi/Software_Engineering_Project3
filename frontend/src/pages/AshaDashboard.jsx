import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import {
  saveRecordOffline,
  getUnsyncedRecords,
  getAllRecords,
  markAsSynced,
} from '../storage/offlineStorage.js';
import { uploadRecords } from '../services/syncService.js';
import RecordCard from '../components/RecordCard.jsx';
import SyncResultModal from '../components/SyncResultModal.jsx';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';

const EVENT_TYPES = [
  { value: 'MATERNAL_CARE',    label: '🤰 Maternal Care' },
  { value: 'IMMUNIZATION',     label: '💉 Immunization' },
  { value: 'NEWBORN_CARE',     label: '👶 Newborn Care' },
  { value: 'DISEASE_TRACKING', label: '🩺 Disease Tracking' },
  { value: 'GENERAL_CHECKUP',  label: '❤️ General Checkup' },
];

const EVENT_DATA_TEMPLATES = {
  MATERNAL_CARE:    { lmpDate: '', weight: '', bp: '', riskFactors: '', notes: '' },
  IMMUNIZATION:     { vaccineName: '', doseNumber: '', nextDueDate: '', notes: '' },
  NEWBORN_CARE:     { birthWeight: '', deliveryMode: '', breastfeedingStatus: '', notes: '' },
  DISEASE_TRACKING: { symptoms: '', duration: '', suspectedDisease: '', notes: '' },
  GENERAL_CHECKUP:  { temperature: '', heartRate: '', chiefComplaint: '', medications: '', notes: '' },
};

const BLANK_FORM = {
  patientId: '',
  eventType: 'MATERNAL_CARE',
  eventData: { ...EVENT_DATA_TEMPLATES.MATERNAL_CARE },
};

export default function AshaDashboard() {
  const { user, token } = useAuth();
  const isOnline = useOnlineStatus();

  const [form, setForm] = useState(BLANK_FORM);
  const [records, setRecords] = useState([]);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ type: '', text: '' });
  const [syncResults, setSyncResults] = useState(null);
  const [jsonError, setJsonError] = useState('');
  const [showAll, setShowAll] = useState(false);

  const loadRecords = useCallback(async () => {
    const all = await getAllRecords();
    // Sort newest first
    all.sort((a, b) => new Date(b.savedAt || b.timestamp) - new Date(a.savedAt || a.timestamp));
    setRecords(all);
    setUnsyncedCount(all.filter((r) => !r.synced).length);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const setEventData = (field) => (e) => {
    setForm((f) => ({
      ...f,
      eventData: { ...f.eventData, [field]: e.target.value },
    }));
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setForm((f) => ({
      ...f,
      eventType: newType,
      eventData: { ...EVENT_DATA_TEMPLATES[newType] },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveMsg({ type: '', text: '' });

    if (!form.patientId.trim()) {
      setSaveMsg({ type: 'error', text: 'Patient ID is required.' });
      return;
    }

    setSaving(true);
    try {
      const record = {
        recordId: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        patientId: form.patientId.trim(),
        ashaId: user?.id || user?.email || 'unknown',
        timestamp: new Date().toISOString(),
        eventType: form.eventType,
        eventData: form.eventData,
      };
      await saveRecordOffline(record);
      setSaveMsg({ type: 'success', text: `Record saved locally for patient ${record.patientId}.` });
      setForm(BLANK_FORM);
      await loadRecords();
    } catch (err) {
      setSaveMsg({ type: 'error', text: 'Failed to save record. ' + (err.message || '') });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!isOnline) {
      setSaveMsg({ type: 'warning', text: 'You are offline. Connect to the internet to sync.' });
      return;
    }

    const pending = await getUnsyncedRecords();
    if (pending.length === 0) {
      setSaveMsg({ type: 'info', text: 'No pending records to sync.' });
      return;
    }

    setSyncing(true);
    setSaveMsg({ type: '', text: '' });
    try {
      const response = await uploadRecords(pending, token);
      const results = response.results || response;

      // Mark successfully synced records locally
      const syncedIds = (results.synced || []).map((r) => r.recordId).filter(Boolean);
      if (syncedIds.length > 0) {
        await markAsSynced(syncedIds);
      }

      setSyncResults({ ...results, total: pending.length });
      await loadRecords();
    } catch (err) {
      setSaveMsg({
        type: 'error',
        text:
          err.response?.data?.message ||
          'Sync failed. Please try again when connected.',
      });
    } finally {
      setSyncing(false);
    }
  };

  const displayedRecords = showAll ? records : records.slice(0, 10);

  return (
    <div className="page">
      {/* Page heading */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={{ marginBottom: 2 }}>ASHA Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Welcome, <span style={{ color: 'var(--teal)' }}>{user?.name || user?.email}</span>
          </p>
        </div>
        <div style={styles.statusPill}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isOnline ? 'var(--green)' : 'var(--amber)',
              animation: isOnline ? 'none' : 'pulse-dot 1.5s ease infinite',
              flexShrink: 0,
            }}
          />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Pending banner */}
      {unsyncedCount > 0 && (
        <div className="alert alert-warning fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📦 {unsyncedCount} unsynced record{unsyncedCount !== 1 ? 's' : ''} pending</span>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--amber)', color: '#000', fontWeight: 700 }}
            onClick={handleSync}
            disabled={syncing || !isOnline}
          >
            {syncing ? <Spinner size={14} label="" /> : '↑ Sync Now'}
          </button>
        </div>
      )}

      <Alert type={saveMsg.type} message={saveMsg.text} onClose={() => setSaveMsg({ type: '', text: '' })} />

      {/* Data entry form */}
      <div className="card fade-up" style={{ marginTop: 4 }}>
        <h2 style={styles.sectionTitle}>📝 New Patient Record</h2>

        <form onSubmit={handleSave} noValidate>
          <div className="field">
            <label htmlFor="patientId">Patient ID</label>
            <input
              id="patientId"
              type="text"
              placeholder="e.g. PAT-2024-001"
              value={form.patientId}
              onChange={set('patientId')}
              required
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="eventType">Event Type</label>
            <select id="eventType" value={form.eventType} onChange={handleTypeChange}>
              {EVENT_TYPES.map((et) => (
                <option key={et.value} value={et.value}>
                  {et.label}
                </option>
              ))}
            </select>
          </div>

          <div className="fields-grid">
            {form.eventType === 'MATERNAL_CARE' && (
              <>
                <div className="field"><label>LMP Date</label><input type="date" value={form.eventData.lmpDate} onChange={setEventData('lmpDate')} /></div>
                <div className="field"><label>Weight (kg)</label><input type="number" placeholder="0.0" value={form.eventData.weight} onChange={setEventData('weight')} /></div>
                <div className="field"><label>BP (mmHg)</label><input type="text" placeholder="120/80" value={form.eventData.bp} onChange={setEventData('bp')} /></div>
                <div className="field"><label>Risk Factors</label><input type="text" placeholder="None" value={form.eventData.riskFactors} onChange={setEventData('riskFactors')} /></div>
              </>
            )}

            {form.eventType === 'IMMUNIZATION' && (
              <>
                <div className="field"><label>Vaccine Name</label><input type="text" placeholder="e.g. BCG" value={form.eventData.vaccineName} onChange={setEventData('vaccineName')} /></div>
                <div className="field"><label>Dose Number</label><input type="text" placeholder="1st dose" value={form.eventData.doseNumber} onChange={setEventData('doseNumber')} /></div>
                <div className="field"><label>Next Due Date</label><input type="date" value={form.eventData.nextDueDate} onChange={setEventData('nextDueDate')} /></div>
              </>
            )}

            {form.eventType === 'NEWBORN_CARE' && (
              <>
                <div className="field"><label>Birth Weight (kg)</label><input type="number" placeholder="0.0" value={form.eventData.birthWeight} onChange={setEventData('birthWeight')} /></div>
                <div className="field"><label>Delivery Mode</label><input type="text" placeholder="Normal / C-Section" value={form.eventData.deliveryMode} onChange={setEventData('deliveryMode')} /></div>
                <div className="field"><label>Breastfeeding Status</label><input type="text" placeholder="Started immediately?" value={form.eventData.breastfeedingStatus} onChange={setEventData('breastfeedingStatus')} /></div>
              </>
            )}

            {form.eventType === 'DISEASE_TRACKING' && (
              <>
                <div className="field"><label>Symptoms</label><input type="text" placeholder="Fever, cough..." value={form.eventData.symptoms} onChange={setEventData('symptoms')} /></div>
                <div className="field"><label>Duration</label><input type="text" placeholder="3 days" value={form.eventData.duration} onChange={setEventData('duration')} /></div>
                <div className="field" style={{ gridColumn: '1 / -1' }}><label>Suspected Disease</label><input type="text" placeholder="Malaria" value={form.eventData.suspectedDisease} onChange={setEventData('suspectedDisease')} /></div>
              </>
            )}

            {form.eventType === 'GENERAL_CHECKUP' && (
              <>
                <div className="field"><label>Temperature (°C)</label><input type="text" placeholder="37.0" value={form.eventData.temperature} onChange={setEventData('temperature')} /></div>
                <div className="field"><label>Heart Rate (bpm)</label><input type="text" placeholder="72" value={form.eventData.heartRate} onChange={setEventData('heartRate')} /></div>
                <div className="field"><label>Chief Complaint</label><input type="text" placeholder="Back pain" value={form.eventData.chiefComplaint} onChange={setEventData('chiefComplaint')} /></div>
                <div className="field"><label>Medications</label><input type="text" placeholder="Paracetamol" value={form.eventData.medications} onChange={setEventData('medications')} /></div>
              </>
            )}

            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Additional Notes</label>
              <textarea
                rows={2}
                placeholder="Any additional information..."
                value={form.eventData.notes}
                onChange={setEventData('notes')}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={saving}
            >
              {saving ? <Spinner size={15} label="" /> : '💾'}
              {saving ? 'Saving…' : 'Save Offline'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={handleSync}
              disabled={syncing || !isOnline || unsyncedCount === 0}
            >
              {syncing ? <Spinner size={15} label="" /> : '↑'}
              {syncing ? 'Syncing…' : `Sync Now${unsyncedCount > 0 ? ` (${unsyncedCount})` : ''}`}
            </button>
          </div>
        </form>
      </div>

      {/* Records list */}
      <div style={{ marginTop: 20 }}>
        <div style={styles.listHeader}>
          <h2 style={styles.sectionTitle}>
            📋 Local Records
            {records.length > 0 && (
              <span className="badge badge-info" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                {records.length}
              </span>
            )}
          </h2>
          {records.length > 10 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAll((p) => !p)}
            >
              {showAll ? 'Show less' : `Show all (${records.length})`}
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <p>No records yet. Fill the form above to add one.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayedRecords.map((record) => (
              <RecordCard key={record.recordId} record={record} />
            ))}
          </div>
        )}
      </div>

      {/* Sync Result Modal */}
      {syncResults && (
        <SyncResultModal
          results={syncResults}
          onClose={() => setSyncResults(null)}
        />
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
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
};
