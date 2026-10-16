import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
try {
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/rpc/linkeo_public_catalog'))return route.fulfill({json:{revision:1,products:[{slug:'horizontal',sku:'SKU-LNK-6781',price:65,available:true}]}});
    if(url.pathname.endsWith('/rpc/linkeo_public_reviews'))return route.fulfill({json:[]});
    if(url.hostname!=='localhost')return route.abort();
    const file=path.resolve('../LINKEO-V2/dist','.'+url.pathname);
    try{return route.fulfill({body:await fs.readFile(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'});}catch{return route.fulfill({status:404,body:''});}
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://localhost/packs/full.html');
  await page.waitForFunction(()=>window.LINKEO_CATALOG.horizontal.available===true);
  assert.match(await page.locator('#product-total').textContent(),/por confirmar/);
  await page.fill('#customer','Cliente');await page.fill('#district','Miraflores');
  await page.locator('#product-order button[type=submit]').click();
  assert.match(await page.locator('#order-status').textContent(),/no está confirmado/);
  assert.equal(context.pages().length,1);
  await page.goto('http://localhost/productos/horizontal.html');
  await page.waitForFunction(()=>window.LINKEO_CATALOG.horizontal.price===65);
  await page.fill('#quantity','2');
  assert.equal(await page.locator('#product-total').textContent(),'S/130');
  assert.deepEqual(errors,[]);
  console.log('Browser: unpublished pack blocked; central product price and totals passed.');
} finally {await browser.close();}
