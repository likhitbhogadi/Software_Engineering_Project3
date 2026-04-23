import React from 'react';

export default function Spinner({ size = 18, label = 'Loading…' }) {
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      aria-label={label}
    >
      <span
        className="spinner"
        style={{ width: size, height: size }}
        role="status"
        aria-live="polite"
      />
      {label && (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </span>
  );
}
