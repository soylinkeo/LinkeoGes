import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastNotification({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#10b981" />;
      case 'error':
        return <AlertCircle size={18} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      default:
        return <Info size={18} color="#3b82f6" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.4)';
      case 'error':
        return 'rgba(239, 68, 68, 0.4)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.4)';
      default:
        return 'rgba(59, 130, 246, 0.4)';
    }
  };

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`toast-item toast-${toast.type || 'info'}`}
          style={{ borderColor: getBorderColor(toast.type) }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <span style={{ display: 'flex', flexShrink: 0 }}>
              {getIcon(toast.type)}
            </span>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {toast.message}
            </span>
          </div>

          <button 
            type="button" 
            onClick={() => onDismiss && onDismiss(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '8px'
            }}
            title="Cerrar notificación"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
