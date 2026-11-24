import React from 'react';
import ToggleSwitch from '../../ui/ToggleSwitch';

export default function SettingsToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
  className = ''
}) {
  return (
    <div className={`settings-toggle-row ${className}`}>
      <div className="settings-toggle-row-left">
        <span className="settings-toggle-title">{title}</span>
        {description && <span className="settings-toggle-desc">{description}</span>}
      </div>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
