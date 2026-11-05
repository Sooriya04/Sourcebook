import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import Spinner from '../../ui/Spinner';

export default function TestConnectionBar({ testingKey, testStatus, onTestConnection }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        flexWrap: 'wrap'
      }}
    >
      <button
        type="button"
        onClick={onTestConnection}
        disabled={testingKey}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 18px',
          backgroundColor: '#131314',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#e3e3e3',
          borderRadius: '9999px',
          cursor: testingKey ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          fontSize: '0.82rem',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          if (!testingKey) {
            e.currentTarget.style.backgroundColor = '#282a2d';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!testingKey) {
            e.currentTarget.style.backgroundColor = '#131314';
            e.currentTarget.style.color = '#e3e3e3';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }
        }}
      >
        {testingKey ? <Spinner size={14} color="#a8c7fa" /> : <ShieldCheck size={14} color="#a8c7fa" />}
        <span>{testingKey ? 'Verifying Endpoint...' : 'Test Connection & Key'}</span>
      </button>

      {testStatus && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            padding: '5px 12px',
            borderRadius: '6px',
            backgroundColor: testStatus.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: testStatus.valid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: testStatus.valid ? '#6ee7b7' : '#fca5a5'
          }}
        >
          {testStatus.valid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          <span>{testStatus.valid ? testStatus.message : testStatus.error}</span>
        </div>
      )}
    </div>
  );
}
