import React from 'react';

/**
 * @param {'error'|'success'|'info'|'warning'} type
 * @param {string} message
 */
export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type} fade-up`} role="alert">
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            marginLeft: 'auto',
            padding: '0 4px',
            float: 'right',
            fontSize: '1rem',
            lineHeight: 1,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
