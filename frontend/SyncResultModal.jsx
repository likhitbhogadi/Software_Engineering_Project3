import React from 'react';

/**
 * @param {object} results - { total, synced, skipped, failed }
 * @param {function} onClose
 */
export default function SyncResultModal({ results, onClose }) {
  if (!results) return null;

  const { total, synced = [], skipped = [], failed = [] } = results;

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Sync Results">
      <div
        className="card fade-up"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Sync Results</h3>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">×</button>
        </div>

        <hr className="divider" />

        {/* Summary row */}
        <div style={styles.summary}>
          <StatBox label="Total" value={total} color="var(--teal)" />
          <StatBox label="Synced" value={synced.length} color="var(--green)" />
          <StatBox label="Skipped" value={skipped.length} color="var(--amber)" />
          <StatBox label="Failed" value={failed.length} color="var(--red)" />
        </div>

        {/* Synced list */}
        {synced.length > 0 && (
          <Section
            title="✅ Successfully Synced"
            items={synced}
            color="var(--green)"
            keyField="recordId"
          />
        )}

        {/* Skipped list */}
        {skipped.length > 0 && (
          <Section
            title="⏭ Already Synced (Skipped)"
            items={skipped}
            color="var(--amber)"
            keyField="recordId"
            reasonField="reason"
          />
        )}

        {/* Failed list */}
        {failed.length > 0 && (
          <Section
            title="❌ Failed"
            items={failed}
            color="var(--red)"
            keyField="recordId"
            reasonField="reason"
          />
        )}

        <button className="btn btn-primary btn-full" onClick={onClose} style={{ marginTop: 16 }}>
          Done
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}

function Section({ title, items, color, keyField, reasonField }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color, marginBottom: 6 }}>{title}</div>
      <div
        style={{
          background: 'var(--navy)',
          borderRadius: 8,
          padding: '8px 12px',
          maxHeight: 120,
          overflowY: 'auto',
        }}
      >
        {items.map((item, i) => (
          <div
            key={item[keyField] || i}
            style={{
              fontSize: '0.76rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              padding: '3px 0',
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span style={{ color }}>{item[keyField]}</span>
            {reasonField && item[reasonField] && (
              <span style={{ color: 'var(--text-muted)' }}> — {item[reasonField]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 200,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85dvh',
    overflowY: 'auto',
    padding: '22px 20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '1.4rem',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 4px',
  },
  summary: {
    display: 'flex',
    gap: 8,
    background: 'var(--navy)',
    borderRadius: 10,
    padding: '14px 8px',
    marginBottom: 6,
  },
};
