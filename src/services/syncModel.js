import { mappers } from './mappers.js';

export const collections = {
  sales: ['sales', 'sale'], expenses: ['expenses', 'expense'],
  leads: ['leads', 'lead'], nfcCards: ['nfc_cards', 'nfc'],
  inventory: ['inventory', 'inventory'], suppliers: ['suppliers', 'supplier'],
  calendarEvents: ['calendar_events', 'event'], products: ['products', 'product'],
  auditLogs: ['audit_logs', 'auditLog'],
};
export const settings = ['projectionsData', 'plan30Days', 'projectPhases', 'partnersState'];
export const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function decodeSnapshot(snapshot, defaults) {
  const data = { ...defaults };
  for (const [key, [table, mapper]] of Object.entries(collections)) {
    if (!Array.isArray(snapshot.tables?.[table])) throw new Error(`Respuesta incompleta: ${table}`);
    data[key] = snapshot.tables[table].filter(row => !row.id.startsWith('sys-')).map(mappers[`${mapper}ToFront`]);
  }
  if (!Array.isArray(snapshot.tables?.districts)) throw new Error('Respuesta incompleta: districts');
  data.districts = snapshot.tables.districts.map(row => row.name);
  for (const key of settings) if (Object.hasOwn(snapshot.settings || {}, key)) data[key] = snapshot.settings[key];
  return { data, revision: snapshot.revision };
}

export function buildOperations(before, after) {
  const operations = [];
  for (const [key, [table, mapper]] of Object.entries(collections)) {
    const oldRows = new Map(before[key].map(row => [row.id, row]));
    const newRows = new Map(after[key].map(row => [row.id, row]));
    if (newRows.size !== after[key].length) throw new Error(`Identificadores duplicados en ${key}`);
    for (const row of after[key]) {
      if (!equal(oldRows.get(row.id), row)) operations.push({ table, kind: oldRows.has(row.id) ? 'update' : 'insert', id: row.id, data: mappers[`${mapper}ToDb`](row) });
    }
    for (const row of before[key]) if (!newRows.has(row.id)) operations.push({ table, kind: 'delete', id: row.id });
  }
  for (const name of after.districts) if (!before.districts.includes(name)) operations.push({ table: 'districts', kind: 'insert', id: crypto.randomUUID(), data: { name } });
  for (const name of before.districts) if (!after.districts.includes(name)) operations.push({ table: 'districts', kind: 'delete', name });
  for (const key of settings) if (!equal(before[key], after[key])) operations.push({ table: 'app_settings', kind: 'upsert', id: key, data: { value: after[key] } });
  return operations;
}
