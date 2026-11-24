import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function SettingsInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  mono = false,
  disabled = false,
  className = '',
  id,
  min,
  max,
  step,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="settings-input-wrapper">
      <input
        id={id}
        type={effectiveType}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`settings-input ${mono ? 'font-mono' : ''} ${isPassword ? 'has-icon-right' : ''} ${className}`}
        {...rest}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="settings-input-eye-btn"
          title={showPassword ? 'Hide value' : 'Show value'}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  );
}
