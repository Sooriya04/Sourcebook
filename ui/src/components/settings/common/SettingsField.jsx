import React from 'react';

export default function SettingsField({
  label,
  hint,
  error,
  required,
  children,
  className = ''
}) {
  return (
    <div className={`settings-field ${className}`}>
      {(label || hint) && (
        <div className="settings-field-header">
          {label && (
            <label className="settings-field-label">
              {label}
              {required && <span style={{ color: 'var(--status-error)' }}>*</span>}
            </label>
          )}
          {hint && <span className="settings-field-hint">{hint}</span>}
        </div>
      )}
      {children}
      {error && <span className="settings-field-error">{error}</span>}
    </div>
  );
}
