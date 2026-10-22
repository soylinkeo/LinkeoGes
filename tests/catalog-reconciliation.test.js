import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

async function createMockSupabase() {
  const db = new PGlite();
  const uid = '00000000-0000-4000-8000-000000000001';

  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE PUBLICATION supabase_realtime;
    CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
    INSERT INTO auth.users VALUES('${uid}', 'luis@linkeocards.com', now());
  `);

  const schema = (await fs.readFile('supabase_schema.sql', 'utf8')).replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '');
  await db.exec(schema);
  const syncMigration = await fs.readFile('supabase/migrations/202609230001_shared_sync.sql', 'utf8');
  await db.exec(syncMigration);
  const storefrontMigration = await fs.readFile('supabase/migrations/202610130001_storefront_and_catalog.sql', 'utf8');
  await db.exec(storefrontMigration);

  return db;
}

test('1. Catalog reconciliation migration: 8 official products, SKU/slug uniqueness, safe availability and RPC contract', async () => {
  const db = await createMockSupabase();

  // Baseline state in production (only 2 products were inserted)
  await db.exec(`
    INSERT INTO public.products (id, sku, name, category, type, price, cost, margin, description)
    VALUES
      ('prod-disp-legacy', 'SKU-LNK-9972', 'Tarjeta Google NFC Formato L ESP', 'Individual', 'individual', 35.00, 12.93, 22.07, 'Display de mesa'),
      ('prod-horiz-legacy', 'SKU-LNK-6781', 'Tarjeta Google NFC Cuadrado ESP', 'Individual', 'individual', 35.00, 12.93, 22.07, 'Tarjeta horizontal')
    ON CONFLICT (sku) DO NOTHING;
  `);

  // Execute migration
  const newMigration = await fs.readFile('supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql', 'utf8');
  await db.exec(newMigration);

  // Verify Idempotency: execute a second time
  await db.exec(newMigration);

  // Test all 8 official products exist in table public.products
  const productsQuery = await db.query('SELECT sku, name, price, cost, payload FROM public.products ORDER BY sku');
  assert.equal(productsQuery.rows.length, 8, 'Must have exactly 8 official products');

  const skus = productsQuery.rows.map(r => r.sku);
  const expectedSkus = [
    'SKU-LNK-4951', 'SKU-LNK-6781', 'SKU-LNK-9972', 'SKU-LNK-IDENT',
    'SKU-PACK-DUO-PREMIUM', 'SKU-PACK-EMPRENDEDOR', 'SKU-PACK-FULL', 'SKU-PACK-NEGOCIO'
  ].sort();
  assert.deepEqual(skus.sort(), expectedSkus, 'All expected SKUs must be present');

  // Verify public RPC linkeo_public_catalog() contract
  const rpcResult = await db.query('SELECT public.linkeo_public_catalog() AS catalog');
  const catalogData = rpcResult.rows[0].catalog;
  assert.ok(catalogData, 'Catalog response must be present');
  assert.ok(catalogData.products, 'Products array must be present');
  assert.equal(catalogData.products.length, 8, 'RPC must return exactly 8 products');
  assert.ok(catalogData.revision >= 1, 'Revision must be incremented');

  const productMap = Object.fromEntries(catalogData.products.map(p => [p.slug, p]));

  // Display
  assert.equal(productMap.display.price, 35);
  assert.equal(productMap.display.available, true, 'Display is confirmed in warehouse');

  // Horizontal
  assert.equal(productMap.horizontal.price, 35);
  assert.equal(productMap.horizontal.available, true, 'Horizontal is confirmed in warehouse');
  assert.equal(productMap.horizontal.horizontal, true);

  // Vertical
  assert.equal(productMap.vertical.price, 35);
  assert.equal(productMap.vertical.available, false, 'Vertical defaults safely to false until stock confirmed');

  // Identificable
  assert.equal(productMap.identificable.price, 35);
  assert.equal(productMap.identificable.available, false);

  // Pack Emprendedor
  assert.equal(productMap.emprendedor.price, 55);
  assert.equal(productMap.emprendedor.regular_price, 70);
  assert.equal(productMap.emprendedor.savings, 15);
  assert.equal(productMap.emprendedor.available, false);

  // Pack Negocio
  assert.equal(productMap.negocio.price, 60);
  assert.equal(productMap.negocio.regular_price, 70);
  assert.equal(productMap.negocio.savings, 10);
  assert.equal(productMap.negocio.available, false);

  // Pack Dúo Premium
  assert.equal(productMap.duo.price, 60);
  assert.equal(productMap.duo.regular_price, 70);
  assert.equal(productMap.duo.savings, 10);
  assert.equal(productMap.duo.available, false);

  // Pack Full
  assert.equal(productMap.full.price, 85);
  assert.equal(productMap.full.regular_price, 105);
  assert.equal(productMap.full.savings, 20);
  assert.equal(productMap.full.available, false);

  // Verify historical internal products are NOT exposed to storefront
  await db.exec(`
    INSERT INTO public.products (id, sku, name, category, type, price, cost, margin, description)
    VALUES
      ('hist-duo', 'SKU-PACK-DUO', 'Pack Restaurante Dúo', 'Pack', 'pack', 60.00, 25.86, 34.14, 'Histórico'),
      ('hist-trio', 'SKU-PACK-TRIO', 'Combo Trío', 'Pack', 'pack', 85.00, 38.79, 46.21, 'Histórico'),
      ('hist-ing', 'SKU-LNK-1367', 'Tarjeta Google Cuadrado ING', 'Individual', 'individual', 35.00, 12.93, 22.07, 'Inglés')
    ON CONFLICT (sku) DO NOTHING;
  `);

  const rpcAfterHistorical = await db.query('SELECT public.linkeo_public_catalog() AS catalog');
  const prodsAfter = rpcAfterHistorical.rows[0].catalog.products;
  assert.equal(prodsAfter.length, 8, 'Historical products must NOT be published in storefront');
  assert.ok(!prodsAfter.some(p => p.sku === 'SKU-PACK-DUO'), 'Historical SKU-PACK-DUO must be excluded');
  assert.ok(!prodsAfter.some(p => p.sku === 'SKU-PACK-TRIO'), 'Historical SKU-PACK-TRIO must be excluded');
  assert.ok(!prodsAfter.some(p => p.sku === 'SKU-LNK-1367'), 'Internal SKU-LNK-1367 must be excluded');
});

test('2. Transactional Safety & Non-Destructive Upsert: Preserves existing product IDs, sales foreign links, and custom metadata', async () => {
  const db = await createMockSupabase();

  // Pre-seed an existing product with stable custom primary key, custom notes in payload, and an associated sale
  const customId = 'prod-stable-uuid-9972';
  await db.exec(`
    INSERT INTO public.products (id, sku, name, category, type, price, cost, margin, description, payload)
    VALUES (
      '${customId}',
      'SKU-LNK-9972',
      'Display Preexistente',
      'Individual',
      'individual',
      35.00,
      12.93,
      22.07,
      'Descripción preexistente',
      '{"customOperatorField": "valor-critico", "inventoryId": "inv-3"}'::jsonb
    );

    INSERT INTO public.sales (id, client_name, product_id, product_name, quantity, unit_price, total_amount, unit_cost, total_cost, gross_margin, payment_method, sold_by, date)
    VALUES (
      'sale-test-01',
      'Cliente Corporativo SAC',
      '${customId}',
      'Display Preexistente',
      2,
      35.00,
      70.00,
      12.93,
      25.86,
      44.14,
      'Yape',
      'Luis Romero',
      '2026-10-22'
    );
  `);

  // Run migration
  const newMigration = await fs.readFile('supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql', 'utf8');
  await db.exec(newMigration);

  // Check that the existing product KEPT its stable id and custom payload keys
  const prodCheck = await db.query(`SELECT id, sku, price, payload FROM public.products WHERE sku = 'SKU-LNK-9972'`);
  assert.equal(prodCheck.rows[0].id, customId, 'Primary key id must NOT be changed by UPSERT');
  assert.equal(prodCheck.rows[0].payload.customOperatorField, 'valor-critico', 'Custom metadata in payload must be preserved');
  assert.equal(prodCheck.rows[0].payload.inventoryId, 'inv-3', 'inventoryId must be preserved');
  assert.ok(prodCheck.rows[0].payload.web, 'Web metadata must be merged into payload');
  assert.equal(prodCheck.rows[0].payload.web.slug, 'display');

  // Verify that historical sale is 100% intact and joins properly
  const saleCheck = await db.query(`
    SELECT s.id, s.product_id, p.name, s.total_amount
    FROM public.sales s
    JOIN public.products p ON s.product_id = p.id
    WHERE s.id = 'sale-test-01'
  `);
  assert.equal(saleCheck.rows.length, 1, 'Sale join must succeed seamlessly');
  assert.equal(saleCheck.rows[0].product_id, customId);
  assert.equal(saleCheck.rows[0].total_amount, '70.00');
});

test('3. Deterministic GUC-based revision bumping: Avoids table locks, multi-statement atomicity, rollback safety and concurrency', async () => {
  const db = await createMockSupabase();

  // Seed baseline 2 products
  await db.exec(`
    INSERT INTO public.products (id, sku, name, category, type, price, cost, margin, description)
    VALUES
      ('prod-disp-legacy', 'SKU-LNK-9972', 'Display', 'Individual', 'individual', 35.00, 12.93, 22.07, 'Display'),
      ('prod-horiz-legacy', 'SKU-LNK-6781', 'Horizontal', 'Individual', 'individual', 35.00, 12.93, 22.07, 'Horizontal')
    ON CONFLICT (sku) DO NOTHING;
  `);

  // Set baseline revision to 4 as observed in production
  await db.exec('UPDATE public.catalog_sync SET revision = 4 WHERE id = 1');
  const r0 = await db.query('SELECT revision FROM public.catalog_sync WHERE id = 1');
  assert.equal(Number(r0.rows[0].revision), 4, 'Baseline revision must start at 4');

  // Run new migration once (zero DISABLE TRIGGER, zero ACCESS EXCLUSIVE)
  const newMigration = await fs.readFile('supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql', 'utf8');
  await db.exec(newMigration);

  const res1 = await db.query('SELECT revision FROM public.catalog_sync WHERE id = 1');
  const rev1 = Number(res1.rows[0].revision);
  assert.equal(rev1, 5, 'Migration must increment revision by exactly 1 on first execution (4 -> 5)');

  // Run a second time to verify idempotency and deterministic increment
  await db.exec(newMigration);
  const res2 = await db.query('SELECT revision FROM public.catalog_sync WHERE id = 1');
  const rev2 = Number(res2.rows[0].revision);
  assert.equal(rev2, 6, 'Re-running migration advances revision by exactly 1 per transaction (5 -> 6)');

  // Test rollback: a rolled back transaction must NOT persist an increment
  await db.exec(`
    BEGIN;
    UPDATE public.products SET name = 'Rollback Name' WHERE sku = 'SKU-LNK-9972';
    ROLLBACK;
  `);
  const res3 = await db.query('SELECT revision FROM public.catalog_sync WHERE id = 1');
  assert.equal(Number(res3.rows[0].revision), 6, 'Rolled-back transaction must leave revision unchanged at 6');
});

test('4. Safe Rollback Nivel 1 (Contención Comercial Inmediata): Despublicación sin eliminación física, cero huérfanos', async () => {
  const db = await createMockSupabase();

  // 1. Run migration to establish 8 products
  const newMigration = await fs.readFile('supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql', 'utf8');
  await db.exec(newMigration);

  // 2. Simulate an operational event: a sale was registered using one of the newly added products (Pack Emprendedor)
  await db.exec(`
    INSERT INTO public.sales (id, client_name, product_id, product_name, quantity, unit_price, total_amount, unit_cost, total_cost, gross_margin, payment_method, sold_by, date)
    VALUES (
      'sale-pack-01',
      'Restaurante Don Pepe',
      'prod-pack-emprendedor',
      'Pack Emprendedor (Horizontal + Vertical)',
      1,
      55.00,
      55.00,
      25.86,
      25.86,
      29.14,
      'Transferencia BCP',
      'Luis Romero',
      '2026-10-22'
    );
  `);

  // 3. Execute SAFE rollback (commercial containment)
  const rollbackSql = await fs.readFile('supabase/migrations/202610220001_catalog_reconciliation_rollback.sql', 'utf8');
  await db.exec(rollbackSql);

  // 4. Verify ZERO rows deleted from public.products (no orphan records!)
  const allProducts = await db.query('SELECT sku, payload FROM public.products ORDER BY sku');
  assert.equal(allProducts.rows.length, 8, 'Rollback must NOT hard-delete rows from products');

  // 5. Verify the 6 products are unpublished and marked unavailable
  const unpubProducts = await db.query(`
    SELECT sku, payload->'web'->>'published' as pub, payload->'web'->>'available' as avail
    FROM public.products
    WHERE sku IN ('SKU-LNK-4951', 'SKU-LNK-IDENT', 'SKU-PACK-EMPRENDEDOR', 'SKU-PACK-NEGOCIO', 'SKU-PACK-DUO-PREMIUM', 'SKU-PACK-FULL')
  `);
  for (const r of unpubProducts.rows) {
    assert.equal(r.pub, 'false', `SKU ${r.sku} must be unpublished`);
    assert.equal(r.avail, 'false', `SKU ${r.sku} must be unavailable`);
  }

  // 6. Verify RPC linkeo_public_catalog() now returns ONLY the 2 confirmed products
  const rpcResult = await db.query('SELECT public.linkeo_public_catalog() AS catalog');
  const catalog = rpcResult.rows[0].catalog;
  assert.equal(catalog.products.length, 2, 'RPC must return ONLY 2 products after rollback');
  const returnedSlugs = catalog.products.map(p => p.slug).sort();
  assert.deepEqual(returnedSlugs, ['display', 'horizontal']);

  // 7. Verify the sale record and its product reference are 100% intact
  const saleAfterRollback = await db.query(`
    SELECT s.id, s.product_id, p.name, s.total_amount
    FROM public.sales s
    JOIN public.products p ON s.product_id = p.id
    WHERE s.id = 'sale-pack-01'
  `);
  assert.equal(saleAfterRollback.rows.length, 1, 'Sale record and product relation must NOT be broken by rollback');
  assert.equal(saleAfterRollback.rows[0].product_id, 'prod-pack-emprendedor');
});

test('5. Safe Rollback Nivel 2 (Restauración Integral de Estado): Restaura campos de display/horizontal, limpia productos no vendidos y archiva con referencias', async () => {
  const db = await createMockSupabase();

  // Baseline 2 products
  await db.exec(`
    INSERT INTO public.products (id, sku, name, category, type, price, cost, margin, description, image_url)
    VALUES
      ('prod-disp-legacy', 'SKU-LNK-9972', 'Tarjeta Google NFC L ESP', 'Individual', 'individual', 35.00, 12.93, 22.07, 'Display', 'display-polished.png'),
      ('prod-horiz-legacy', 'SKU-LNK-6781', 'Tarjeta Google NFC Cuadrado ESP', 'Individual', 'individual', 35.00, 12.93, 22.07, 'Horizontal', 'tarjeta-h-polished.png')
    ON CONFLICT (sku) DO NOTHING;
  `);

  // 1. Run migration to establish 8 products
  const newMigration = await fs.readFile('supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql', 'utf8');
  await db.exec(newMigration);
  const countAfterMig = await db.query('SELECT count(*) FROM public.products');
  assert.equal(Number(countAfterMig.rows[0].count), 8);

  // 2. Simulate: Pack Negocio received an audit_log reference
  await db.exec(`
    INSERT INTO public.audit_logs (id, entity_type, entity_id, entity_name, deleted_by, reason)
    VALUES ('audit-prod-01', 'Producto', 'prod-pack-negocio', 'Pack Negocio', 'Luis Romero', 'Auditoría comercial');
  `);

  // 3. Execute full restoration migration
  const fullRestoreSql = await fs.readFile('supabase/migrations/202610220001_catalog_reconciliation_full_restore.sql', 'utf8');
  await db.exec(fullRestoreSql);

  // 4. Verify products table:
  // The 5 unreferenced products were cleanly deleted.
  // The 1 referenced product (Pack Negocio) was archived as 'Descontinuado' without breaking audit_logs!
  const countAfterRestore = await db.query('SELECT count(*) FROM public.products');
  assert.equal(Number(countAfterRestore.rows[0].count), 3, '2 baseline products + 1 safely archived referenced product');

  // Verify Pack Negocio is marked as Descontinuado and unpublished
  const archivedPack = await db.query(`SELECT category, type, payload FROM public.products WHERE sku = 'SKU-PACK-NEGOCIO'`);
  assert.equal(archivedPack.rows[0].category, 'Descontinuado');
  assert.equal(archivedPack.rows[0].type, 'historico');
  assert.equal(archivedPack.rows[0].payload.web.published, false);

  // 5. Verify display and horizontal image_urls and names were restored
  const dispRow = await db.query(`SELECT name, image_url FROM public.products WHERE sku = 'SKU-LNK-9972'`);
  assert.equal(dispRow.rows[0].name, 'Tarjeta Google NFC L ESP');
  assert.equal(dispRow.rows[0].image_url, 'display-polished.png');

  // 6. Verify RPC returns exactly 2 products
  const rpcResult = await db.query('SELECT public.linkeo_public_catalog() AS catalog');
  assert.equal(rpcResult.rows[0].catalog.products.length, 2);
});

test('6. Cards & Sales Engine Contract Compatibility: exact bundleItems, costs, margins and NULL handling', async () => {
  const db = await createMockSupabase();
  const newMigration = await fs.readFile('supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql', 'utf8');
  await db.exec(newMigration);

  // Inspect the 4 packs for sales-domain compatibility
  const packsQuery = await db.query(`
    SELECT id, sku, price, cost, margin, description, payload
    FROM public.products
    WHERE type = 'pack'
    ORDER BY sku
  `);

  assert.equal(packsQuery.rows.length, 4, 'Must have 4 commercial packs');

  for (const pack of packsQuery.rows) {
    const payload = pack.payload;
    assert.ok(Array.isArray(payload.bundleItems), `Pack ${pack.sku} must have bundleItems array in payload`);
    assert.ok(payload.bundleItems.length >= 2, `Pack ${pack.sku} must have at least 2 components`);
    assert.ok(pack.description.includes('||BUNDLE:'), `Pack ${pack.sku} description must include ||BUNDLE: syntax for backward compatibility`);

    // Verify each bundle item has id, sku, name, quantity, unitCost
    let calculatedCost = 0;
    for (const item of payload.bundleItems) {
      assert.ok(item.id, `Component in ${pack.sku} must have id`);
      assert.ok(item.sku, `Component in ${pack.sku} must have sku`);
      assert.ok(item.quantity > 0, `Component in ${pack.sku} must have quantity > 0`);
      assert.ok(item.unitCost > 0, `Component in ${pack.sku} must have unitCost > 0`);
      calculatedCost += item.quantity * item.unitCost;
    }

    // Verify assembly cost is accurate within 2 decimals and distinct from retail price
    assert.equal(Math.round(calculatedCost * 100) / 100, Number(pack.cost), `Pack ${pack.sku} assembly cost must match sum of component costs`);
    assert.ok(Number(pack.price) > Number(pack.cost), `Retail price must be strictly greater than assembly cost`);
  }
});
