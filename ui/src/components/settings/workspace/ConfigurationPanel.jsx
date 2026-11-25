import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function ConfigurationPanel({
  title,
  description,
  icon,
  statusIndicator,
  docsUrl,
  children,
  actions,
  onBack,
  showBackButton = false,
  isDirty = false
}) {
  return (
    <section className="config-workspace" aria-label="Configuration workspace">
      <div className="config-workspace-scroll">
        <div className="config-workspace-inner">
          {/* Mobile Back Navigation */}
          {showBackButton && (
            <button
              type="button"
              className="config-mobile-back-btn"
              onClick={onBack}
            >
              <ArrowLeft size={14} />
              <span>All Integrations</span>
            </button>
          )}

          {/* Configuration Header */}
          <header className="config-header">
            <div className="config-header-main">
              <div className="config-header-icon">
                {icon}
              </div>
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

            {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="config-docs-link"
              >
                <span>Docs</span>
                <ExternalLink size={12} />
              </a>
            )}
          </header>

          {/* Configuration Form Body */}
          <div className="config-form-body">
            {children}
          </div>
        </div>
      </div>

      {/* Persistent Bottom Action Bar */}
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
