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
  await db.exec(await fs.readFile('supabase/migrations/202609230001_shared_sync.sql', 'utf8'));
  await db.exec(await fs.readFile('supabase/migrations/202610130001_storefront_and_catalog.sql', 'utf8'));
  await db.exec(await fs.readFile('supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql', 'utf8'));

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
  console.log('--- VERIFICACIÓN IPHONE EN RED LOCAL LAN (http://192.168.18.8:5175) ---');
  const db = await createMockSupabase();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const jwt = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    Buffer.from(JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'),
    'test-sig'
  ].join('.');

  const user = { id: uid, email: 'luis@linkeocards.com', aud: 'authenticated', role: 'authenticated' };

  await context.route('**/*.supabase.co/**', async (route) => {
    const url = new URL(route.request().url());
    let body = {};
    if (url.pathname.includes('/auth/v1/token')) {
      body = { access_token: jwt, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user };
    } else if (url.pathname.includes('/auth/v1/user')) {
      body = user;
    } else if (url.pathname.includes('/app_members')) {
      body = { partner_id: 'luis' };
    } else if (url.pathname.includes('/rpc/linkeoges_snapshot')) {
      const res = await db.query('select public.linkeoges_snapshot() as value');
      body = res.rows[0].value;
    } else if (url.pathname.includes('/rpc/linkeoges_commit')) {
      const args = route.request().postDataJSON();
      try {
        const res = await db.query(
          'select public.linkeoges_commit($1, $2, $3::jsonb) as value',
          [args.expected_revision, args.request_id, JSON.stringify(args.operations)]
        );
        body = res.rows[0].value;
      } catch (err) {
        await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: err.code, message: err.message }) });
        return;
      }
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  console.log('Navegando a http://192.168.18.8:5175/ en emulación iPhone...');
  await page.goto('http://192.168.18.8:5175');
  await page.waitForLoadState('networkidle');

  // Captura 1: Login en iPhone por LAN
  const shot1 = path.join(ARTIFACT_DIR, 'linkeo_iphone_lan_login.png');
  await page.screenshot({ path: shot1 });
  console.log('Captura 1 guardada: linkeo_iphone_lan_login.png');

  // Iniciar sesión como Luis Romero
  const luisCard = await page.getByRole('button', { name: /Luis Romero/ });
  if (await luisCard.isVisible()) {
    await luisCard.click();
    await page.getByPlaceholder('Ingresa tu contraseña').fill('test-pass');
    await page.getByRole('button', { name: /Ingresar al Sistema/i }).click();
  }

  await page.waitForSelector('text=Guardado en servidor', { timeout: 10000 });
  console.log('Sesión iniciada con éxito en iPhone LAN.');

  // Ir a pestaña Stock en barra inferior
  const stockTab = await page.$('.mobile-bottom-nav button:has-text("Stock")');
  if (stockTab) await stockTab.click();
  await page.waitForTimeout(600);

  // Captura 2: Inventario en iPhone por LAN
  const shot2 = path.join(ARTIFACT_DIR, 'linkeo_iphone_lan_inventory.png');
  await page.screenshot({ path: shot2 });
  console.log('Captura 2 guardada: linkeo_iphone_lan_inventory.png');

  // Abrir Quick Action Sheet
  const fab = await page.$('.mobile-fab-btn');
  if (fab) await fab.click();
  await page.waitForTimeout(500);

  // Captura 3: Quick Action Sheet en iPhone por LAN
  const shot3 = path.join(ARTIFACT_DIR, 'linkeo_iphone_lan_quicksheet.png');
  await page.screenshot({ path: shot3 });
  console.log('Captura 3 guardada: linkeo_iphone_lan_quicksheet.png');

  // Cerrar sheet
  const closeBtn = await page.$('button[aria-label*="Cerrar panel"]');
  if (closeBtn) await closeBtn.click();
  await page.waitForTimeout(400);

  // Ir a Proyecciones vía menú Más
  const moreBtn = await page.$('.mobile-bottom-nav button:has-text("Más")');
  if (moreBtn) await moreBtn.click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Proyecciones & Metas/ }).click();
  await page.waitForTimeout(800);

  // Captura 4: Proyecciones en iPhone por LAN
  const shot4 = path.join(ARTIFACT_DIR, 'linkeo_iphone_lan_projections.png');
  await page.screenshot({ path: shot4 });
  console.log('Captura 4 guardada: linkeo_iphone_lan_projections.png');

  console.log('Errores de página detectados:', pageErrors);
  await context.close();
  await browser.close();
  console.log('--- VERIFICACIÓN IPHONE EN LAN COMPLETADA CON ÉXITO ---');
})();
