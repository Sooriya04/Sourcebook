import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function ConfigurationPanel({
  title,
  description,
  icon,
  badge,
  children,
  actions,
  onBack,
  showBackButton = false
}) {
  return (
    <section className="settings-config-panel" aria-label="Configuration workspace">
      {/* Configuration Header */}
      <div className="settings-config-header">
        <div className="settings-config-header-left">
          {showBackButton && (
            <button
              type="button"
              className="settings-config-back-btn"
              onClick={onBack}
              aria-label="Back to providers directory"
            >
              <ArrowLeft size={14} />
              <span>Directory</span>
            </button>
          )}

          <div className="settings-config-icon-box">
            {icon}
          </div>

          <div className="settings-config-title-group">
            <div className="settings-config-title-line">
              <h2 className="settings-config-title">{title}</h2>
              {badge}
            </div>
            {description && (
              <p className="settings-config-desc">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Form Body */}
      <div className="settings-config-body">
        {children}
      </div>

      {/* Configuration Actions */}
      {actions && (
        <div className="settings-config-actions-bar">
          {actions}
        </div>
      )}
    </section>
  );
}
