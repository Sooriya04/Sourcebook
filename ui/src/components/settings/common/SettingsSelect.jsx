import React from 'react';

export default function SettingsSelect({
  value,
  onChange,
  options = [],
  children,
  disabled = false,
  className = '',
  id,
  ...rest
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`settings-select ${className}`}
      {...rest}
    >
      {options.length > 0
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
}
