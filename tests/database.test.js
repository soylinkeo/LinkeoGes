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
    const lead = {
      id: 'lead-test-1',
      businessName: 'Barbería Don Tito',
      contactName: 'Tito',
      phone: '987654321',
      email: 'dontito@gmail.com',
      district: 'Miraflores',
      stage: 'prospecto',
      estimatedValue: 120,
      googleMapsUrl: 'https://maps.app.goo.gl/123'
    };
    snapshot = await commit(3, [{ table: 'leads', kind: 'insert', id: lead.id, data: mappers.leadToDb(lead) }]);
    assert.equal(snapshot.tables.leads[0].business_name, 'Barbería Don Tito');
    const leadFront = mappers.leadToFront(snapshot.tables.leads[0]);
    assert.equal(leadFront.email, 'dontito@gmail.com');

    await assert.rejects(commit(4,[{table:'audit_logs',kind:'delete',id:'a1'}]),/inmutable/);
    await assert.rejects(commit(4,[{table:'user_credentials',kind:'delete',id:'kevin'}]),/Tabla no permitida/);
    // Even an authenticated member cannot bypass the transactional API.
    await db.exec('SET ROLE authenticated');
    await assert.rejects(db.query('update public.inventory set quantity=99'),/permission denied/);
    await assert.rejects(db.query('select * from public.user_credentials'),/permission denied/);
    await db.exec('RESET ROLE; SET ROLE anon');
    await assert.rejects(db.query('select public.linkeoges_snapshot()'),/permission denied/);
    await db.exec('RESET ROLE');
    assert.equal((await db.query('select count(*)::int as n from public.operation_journal')).rows[0].n,4);

    // Apply storefront and catalog migration
    const storefrontMigration = await fs.readFile('supabase/migrations/202610130001_storefront_and_catalog.sql', 'utf8');
    await db.exec(storefrontMigration);
    await db.exec(storefrontMigration); // safe to run twice (idempotent)

    // Insert a product via commit to test trigger and catalog output
    const prod = {
      id: 'prod-h',
      sku: 'SKU-LNK-6781',
      name: 'Tarjeta Google NFC Cuadrado ESP',
      category: 'Individual',
      type: 'individual',
      price: 60,
      cost: 12.93,
      margin: 47.07,
      marginPct: 78.45,
      badge: 'Popular',
      description: 'Tarjeta inteligente horizontal',
      web: { slug: 'horizontal', published: true, name: 'Tarjeta Horizontal' }
    };
    snapshot = await commit(4, [{ table: 'products', kind: 'insert', id: prod.id, data: mappers.productToDb(prod) }]);
    assert.equal(snapshot.tables.products.length, 1);
    await db.query(`INSERT INTO public.products
      (id,name,sku,category,type,price,cost,margin,margin_pct,description,payload)
      VALUES ('prod-full','Pack Full','SKU-PACK-FULL','Pack','pack',150,38.79,111.21,74.14,
        'Precio regular S/ 180.',
        '{"web":{"slug":"full","published":true,"regularPrice":180,"savings":30}}'::jsonb)`);
    const priceMigration = await fs.readFile('supabase/migrations/202610200001_nfc_price_update.sql', 'utf8');
    await db.exec(priceMigration);
    await db.exec(priceMigration); // safe to run twice
    const prices = (await db.query(`SELECT sku, price, payload->>'regularPrice' AS regular_price,
      payload->'web'->>'savings' AS savings FROM public.products ORDER BY sku`)).rows;
    const horizontalPrice = prices.find(row => row.sku === 'SKU-LNK-6781');
    const fullPackPrice = prices.find(row => row.sku === 'SKU-PACK-FULL');
    assert.equal(Number(horizontalPrice.price), 40);
    assert.equal(Number(fullPackPrice.price), 100);
    assert.equal(Number(fullPackPrice.regular_price), 120);
    assert.equal(Number(fullPackPrice.savings), 20);

    // Anon role can call linkeo_public_catalog() and read catalog_sync
    await db.exec('SET ROLE anon');
    const catalogRes = (await db.query('select public.linkeo_public_catalog() as cat')).rows[0].cat;
    assert.ok(catalogRes.products.length >= 1);
    assert.equal(catalogRes.products.find(product => product.slug === 'horizontal').price, 40);
    assert.equal(catalogRes.products.find(product => product.slug === 'full').price, 100);
    assert.equal(catalogRes.products.find(product => product.slug === 'full').regular_price, 120);
    assert.equal(catalogRes.products[0].cost, undefined); // never leaks cost
    const syncRes = (await db.query('select revision from public.catalog_sync where id = 1')).rows[0];
    assert.ok(syncRes.revision >= 1);

    // Test review submission by anon
    const subId = crypto.randomUUID();
    await db.query(`select public.linkeo_submit_review(
      $1::uuid, 'Juan Perez', 'Restaurante El Sol', 'horizontal', 5,
      'Excelente producto para nuestro local', 'juan@elsol.pe', 'Miraflores', 'PED-123', true, ''
    )`, [subId]);

    // Public reviews only return approved
    const pubReviewsBefore = (await db.query('select * from public.linkeo_public_reviews()')).rows;
    assert.equal(pubReviewsBefore.length, 0); // still pending

    // Partner approves review
    await db.exec('RESET ROLE');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
    await db.exec('SET ROLE authenticated');
    const partnerReviews = (await db.query('select public.linkeoges_reviews() as r')).rows[0].r;
    assert.equal(partnerReviews.length, 1);
    const revId = partnerReviews[0].id;
    await db.query('select public.linkeoges_review_moderate($1::uuid, $2)', [revId, 'approved']);

    // Now public reviews show it
    await db.exec('SET ROLE anon');
    const pubReviewsAfter = (await db.query('select * from public.linkeo_public_reviews()')).rows;
    assert.equal(pubReviewsAfter.length, 1);
    assert.equal(pubReviewsAfter[0].display_name, 'Juan Perez');

    await db.exec('RESET ROLE');
    assert.equal((await db.query('select count(*)::int as n from public.operation_journal')).rows[0].n, 5);
  } finally {await db.close();}
});
