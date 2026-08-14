import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="#10b981" />;
      case 'error':
        return <AlertCircle size={16} color="#ef4444" />;
      default:
        return <Info size={16} color="#3b82f6" />;
    }
  };

  return (
    <div className={`toast-notification toast-${type}`}>
      <div className="toast-icon">{getIcon()}</div>
      <span className="toast-message">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>
        <X size={12} />
      </button>
    </div>
  );
}
