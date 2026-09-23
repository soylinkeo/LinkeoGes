import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SyncEngine } from '../src/services/syncEngine.js';
const initial = { sales: [], auditLogs: [] };
const clone = value => structuredClone(value);
function server() {
  let data = clone(initial), revision = 0, commits = 0;
  const requests = new Map();
  return {
    get commits() { return commits; },
    async read() { return { data: clone(data), revision }; },
    async commit(request) {
      if (requests.has(request.requestId)) return clone(requests.get(request.requestId));
      if (request.revision !== revision) throw new Error('Conflicto de versión');
      data = clone(request.after); revision++; commits++;
      const result = { data:clone(data), revision }; requests.set(request.requestId,result); return result;
    },
  };
}
const engine = transport => new SyncEngine({initial:clone(initial),transport,delay:60000});
test('computer 2 reads edits from computer 1 without writing them back', async () => {
  const transport=server(), a=engine(transport), b=engine(transport);
  try {
    await a.refresh(); await b.refresh();
    a.set('sales',[{id:'sale1',amount:100}]); await a.flush(); await b.refresh();
    assert.deepEqual(b.view.data.sales,a.view.data.sales);
    await b.refresh(); await a.refresh(); assert.equal(transport.commits,1);
  } finally { a.dispose();b.dispose(); }
});
test('stale computer cannot silently overwrite another sale', async () => {
  const transport=server(), a=engine(transport), b=engine(transport);
  try {
    await a.refresh(); await b.refresh();
    a.set('sales',[{id:'A'}]); await a.flush(); b.set('sales',[{id:'B'}]); await b.flush();
    assert.equal(b.view.status,'error'); assert.deepEqual((await transport.read()).data.sales,[{id:'A'}]);
    assert.deepEqual(b.view.data.sales,[{id:'B'}]);
  } finally { a.dispose();b.dispose(); }
});
test('uncertain network response retries the same request without duplicate writes', async () => {
  const base=server(); let fail=true; const ids=[];
  const a=engine({read:base.read,commit:async request=>{ids.push(request.requestId);const result=await base.commit(request);if(fail){fail=false;throw Error('network');}return result;}});
  try {
    await a.refresh();a.set('sales',[{id:'A'}]);await a.flush();assert.equal(a.view.status,'error');
    await a.retry(); assert.equal(a.view.status,'ready');assert.equal(base.commits,1);assert.equal(ids[0],ids[1]);
  } finally {a.dispose();}
});
test('failed reads preserve the last confirmed data', async () => {
  const transport=server(), a=engine(transport);
  try {await a.refresh();a.set('sales',[{id:'A'}]);await a.flush();transport.read=async()=>{throw Error('offline');};await a.refresh();assert.equal(a.view.data.sales[0].id,'A');}
  finally {a.dispose();}
});
test('late reads cannot replace edits entered while the request was in flight', async () => {
  const base=server(); let resolve; const a=engine(base);
  try {await a.refresh();base.read=()=>new Promise(r=>resolve=r);const pending=a.refresh();a.set('sales',[{id:'A'}]);resolve({data:clone(initial),revision:0});await pending;assert.equal(a.view.data.sales[0].id,'A');}
  finally {a.dispose();}
});
