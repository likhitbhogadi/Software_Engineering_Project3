import React from 'react';

export default function Spinner({ size = 18, label = 'Loading…' }) {
  return (
    <span
      role="status"
      aria-label={label || 'Loading'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
    >
      <span
        className="spinner"
        style={{ width: size, height: size }}
      />
      {label && (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </span>
  );
}
