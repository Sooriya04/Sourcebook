import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={36} className="empty-icon" />}
      {title && <h4 className="empty-title">{title}</h4>}
      {description && <p className="empty-description">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
