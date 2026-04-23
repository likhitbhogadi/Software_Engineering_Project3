import React, { useState } from 'react';

const EVENT_LABELS = {
  MATERNAL_CARE:    { label: 'Maternal Care',    emoji: '🤰', color: '#f472b6' },
  IMMUNIZATION:     { label: 'Immunization',     emoji: '💉', color: '#60a5fa' },
  NEWBORN_CARE:     { label: 'Newborn Care',      emoji: '👶', color: '#34d399' },
  DISEASE_TRACKING: { label: 'Disease Tracking', emoji: '🩺', color: '#f87171' },
  GENERAL_CHECKUP:  { label: 'General Checkup',  emoji: '❤️', color: '#a78bfa' },
};

const FIELD_LABELS = {
  lmpDate: 'LMP Date',
  weight: 'Weight (kg)',
  bp: 'BP (mmHg)',
  riskFactors: 'Risk Factors',
  vaccineName: 'Vaccine Name',
  doseNumber: 'Dose Number',
  nextDueDate: 'Next Due Date',
  birthWeight: 'Birth Weight (kg)',
  deliveryMode: 'Delivery Mode',
  breastfeedingStatus: 'Breastfeeding Status',
  symptoms: 'Symptoms',
  duration: 'Duration',
  suspectedDisease: 'Suspected Disease',
  temperature: 'Temperature (°C)',
  heartRate: 'Heart Rate (bpm)',
  chiefComplaint: 'Chief Complaint',
  medications: 'Medications',
  notes: 'Notes',
};

function EventDataDisplay({ data, color }) {
  if (!data || typeof data !== 'object') return <div>No data available</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {Object.entries(data).map(([key, value]) => {
        if (!value) return null;
        const label = FIELD_LABELS[key] || key;
        return (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
            <span style={{ fontWeight: 600, color }}>{String(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * PatientCard - displays a patient's aggregated data for doctors.
 * @param {object} patient - full patient profile from Read Service
 */
export default function PatientCard({ patient }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!patient) return null;

  const events = patient.events || [];
  const lastUpdated = patient.lastUpdated
    ? new Date(patient.lastUpdated).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

  return (
    <div className="card fade-up" style={{ marginTop: 20 }}>
      {/* Patient Header */}
      <div style={styles.header}>
        <div style={styles.avatar}>
          {(patient.patientId || 'P').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              Patient ID:{' '}
              <span className="mono" style={{ color: 'var(--teal)' }}>
                {patient.patientId}
              </span>
            </h2>
            <span className="badge badge-info">
              {events.length} Event{events.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Last updated: {lastUpdated}
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Summary Stats */}
      <div style={styles.statsRow}>
        {Object.entries(EVENT_LABELS).map(([key, meta]) => {
          const count = events.filter((e) => e.eventType === key).length;
          return (
            <div key={key} style={styles.statBox}>
              <span style={{ fontSize: '1.1rem' }}>{meta.emoji}</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: meta.color }}>{count}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      <hr className="divider" />

      {/* Events Timeline */}
      <div>
        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Event History ({events.length})
        </h3>

        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No events recorded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...events]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((event, idx) => {
                const meta = EVENT_LABELS[event.eventType] || { label: event.eventType, emoji: '📋', color: 'var(--teal)' };
                const isOpen = expandedIndex === idx;
                const ts = event.timestamp
                  ? new Date(event.timestamp).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—';

                return (
                  <div
                    key={event.recordId || idx}
                    style={{
                      ...styles.eventRow,
                      borderLeft: `3px solid ${meta.color}`,
                    }}
                    onClick={() => setExpandedIndex(isOpen ? null : idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.1rem' }}>{meta.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{meta.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {ts}
                          {event.ashaId && (
                            <> · ASHA: <span className="mono">{event.ashaId}</span></>
                          )}
                        </div>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {isOpen ? '▲' : '▼'}
                      </span>
                    </div>

                    {isOpen && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                        {event.recordId && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                            Record ID: <span className="mono">{event.recordId}</span>
                          </div>
                        )}
                        <div
                          style={{
                            background: 'var(--navy)',
                            borderRadius: 8,
                            padding: '12px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <EventDataDisplay data={event.eventData} color={meta.color} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 4,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    background: 'var(--teal)',
    color: 'var(--navy)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    fontWeight: 800,
    flexShrink: 0,
  },
  statsRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  statBox: {
    flex: '1 1 80px',
    background: 'var(--navy)',
    borderRadius: 10,
    padding: '10px 6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  eventRow: {
    background: 'var(--navy)',
    borderRadius: 10,
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'background 180ms ease',
  },
};
