import React from 'react';

export default function ToggleSwitch({ checked, onChange, label, id, disabled = false }) {
  const switchId = id || (label ? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <label
      htmlFor={switchId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <input
        type="checkbox"
        id={switchId}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          margin: 0
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '36px',
          height: '20px',
          borderRadius: '9999px',
          backgroundColor: checked ? '#4f46e5' : '#27272a',
          border: checked ? '1px solid #6366f1' : '1px solid #3f3f46',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '18px' : '2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
      {label && (
        <span style={{ marginLeft: '10px', fontSize: '0.84rem', color: '#f4f4f5', fontWeight: 500 }}>
          {label}
        </span>
      )}
    </label>
  );
}
