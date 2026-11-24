import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function SettingsStatusBanner({
  status,
  className = ''
}) {
  if (!status) return null;

  const isSuccess = Boolean(status.ok || status.valid);
  const message = status.message || status.error || '';

  return (
    <div className={`settings-status-banner ${isSuccess ? 'success' : 'error'} ${className}`}>
      {isSuccess ? <CheckCircle2 size={13} strokeWidth={2.5} /> : <XCircle size={13} strokeWidth={2.5} />}
      <span>{message}</span>
    </div>
  );
}
