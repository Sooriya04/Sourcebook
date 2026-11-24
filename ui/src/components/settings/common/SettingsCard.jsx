import React from 'react';

export default function SettingsCard({
  icon,
  title,
  description,
  badge,
  action,
  children,
  className = ''
}) {
  return (
    <section className={`settings-card ${className}`}>
      {(title || icon) && (
        <div className="settings-card-header">
          <div className="settings-card-header-left">
            {icon && <div className="settings-card-icon-box">{icon}</div>}
            <div>
              {title && <h2 className="settings-card-title">{title}</h2>}
              {description && <p className="settings-card-desc">{description}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {badge}
            {action}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {children}
      </div>
    </section>
  );
}
