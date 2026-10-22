import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  RotateCw, 
  AlertCircle, 
  X, 
  WifiOff, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Download
} from 'lucide-react';
import { equal } from '../services/syncModel.js';

export function downloadJson(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SyncStatus({ cloud }) {
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [dismissed, setDismissed] = useState(false);
  const [prevStatus, setPrevStatus] = useState(cloud.status);

  // Monitor de conectividad del navegador
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (cloud.status !== prevStatus) {
      setPrevStatus(cloud.status);
      setDismissed(false);
      // Auto-ocultar toast después de 4.5 segundos únicamente cuando queda guardado en servidor
      if (cloud.status === 'ready' && !isOffline) {
        const timer = setTimeout(() => {
          setDismissed(true);
        }, 4500);
        return () => clearTimeout(timer);
      }
    }
  }, [cloud.status, prevStatus, isOffline]);

  // Si está listo, online, sin cambios pendientes y el usuario lo cerró o expiró el temporizador, ocultar
  const hasLocalEdits = Boolean(
    cloud.engine && 
    cloud.engine.confirmed && 
    !equal(cloud.engine.confirmed, cloud.data)
  );

  const isConflict = Boolean(
    cloud.status === 'error' && (
      cloud.error?.includes('Otra computadora') ||
      cloud.error?.includes('40001') ||
      cloud.error?.includes('revisión') ||
      cloud.error?.includes('conflicto')
    )
  );

  const isRetrying = Boolean(
    cloud.status === 'saving' && cloud.engine?.request
  );

  if (dismissed && cloud.status === 'ready' && !hasLocalEdits && !isOffline) {
    return null;
  }

  const blocked = cloud.status === 'error' || cloud.status === 'loading';

  const handleBackup = () => {
    const localBackups = {};
    const legacyKeys = ['sales','expenses','leads','nfc_cards','inventory','suppliers','events','products','audit_logs','districts','plan_30','project_phases','projections'];
    for (const key of Object.keys(localStorage)) {
      if (legacyKeys.some(name => key === `linkeoges_${name}`) || key.startsWith('linkeoges_pending_')) {
        try { localBackups[key] = JSON.parse(localStorage.getItem(key)); } catch { /* ignore malformed old entries */ }
      }
    }
    downloadJson({ version: 2, exportedAt: new Date().toISOString(), revision: cloud.revision, data: cloud.data, localBackups }, 'LinkeoGes-respaldo-completo.json');
  };

  const formattedSavedTime = cloud.lastSaved 
    ? new Date(cloud.lastSaved).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div 
      className={blocked ? 'sync-blocker' : 'sync-status'} 
      role={blocked ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div className={`sync-panel ${isOffline ? 'sync-offline' : ''} ${isConflict ? 'sync-conflict' : ''}`}>
        <div className="sync-content-row">
          {/* ESTADO 1: SIN CONEXIÓN (OFFLINE) */}
          {isOffline && (
            <>
              <WifiOff size={15} style={{ color: '#f59e0b', marginRight: 6, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <strong style={{ color: '#f59e0b', fontSize: '0.78rem' }}>Sin conexión a internet (modo local)</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tus cambios se guardan en este dispositivo hasta reconectar.</span>
              </div>
            </>
          )}

          {/* ESTADO 2: CARGANDO */}
          {!isOffline && cloud.status === 'loading' && (
            <>
              <RotateCw size={14} className="spin-icon" style={{ color: 'var(--primary-400, #60a5fa)', marginRight: 6, flexShrink: 0 }} />
              <strong>Cargando datos compartidos…</strong>
            </>
          )}

          {/* ESTADO 3 & 4: GUARDANDO O REINTENTANDO */}
          {!isOffline && cloud.status === 'saving' && (
            <>
              <RotateCw size={14} className="spin-icon" style={{ color: isRetrying ? '#f59e0b' : 'var(--primary-400, #60a5fa)', marginRight: 6, flexShrink: 0 }} />
              <strong>
                {isRetrying ? 'Reintentando guardar en servidor…' : 'Guardando en servidor…'}
              </strong>
            </>
          )}

          {/* ESTADO 5: CAMBIOS LOCALES PENDIENTES */}
          {!isOffline && cloud.status === 'ready' && hasLocalEdits && (
            <>
              <Clock size={15} style={{ color: '#38bdf8', marginRight: 6, flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Cambios locales pendientes</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(enviando...)</span>
              </div>
            </>
          )}

          {/* ESTADO 6: GUARDADO CONFIRMADO EN SERVIDOR */}
          {!isOffline && cloud.status === 'ready' && !hasLocalEdits && (
            <>
              <CheckCircle2 size={15} style={{ color: '#10b981', marginRight: 6, flexShrink: 0 }} />
              <span>
                <strong>Guardado en servidor</strong>
                {formattedSavedTime && (
                  <span style={{ marginLeft: 6, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    ({formattedSavedTime})
                  </span>
                )}
              </span>
              <button 
                className="btn btn-secondary sync-backup-btn" 
                onClick={handleBackup}
                title="Descargar copia de seguridad en JSON"
              >
                Respaldar
              </button>
              <button 
                className="sync-close-btn"
                onClick={() => setDismissed(true)}
                title="Cerrar aviso"
                aria-label="Cerrar aviso de sincronización"
              >
                <X size={13} />
              </button>
            </>
          )}

          {/* ESTADO 7: CONFLICTO DE REVISIÓN */}
          {!isOffline && isConflict && (
            <>
              <AlertTriangle size={16} style={{ color: '#f59e0b', marginRight: 6, flexShrink: 0 }} />
              <strong style={{ color: '#f59e0b' }}>Conflicto de revisión</strong>
            </>
          )}

          {/* ESTADO 8: ERROR DE SINCRONIZACIÓN GENERAL */}
          {!isOffline && cloud.status === 'error' && !isConflict && (
            <>
              <AlertCircle size={16} style={{ color: '#ef4444', marginRight: 6, flexShrink: 0 }} />
              <strong>No se pudo sincronizar</strong>
            </>
          )}
        </div>

        {/* DETALLE EXPANDIDO EN CASO DE ERROR O CONFLICTO */}
        {cloud.status === 'error' && (
          <div className="sync-error-details" style={{ marginTop: 12 }}>
            <p style={{ margin: '8px 0', fontSize: '0.85rem', color: isConflict ? '#fde68a' : 'var(--text-main)' }}>
              {cloud.error}
            </p>
            <p style={{ margin: '8px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tu borrador se conserva de forma segura en este navegador. No se mostrarán confirmaciones de éxito hasta que el servidor valide la transacción.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => cloud.engine?.retry()}
              >
                <RefreshCw size={13} style={{ marginRight: 4 }} />
                Reintentar
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => downloadJson(cloud.data, 'LinkeoGes-borrador.json')}
              >
                <Download size={13} style={{ marginRight: 4 }} />
                Descargar borrador
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => {
                  if (window.confirm('¿Cargar la versión del servidor? Descarga antes tu borrador si necesitas conservar cambios pendientes.')) {
                    cloud.engine?.reload();
                  }
                }}
              >
                Cargar última versión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
