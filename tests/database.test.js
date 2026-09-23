import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { mappers } from '../src/services/mappers.js';

test('SQL migration: authorization, atomic rollback, revisions, idempotency and immutable audit', async () => {
  const db = new PGlite();
  const uid='00000000-0000-4000-8000-000000000001';
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      CREATE PUBLICATION supabase_realtime;
      CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
      INSERT INTO auth.users VALUES('${uid}','kevin@linkeocards.com',now());`);
    const schema=(await fs.readFile('supabase_schema.sql','utf8')).replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";','');
    await db.exec(schema);
    const migration=await fs.readFile('supabase/migrations/202609230001_shared_sync.sql','utf8');
    await db.exec(migration);
    await db.exec(migration); // safe to run twice
    await assert.rejects(db.query('select public.linkeoges_snapshot()'),/Acceso no autorizado/);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);
    const read=async()=> (await db.query('select public.linkeoges_snapshot() as snapshot')).rows[0].snapshot;
    const commit=async(revision,ops,id=crypto.randomUUID())=>(await db.query('select public.linkeoges_commit($1,$2,$3::jsonb) as snapshot',[revision,id,JSON.stringify(ops)])).rows[0].snapshot;
    const inv={id:'i1',sku:'sku1',name:'Card',category:'NFC',quantity:5,unitCost:20};
    const op={table:'inventory',kind:'insert',id:inv.id,data:mappers.inventoryToDb(inv)};
    let snapshot=await read();assert.equal(snapshot.revision,0);
    const req=crypto.randomUUID(); snapshot=await commit(0,[op],req); assert.equal(snapshot.revision,1);
    assert.equal((await commit(0,[op],req)).revision,1);
    await assert.rejects(commit(0,[]),/versión cambió/);
    await assert.rejects(commit(1,[{table:'inventory',kind:'update',id:'i1',data:mappers.inventoryToDb({...inv,quantity:4})},
      {table:'expenses',kind:'insert',id:'bad',data:mappers.expenseToDb({id:'bad',amount:-1})}]),/monto/);
    snapshot=await read();assert.equal(snapshot.revision,1);assert.equal(snapshot.tables.inventory[0].quantity,5);
    const audit={id:'a1',entityType:'Insumo',entityId:'i1',entityName:'Card',actionType:'Creación',author:'luis',reason:'original'};
    snapshot=await commit(1,[{table:'audit_logs',kind:'insert',id:'a1',data:mappers.auditLogToDb(audit)}]);
    assert.equal(snapshot.tables.audit_logs[0].deleted_by,'kevin');
    snapshot=await commit(2,[{table:'audit_logs',kind:'update',id:'a1',data:mappers.auditLogToDb({...audit,reason:'tampered',status:'approved'})}]);
    assert.equal(snapshot.tables.audit_logs[0].reason,'original');assert.equal(snapshot.tables.audit_logs[0].payload.reviewedBy,'kevin');
    await assert.rejects(commit(3,[{table:'audit_logs',kind:'delete',id:'a1'}]),/inmutable/);
    await assert.rejects(commit(3,[{table:'user_credentials',kind:'delete',id:'kevin'}]),/Tabla no permitida/);
    // Even an authenticated member cannot bypass the transactional API.
    await db.exec('SET ROLE authenticated');
    await assert.rejects(db.query('update public.inventory set quantity=99'),/permission denied/);
    await assert.rejects(db.query('select * from public.user_credentials'),/permission denied/);
    await db.exec('RESET ROLE; SET ROLE anon');
    await assert.rejects(db.query('select public.linkeoges_snapshot()'),/permission denied/);
    await db.exec('RESET ROLE');
    assert.equal((await db.query('select count(*)::int as n from public.operation_journal')).rows[0].n,3);
  } finally {await db.close();}
});
