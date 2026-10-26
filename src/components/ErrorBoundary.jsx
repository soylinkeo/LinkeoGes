import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';

/**
 * ErrorBoundary robusto para capturar excepciones no controladas de renderizado en React
 * y evitar pantallas negras / azules vacías en dispositivos móviles y de escritorio.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Registrar diagnóstico sin tokens, contraseñas ni credenciales
    const sanitizedMsg = error?.message || 'Error desconocido';
    console.error('[LinkeoGes Diagnostics] Error capturado por ErrorBoundary:', sanitizedMsg);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const sanitizedError = this.state.error?.message?.replace(/([a-zA-Z0-9_\-\.]{25,})/g, '[REDACTED]') || 'Excepción imprevista de interfaz';
      const isLanHttp = typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#080d1a',
            color: '#f8fafc',
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'rgba(16, 24, 44, 0.95)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '28px 24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0', color: '#f8fafc' }}>
              Interrupción de Interfaz
            </h2>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Ocurrió un problema al renderizar este módulo. Tus datos, borradores y sesión permanecen intactos.
            </p>

            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                color: '#fca5a5',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '20px',
                wordBreak: 'break-word',
              }}
            >
              <strong>Diagnóstico:</strong> {sanitizedError}
            </div>

            {isLanHttp && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.75rem',
                  color: '#fbbf24',
                  textAlign: 'left',
                  marginBottom: '20px',
                }}
              >
                <Smartphone size={18} style={{ flexShrink: 0 }} />
                <span>
                  Acceso vía red local HTTP detectado ({window.location.hostname}). Los protocolos criptográficos seguros se adaptaron automáticamente.
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 18px',
                  backgroundColor: '#0066ff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={16} /> Reintentar
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
