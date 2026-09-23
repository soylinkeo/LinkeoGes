import React from 'react';

export function downloadJson(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SyncStatus({ cloud }) {
  const blocked = cloud.status === 'error' || cloud.status === 'loading';
  return <div className={blocked ? 'sync-blocker' : 'sync-status'} role={blocked ? 'alert' : 'status'}>
    <div className="sync-panel">
      <strong>{cloud.status === 'saving' ? 'Guardando en la nube…' : cloud.status === 'ready' ? 'Cambios guardados en la nube' : cloud.status === 'loading' ? 'Cargando datos compartidos…' : 'No se pudo sincronizar'}</strong>
      {cloud.status === 'ready' && <button className="btn btn-secondary btn-sm" style={{ marginLeft: 12 }} onClick={() => {
        const localBackups = {};
        const legacyKeys = ['sales','expenses','leads','nfc_cards','inventory','suppliers','events','products','audit_logs','districts','plan_30','project_phases','projections'];
        for (const key of Object.keys(localStorage)) {
          if (legacyKeys.some(name => key === `linkeoges_${name}`) || key.startsWith('linkeoges_pending_')) {
            try { localBackups[key] = JSON.parse(localStorage.getItem(key)); } catch { /* ignore malformed old entries */ }
          }
        }
        downloadJson({ version: 2, exportedAt: new Date().toISOString(), revision: cloud.revision, data: cloud.data, localBackups }, 'LinkeoGes-respaldo-completo.json');
      }}>Respaldar</button>}
      {cloud.status === 'error' && <>
        <p>{cloud.error}</p>
        <p>Tu borrador se conserva en este navegador. No se mostrarán confirmaciones de éxito hasta guardar.</p>
        <button className="btn btn-primary" onClick={() => cloud.engine.retry()}>Reintentar</button>{' '}
        <button className="btn btn-secondary" onClick={() => downloadJson(cloud.data, 'LinkeoGes-borrador.json')}>Descargar borrador</button>{' '}
        <button className="btn btn-secondary" onClick={() => {
          if (window.confirm('¿Cargar la versión de la nube? Descarga antes tu borrador si necesitas conservar cambios pendientes.')) cloud.engine.reload();
        }}>Cargar última versión</button>
      </>}
    </div>
  </div>;
}
