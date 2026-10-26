import { chromium } from 'playwright';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/Luis Romero/.gemini/antigravity/brain/3e2397ce-7de0-4d5a-b8fe-f72e6eda6ac7';
const uid = '00000000-0000-4000-8000-000000000001';

async function createMockSupabase() {
  const db = new PGlite();

  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${uid}'::uuid $$;
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

  const catalogMigration = await fs.readFile('supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql', 'utf8');
  await db.exec(catalogMigration);

  // Sembrar insumos de inventario iniciales en PGlite
  await db.exec(`
    INSERT INTO public.inventory (id, sku, name, category, quantity, min_threshold, unit_cost, supplier, lead_time_days)
    VALUES
      ('inv-1', 'SKU-LNK-1367', 'Tarjeta Google NFC Cuadrado ING', 'CHIPS / INSUMOS', 18, 10, 12.93, 'HACHANI_UN Official Store', 13),
      ('inv-2', 'SKU-LNK-6781', 'Tarjeta Google NFC Cuadrado ESP', 'CHIPS / INSUMOS', 25, 5, 12.93, 'HACHANI_UN Official Store', 13),
      ('inv-3', 'SKU-LNK-9972', 'Display de Mesa Formato L ESP', 'STANDS / DISPLAYS', 8, 10, 12.93, 'HACHANI_UN Official Store', 13),
      ('inv-4', 'SKU-LNK-2041', 'Tarjeta Google NFC Redonda ESP', 'CHIPS / INSUMOS', 45, 10, 12.93, 'Shenzhen Card Co.', 15)
    ON CONFLICT (id) DO NOTHING;
  `);

  return db;
}

(async () => {
  console.log('--- GENERANDO EVIDENCIA REAL SPRINT 2 (LINKEO GESTIÓN) ---');
  const db = await createMockSupabase();
  console.log('Base de datos PGlite inicializada con catálogo de 8 productos e inventario sintético.');

  const jwt = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    Buffer.from(JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'),
    'test-sig'
  ].join('.');

  const user = {
    id: uid,
    email: 'luis@linkeocards.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {}
  };

  const setupMockRoutes = async (context) => {
    // Interceptar cualquier llamada hacia Supabase para garantizar 0 escrituras remotas
    await context.route('**/*.supabase.co/**', async (route) => {
      const url = new URL(route.request().url());
      console.log('ROUTE REQUEST:', url.pathname);
      let body = {};

      if (url.pathname.includes('/auth/v1/token')) {
        body = { access_token: jwt, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user };
      } else if (url.pathname.includes('/auth/v1/user')) {
        body = user;
      } else if (url.pathname.includes('/app_members')) {
        body = { partner_id: 'luis' };
      } else if (url.pathname.includes('/rpc/linkeoges_snapshot')) {
        console.log('QUERYING linkeoges_snapshot in PGlite...');
        const res = await db.query('select public.linkeoges_snapshot() as value');
        console.log('SNAPSHOT RESULT KEYS:', Object.keys(res.rows[0].value));
        body = res.rows[0].value;
      } else if (url.pathname.includes('/rpc/linkeoges_commit')) {
        console.log('QUERYING linkeoges_commit in PGlite...');
        const args = route.request().postDataJSON();
        try {
          const res = await db.query(
            'select public.linkeoges_commit($1, $2, $3::jsonb) as value',
            [args.expected_revision, args.request_id, JSON.stringify(args.operations)]
          );
          console.log('COMMIT RESULT OK');
          body = res.rows[0].value;
        } catch (err) {
          console.log('COMMIT ERROR:', err.message);
          await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: err.code, message: err.message }) });
          return;
        }
      }

      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    });
  };

  const browser = await chromium.launch({ headless: true });

  // =========================================================================
  // 1. CAPTURA ESCRITORIO (PC - 1366x768)
  // =========================================================================
  console.log('1. Abriendo entorno de escritorio...');
  const pcContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await setupMockRoutes(pcContext);
  const pcPage = await pcContext.newPage();
  pcPage.on('console', msg => console.log('PC LOG:', msg.text()));
  pcPage.on('pageerror', err => console.log('PC ERROR:', err.message));

  await pcPage.goto('http://localhost:5175');
  await pcPage.waitForLoadState('networkidle');

  // Iniciar sesión como Luis Romero
  console.log('Iniciando sesión como Luis Romero...');
  const luisCard = await pcPage.getByRole('button', { name: /Luis Romero/ });
  if (await luisCard.isVisible()) {
    await luisCard.click();
    await pcPage.getByPlaceholder('Ingresa tu contraseña').fill('test-password-isolated');
    await pcPage.getByRole('button', { name: /Ingresar al Sistema/i }).click();
  }

  // Esperar confirmación de sincronización
  await pcPage.waitForSelector('text=Guardado en servidor', { timeout: 10000 });
  console.log('Sesión iniciada con éxito y sincronización inicial confirmada en PC.');

  // Ir a Almacén & Inventario
  console.log('Navegando a Almacén & Inventario...');
  await pcPage.getByRole('button', { name: /Almacén & Inventario/ }).click();
  await pcPage.waitForTimeout(600);

  // Seleccionar la subpestaña Stock Físico
  console.log('Cambiando a subpestaña Stock Físico...');
  const stockTabBtn = pcPage.getByRole('button', { name: /Stock Físico & Insumos/ });
  if (await stockTabBtn.isVisible()) {
    await stockTabBtn.click();
  }
  await pcPage.waitForTimeout(600);

  // Asegurar vista en Tarjetas
  const cardsToggle = pcPage.getByRole('button', { name: /Tarjetas/i });
  if (await cardsToggle.isVisible()) {
    await cardsToggle.click();
  }
  await pcPage.waitForTimeout(600);

  // Captura 1: Inventario PC en Modo Tarjetas
  const shot1 = path.join(ARTIFACT_DIR, 'linkeo_inventory_cards_desktop.png');
  await pcPage.screenshot({ path: shot1, fullPage: false });
  console.log('Captura 1 guardada: linkeo_inventory_cards_desktop.png');

  // Probar ajuste rápido táctil con debounce (+1 en el primer insumo)
  console.log('Probando ajuste rápido de stock (+ / -)...');
  const plusBtn = await pcPage.$('.stock-touch-btn.plus-btn');
  if (plusBtn) {
    await plusBtn.click();
    await pcPage.waitForTimeout(600);
  }

  // Cambiar a vista de Tabla
  console.log('Cambiando a modo Tabla...');
  const tableToggle = pcPage.getByRole('button', { name: /Tabla/i });
  if (await tableToggle.isVisible()) {
    await tableToggle.click();
  }
  await pcPage.waitForTimeout(600);

  // Captura 2: Inventario PC en Modo Tabla
  const shot2 = path.join(ARTIFACT_DIR, 'linkeo_inventory_table_desktop.png');
  await pcPage.screenshot({ path: shot2, fullPage: false });
  console.log('Captura 2 guardada: linkeo_inventory_table_desktop.png');

  // Navegar a Proyecciones & Metas
  console.log('Navegando a Proyecciones & Metas...');
  await pcPage.getByRole('button', { name: /Proyecciones & Metas/ }).click();
  await pcPage.waitForTimeout(800);

  // Captura 3: Proyecciones en Escritorio
  const shot3 = path.join(ARTIFACT_DIR, 'linkeo_projections_desktop.png');
  await pcPage.screenshot({ path: shot3, fullPage: false });
  console.log('Captura 3 guardada: linkeo_projections_desktop.png');

  await pcContext.close();

  // =========================================================================
  // 2. CAPTURA MÓVIL (iPhone 14/15 - 390x844)
  // =========================================================================
  console.log('2. Abriendo emulación iPhone 14/15 (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  await setupMockRoutes(mobileContext);
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto('http://localhost:5175');
  await mobilePage.waitForLoadState('networkidle');

  // Login móvil
  const mobileLuisCard = await mobilePage.getByRole('button', { name: /Luis Romero/ });
  if (await mobileLuisCard.isVisible()) {
    await mobileLuisCard.click();
    await mobilePage.getByPlaceholder('Ingresa tu contraseña').fill('test-password-isolated');
    await mobilePage.getByRole('button', { name: /Ingresar al Sistema/i }).click();
  }

  await mobilePage.waitForSelector('text=Guardado en servidor', { timeout: 10000 });
  console.log('Sesión iniciada con éxito y sincronización inicial confirmada en móvil.');

  // Ir a Stock mediante la barra inferior móvil
  console.log('Navegando a Stock en MobileBottomNav...');
  const mobileStockTab = await mobilePage.$('.mobile-bottom-nav button:has-text("Stock")');
  if (mobileStockTab) await mobileStockTab.click();
  await mobilePage.waitForTimeout(800);

  // Captura 4: Inventario Móvil en Tarjetas Adaptadas
  const shot4 = path.join(ARTIFACT_DIR, 'linkeo_inventory_cards_mobile.png');
  await mobilePage.screenshot({ path: shot4 });
  console.log('Captura 4 guardada: linkeo_inventory_cards_mobile.png');

  // Abrir Bottom Sheet de Operación Rápida con botón (+)
  console.log('Abriendo Bottom Sheet de Operación Rápida con botón (+)...');
  const fabBtn = await mobilePage.$('.mobile-fab-btn');
  if (fabBtn) await fabBtn.click();
  await mobilePage.waitForTimeout(600);

  // Captura 5: Bottom Sheet Móvil
  const shot5 = path.join(ARTIFACT_DIR, 'linkeo_mobile_quick_sheet.png');
  await mobilePage.screenshot({ path: shot5 });
  console.log('Captura 5 guardada: linkeo_mobile_quick_sheet.png');

  // Cerrar sheet
  const closeBtn = await mobilePage.$('button[aria-label*="Cerrar panel"]');
  if (closeBtn) await closeBtn.click();
  await mobilePage.waitForTimeout(400);

  // Navegar a Proyecciones desde menú Más
  console.log('Navegando a Proyecciones en móvil...');
  const moreBtn = await mobilePage.$('.mobile-bottom-nav button:has-text("Más")');
  if (moreBtn) await moreBtn.click();
  await mobilePage.waitForTimeout(500);

  await mobilePage.getByRole('button', { name: /Proyecciones & Metas/ }).click();
  await mobilePage.waitForTimeout(800);

  // Captura 6: Proyecciones en Móvil
  const shot6 = path.join(ARTIFACT_DIR, 'linkeo_projections_mobile.png');
  await mobilePage.screenshot({ path: shot6 });
  console.log('Captura 6 guardada: linkeo_projections_mobile.png');

  await mobileContext.close();
  await browser.close();
  console.log('--- GENERACIÓN DE EVIDENCIAS COMPLETADA CON ÉXITO ---');
})();
