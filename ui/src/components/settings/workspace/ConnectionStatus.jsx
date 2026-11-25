import React from 'react';

const STATUS_META = {
  connected: { label: 'Connected', className: 'connected' },
  connecting: { label: 'Connecting...', className: 'connecting' },
  error: { label: 'Connection Error', className: 'error' },
  configured: { label: 'Configured', className: 'configured' },
  not_configured: { label: 'Not Configured', className: 'unconfigured' },
  disconnected: { label: 'Disconnected', className: 'disconnected' },
  active: { label: 'Active Engine', className: 'active' }
};

export default function ConnectionStatus({ state = 'not_configured', customLabel }) {
  const meta = STATUS_META[state] || STATUS_META.not_configured;
  return (
    <span className={`connection-status-pill ${meta.className}`}>
      <span className="connection-status-dot" />
      <span>{customLabel || meta.label}</span>
    </span>
  );
}
