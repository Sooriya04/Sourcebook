import React from 'react';
import Spinner from '../../ui/Spinner';

export default function SettingsActionBtn({
  onClick,
  disabled = false,
  loading = false,
  icon,
  children,
  className = '',
  type = 'button'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`settings-action-btn ${className}`}
    >
      {loading ? <Spinner size={13} color="var(--accent)" /> : icon}
      <span>{children}</span>
    </button>
  );
}
