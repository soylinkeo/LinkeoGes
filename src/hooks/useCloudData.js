import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { supabase } from '../services/supabase';
import { decodeSnapshot, buildOperations } from '../services/syncModel.js';
import { SyncEngine } from '../services/syncEngine.js';
import { PARTNERS, INITIAL_PROJECT_PHASES, INITIAL_PROJECTIONS_DATA } from '../data/initialData.js';

const initial = {
  partnersState: PARTNERS, sales: [], expenses: [], leads: [], nfcCards: [], inventory: [], suppliers: [],
  calendarEvents: [], products: [], auditLogs: [], districts: [], plan30Days: [],
  projectPhases: INITIAL_PROJECT_PHASES, projectionsData: INITIAL_PROJECTIONS_DATA,
};
const explain = error => error.code === '40001'
  ? 'Otra computadora guardó cambios antes que esta. Descarga tu borrador y carga la última versión para repetir la operación sin sobrescribir datos.'
  : `No se confirmó el guardado: ${error.message}. Comprueba la conexión y la migración de Supabase.`;

export function useCloudData(user) {
  const engine = useMemo(() => new SyncEngine({
    initial,
    backup: data => {
      try {
        const key = `linkeoges_pending_${user?.authId || 'session'}`;
        if (data) localStorage.setItem(key, JSON.stringify({ savedAt: new Date().toISOString(), data }));
        else localStorage.removeItem(key);
      } catch { /* A failed local backup must not stop a confirmed cloud save. */ }
    },
    transport: {
      async read() {
        if (!supabase) throw new Error('Falta configurar Supabase.');
        const { data, error } = await supabase.rpc('linkeoges_snapshot');
        if (error) throw new Error(explain(error));
        return decodeSnapshot(data, initial);
      },
      async commit(request) {
        const operations = buildOperations(request.before, request.after);
        const { data, error } = await supabase.rpc('linkeoges_commit', {
          expected_revision: request.revision, request_id: request.requestId, operations,
        });
        if (error) throw new Error(explain(error));
        return decodeSnapshot(data, initial);
      },
    },
  }), [user?.authId]);
  const snapshot = useSyncExternalStore(engine.subscribe, engine.snapshot);

  useEffect(() => {
    if (!user || !supabase) return;
    engine.disposed = false;
    engine.refresh();
    const channel = supabase.channel(`linkeoges-${user.authId}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_sync' }, () => engine.refresh())
      .subscribe(status => { if (status === 'SUBSCRIBED') engine.refresh(); });
    const refresh = () => { if (document.visibilityState === 'visible') engine.refresh(); };
    const interval = setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    const unload = event => {
      if (engine.view.status === 'saving' || engine.request) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', unload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('visibilitychange', refresh);
      supabase.removeChannel(channel);
      engine.dispose();
    };
  }, [engine, user?.authId]);
  return { ...snapshot, engine, set: (key, value) => engine.set(key, value) };
}
