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
        borderTop: '1px solid #27272a',
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
          padding: '8px 16px',
          backgroundColor: '#27272a',
          border: '1px solid #3f3f46',
          color: '#f4f4f5',
          borderRadius: '8px',
          cursor: testingKey ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          fontSize: '0.82rem',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          if (!testingKey) {
            e.currentTarget.style.backgroundColor = '#323238';
            e.currentTarget.style.borderColor = '#52525b';
          }
        }}
        onMouseLeave={(e) => {
          if (!testingKey) {
            e.currentTarget.style.backgroundColor = '#27272a';
            e.currentTarget.style.borderColor = '#3f3f46';
          }
        }}
      >
        {testingKey ? <Spinner size={14} color="#818cf8" /> : <ShieldCheck size={14} color="#818cf8" />}
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
