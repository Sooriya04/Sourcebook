import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Error Caught by Boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="error-boundary-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            textAlign: 'center',
            background: 'var(--canvas-2, #18181b)',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #27272a)',
            margin: '16px',
            color: 'var(--text-main, #f4f4f5)'
          }}
        >
          <AlertTriangle size={36} color="var(--amber, #f59e0b)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 6px 0' }}>
            {this.props.title || 'Component Error'}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #a1a1aa)', maxWidth: '420px', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            {this.state.error?.message || 'An unexpected error occurred in this section.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'var(--accent-primary, #3b82f6)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>Reload Panel</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
