import { test, expect } from '@playwright/test';
test('stalled startup offers retry without deleting local drafts', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('linkeoges_pending_test', '{"draft":true}'));
  await page.route('**/src/services/authService.js*', route => route.fulfill({
    contentType: 'text/javascript',
    body: `export const PARTNERS_INFO={luis:{id:'luis',name:'Luis Romero'},kevin:{id:'kevin',name:'Kevin Servat'}};
      export const getAuthenticatedPartner=()=>window.authRecovered ? Promise.resolve(null) : new Promise(()=>{});
      export const verifyUserPassword=async()=>({isValid:false,user:null});
      export const changeUserPassword=async()=>({success:false});`,
  }));
  await page.goto('http://localhost:5174');
  await expect(page.getByText('Validando sesión…', {exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'No se pudo validar la sesión'})).toBeVisible({timeout:16000});
  expect(await page.evaluate(()=>localStorage.getItem('linkeoges_pending_test'))).toBe('{"draft":true}');
  await page.evaluate(()=>{window.authRecovered=true;});
  await page.getByRole('button',{name:'Reintentar validación'}).click();
  await expect(page.getByRole('button',{name:/Kevin Servat/})).toBeVisible();
  await expect(page.getByText('Validando sesión…', {exact:true})).toHaveCount(0);
});
