import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCw, AlertCircle, X } from 'lucide-react';

export function downloadJson(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SyncStatus({ cloud }) {
  const blocked = cloud.status === 'error' || cloud.status === 'loading';
  const [dismissed, setDismissed] = useState(false);
  const [prevStatus, setPrevStatus] = useState(cloud.status);

  useEffect(() => {
    if (cloud.status !== prevStatus) {
      setPrevStatus(cloud.status);
      setDismissed(false);
      // Auto-ocultar toast después de 3.5 segundos al quedar listo
      if (cloud.status === 'ready') {
        const timer = setTimeout(() => {
          setDismissed(true);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [cloud.status, prevStatus]);

  // Si está listo y el usuario lo cerró o expiró el temporizador, no mostrar
  if (dismissed && cloud.status === 'ready') {
    return null;
  }

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

  return (
    <div className={blocked ? 'sync-blocker' : 'sync-status'} role={blocked ? 'alert' : 'status'}>
      <div className="sync-panel">
        <div className="sync-content-row">
          {cloud.status === 'saving' && (
            <>
              <RotateCw size={14} className="spin-icon" style={{ color: 'var(--primary-400, #60a5fa)', marginRight: 6 }} />
              <strong>Guardando en la nube…</strong>
            </>
          )}

          {cloud.status === 'ready' && (
            <>
              <CheckCircle2 size={15} style={{ color: '#10b981', marginRight: 6, flexShrink: 0 }} />
              <span>Cambios guardados</span>
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

          {cloud.status === 'loading' && (
            <>
              <RotateCw size={14} className="spin-icon" style={{ color: 'var(--primary-400, #60a5fa)', marginRight: 6 }} />
              <strong>Cargando datos compartidos…</strong>
            </>
          )}

          {cloud.status === 'error' && (
            <>
              <AlertCircle size={16} style={{ color: '#ef4444', marginRight: 6 }} />
              <strong>No se pudo sincronizar</strong>
            </>
          )}
        </div>

        {cloud.status === 'error' && (
          <div className="sync-error-details" style={{ marginTop: 12 }}>
            <p style={{ margin: '8px 0', fontSize: '0.85rem' }}>{cloud.error}</p>
            <p style={{ margin: '8px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tu borrador se conserva en este navegador. No se mostrarán confirmaciones de éxito hasta guardar.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={() => cloud.engine.retry()}>Reintentar</button>
              <button className="btn btn-secondary btn-sm" onClick={() => downloadJson(cloud.data, 'LinkeoGes-borrador.json')}>Descargar borrador</button>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                if (window.confirm('¿Cargar la versión de la nube? Descarga antes tu borrador si necesitas conservar cambios pendientes.')) cloud.engine.reload();
              }}>Cargar última versión</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
