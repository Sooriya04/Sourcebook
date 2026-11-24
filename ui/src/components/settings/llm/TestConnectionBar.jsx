import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SettingsActionBtn, SettingsStatusBanner } from '../common';

export default function TestConnectionBar({ testingKey, testStatus, onTestConnection }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle)',
        flexWrap: 'wrap'
      }}
    >
      <SettingsActionBtn
        onClick={onTestConnection}
        disabled={testingKey}
        loading={testingKey}
        icon={<ShieldCheck size={14} style={{ color: 'var(--accent)' }} />}
      >
        {testingKey ? 'Verifying Endpoint...' : 'Test Connection & Key'}
      </SettingsActionBtn>

      <SettingsStatusBanner status={testStatus} />
    </div>
  );
}
