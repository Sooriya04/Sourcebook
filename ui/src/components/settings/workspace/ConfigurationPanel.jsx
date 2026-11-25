import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function ConfigurationPanel({
  title,
  description,
  icon,
  statusIndicator,
  children,
  actions,
  onBack,
  showBackButton = false,
  isDirty = false
}) {
  return (
    <section className="config-workspace" aria-label="Configuration workspace">
      <div className="config-workspace-body">
        <div className="config-workspace-inner">
          {showBackButton && (
            <button
              type="button"
              className="config-mobile-back-btn"
              onClick={onBack}
            >
              <ArrowLeft size={13} />
              <span>All Providers</span>
            </button>
          )}

          {/* Compact Configuration Header */}
          <header className="config-header">
            <div className="config-header-main">
              {icon && (
                <div className="config-header-icon">
                  {icon}
                </div>
              )}
              <div className="config-header-text">
                <div className="config-header-title-row">
                  <h2 className="config-header-title">{title}</h2>
                  {statusIndicator}
                </div>
                {description && (
                  <p className="config-header-desc">{description}</p>
                )}
              </div>
            </div>
          </header>

          {/* Compact Configuration Form */}
          <div className="config-form-body">
            {children}
          </div>
        </div>
      </div>

      {/* Action Footer — Always Visible Without Scrolling */}
      {actions && (
        <footer className="config-actions-footer">
          <div className="config-actions-inner">
            <div className="config-actions-meta">
              {isDirty && (
                <span className="config-dirty-indicator">
                  <span className="config-dirty-dot" />
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="config-actions-buttons">
              {actions}
            </div>
          </div>
        </footer>
      )}
    </section>
  );
}
