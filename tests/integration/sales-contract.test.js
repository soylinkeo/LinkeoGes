import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { PGlite } from '@electric-sql/pglite';
import { mappers } from '../../src/services/mappers.js';

const require = createRequire(import.meta.url);
const Core = require('../../../ENVIAR-MENSAJES/cloud-core.js');
const { soldLead } = require('../../../ENVIAR-MENSAJES/sales-fixture.cjs');

test('Mensajes -> PostgreSQL -> Gestión: atomic sale, concurrent stock, retry and second purchase', async () => {
  const db = new PGlite();
  const uid = '00000000-0000-4000-8000-000000000001';
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      CREATE PUBLICATION supabase_realtime;
      CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
      INSERT INTO auth.users VALUES('${uid}','kevin@linkeocards.com',now());`);
    await db.exec((await fs.readFile('supabase_schema.sql','utf8')).replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',''));
    await db.exec(await fs.readFile('supabase/migrations/202609230001_shared_sync.sql','utf8'));
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);
    const read = async () => (await db.query('select public.linkeoges_snapshot() as s')).rows[0].s;
    const commit = async (revision,ops,id=crypto.randomUUID()) => (await db.query('select public.linkeoges_commit($1,$2,$3::jsonb) as s',[revision,id,JSON.stringify(ops)])).rows[0].s;
    await commit(0,[
      {table:'products',kind:'insert',id:'prod-real',data:mappers.productToDb({id:'prod-real',name:'Tarjeta central',sku:'SKU-CARD',category:'NFC',price:60,cost:12.93})},
      {table:'inventory',kind:'insert',id:'inv-real',data:mappers.inventoryToDb({id:'inv-real',sku:'SKU-CARD',name:'Tarjeta',category:'NFC',quantity:5,unitCost:12.93})}
    ]);
    let snapshot = await read();
    const lead = soldLead();
    const plan = async (l,s) => Core.planSync([l],new Map(s.tables.leads.map(r=>[r.id,r])),new Set([l.id]),250,s.tables);
    const planned = await plan(lead,snapshot);
    // Failure of the final operation must roll back lead, sale, cards and stock together.
    await assert.rejects(commit(snapshot.revision,[...planned.operations,{table:'inventory',kind:'update',id:'inv-real',data:{quantity:-1}}]),/Stock inválido/);
    snapshot = await read();assert.equal(snapshot.tables.sales.length,0);assert.equal(snapshot.tables.inventory[0].quantity,5);
    const requestId = crypto.randomUUID();
    const revision = snapshot.revision;
    snapshot = await commit(revision,planned.operations,requestId);
    assert.equal((await commit(revision,planned.operations,requestId)).revision,snapshot.revision);
    const sale=mappers.saleToFront(snapshot.tables.sales[0]);
    assert.equal(sale.productId,'prod-real');assert.equal(sale.soldBy,'kevin');assert.equal(sale.totalAmount,120);
    assert.equal(sale.cost,25.86);assert.equal(sale.cardIds.length,2);assert.equal(sale.stockMovements[0].quantity,2);
    assert.equal(mappers.inventoryToFront(snapshot.tables.inventory[0]).quantity,3);
    for (const op of planned.operations) assert.equal(Core.sameRow(snapshot.tables[op.table].find(r=>r.id===op.id),op.data),true);
    // A different transport request after a lost response still cannot duplicate the order.
    snapshot = await commit(snapshot.revision,(await plan(lead,snapshot)).operations);
    assert.equal(snapshot.tables.sales.length,1);assert.equal(snapshot.tables.inventory[0].quantity,3);
    const next={...lead,saleOrder:{...lead.saleOrder,id:'order-00000002'}};
    const second=await plan(next,snapshot);
    await commit(snapshot.revision,[]); // Another computer advances the revision.
    await assert.rejects(commit(snapshot.revision,second.operations),/versión cambió/);
    snapshot=await read();snapshot=await commit(snapshot.revision,(await plan(next,snapshot)).operations);
    assert.equal(snapshot.tables.sales.length,2);assert.equal(snapshot.tables.inventory[0].quantity,1);
    assert.equal(snapshot.tables.nfc_cards.length,4);
    await assert.rejects(plan({...lead,saleOrder:{...lead.saleOrder,id:'order-00000003'}},snapshot),/Stock insuficiente/);
  } finally { await db.close(); }
});

test('shared sales rules stay identical and legacy partner names normalize in Gestión', async () => {
  assert.equal(await fs.readFile('src/shared/sales-domain.js','utf8'),await fs.readFile('../ENVIAR-MENSAJES/sales-domain.js','utf8'));
  assert.equal(mappers.saleToFront({id:'legacy',sold_by:'Luis Romero',payload:{soldBy:'Luis Romero'}}).soldBy,'luis');
});
