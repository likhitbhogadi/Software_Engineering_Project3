import React, { useState } from 'react';

const EVENT_LABELS = {
  MATERNAL_CARE:    { label: 'Maternal Care',    emoji: '🤰' },
  IMMUNIZATION:     { label: 'Immunization',     emoji: '💉' },
  NEWBORN_CARE:     { label: 'Newborn Care',      emoji: '👶' },
  DISEASE_TRACKING: { label: 'Disease Tracking', emoji: '🩺' },
  GENERAL_CHECKUP:  { label: 'General Checkup',  emoji: '❤️' },
};

export default function RecordCard({ record }) {
  const [expanded, setExpanded] = useState(false);
  const meta = EVENT_LABELS[record.eventType] || { label: record.eventType, emoji: '📋' };

  const ts = record.timestamp
    ? new Date(record.timestamp).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

  return (
    <div
      className="card fade-up"
      style={{ padding: '14px 16px', cursor: 'pointer' }}
      onClick={() => setExpanded((p) => !p)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setExpanded((p) => !p)}
      aria-expanded={expanded}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.3rem' }}>{meta.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{meta.label}</span>
            <span
              className={`badge ${record.synced ? 'badge-synced' : 'badge-pending'}`}
            >
              {record.synced ? '✓ Synced' : '⏳ Pending'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Patient:{' '}
            <span className="mono" style={{ color: 'var(--teal)' }}>
              {record.patientId}
            </span>{' '}
            · {ts}
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Record ID: <span className="mono">{record.recordId}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            ASHA ID: <span className="mono">{record.ashaId}</span>
          </div>
          <pre
            style={{
              background: 'var(--navy)',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: '0.78rem',
              color: 'var(--teal)',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 180,
            }}
          >
            {JSON.stringify(record.eventData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
