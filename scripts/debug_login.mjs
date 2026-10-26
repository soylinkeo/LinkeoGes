import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  const uid = '00000000-0000-4000-8000-000000000001';
  const user = { id: uid, email: 'luis@linkeocards.com', aud: 'authenticated', role: 'authenticated' };
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEiLCJleHAiOjE5OTk5OTk5OTl9.test';

  await page.route('**/*.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    console.log('INTERCEPTED:', url.pathname);
    if (url.pathname.includes('/auth/v1/token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: jwt,
          refresh_token: 'test-refresh',
          token_type: 'bearer',
          expires_in: 3600,
          user,
        }),
      });
    } else if (url.pathname.includes('/auth/v1/user')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
    } else if (url.pathname.includes('/app_members')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ partner_id: 'luis' }) });
    } else if (url.pathname.includes('/rpc/linkeoges_snapshot')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ revision: 6, tables: { products: [], inventory: [], sales: [], expenses: [], leads: [], nfc_cards: [], suppliers: [], calendar_events: [], audit_logs: [], districts: [] }, settings: {} }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }
  });

  await page.goto('http://localhost:5175');
  await page.waitForTimeout(1000);
  const luisBtn = await page.getByRole('button', { name: /Luis Romero/ });
  await luisBtn.click();
  await page.getByPlaceholder('Ingresa tu contraseña').fill('cualquiera');
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await page.waitForTimeout(2000);
  console.log('Login error on page:', await page.locator('.error-banner, .auth-error, [class*="error"]').allInnerTexts());
  await browser.close();
})();
