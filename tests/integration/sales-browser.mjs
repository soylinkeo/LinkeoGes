import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {tables}=require('../../../ENVIAR-MENSAJES/sales-fixture.cjs');
const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
try {
  const context=await browser.newContext({serviceWorkers:'block'});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  const fixture={id:'ui-client',nombre:'Cliente navegador',estado:'Interesado',responsible:'kevin',distrito:'Miraflores',telefono:'999111222'};
  await context.addInitScript(lead=>localStorage.setItem('linkeo_simple_v3',JSON.stringify({leads:[lead]})),fixture);
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=='localhost')return route.abort();
    if(url.pathname==='/vendor/supabase.js')return route.fulfill({contentType:'text/javascript',body:`
      window.__db={revision:0,tables:${JSON.stringify(tables())}};
      window.supabase={createClient:()=>({
        auth:{getSession:async()=>({data:{session:{user:{id:'test',email:'kevin@linkeocards.com'}}}})},
        rpc:async(name,args)=>{
          if(name==='linkeoges_commit'){
            if(args.expected_revision!==__db.revision)return {error:{code:'40001',message:'revision'}};
            for(const op of args.operations){const list=__db.tables[op.table];const at=list.findIndex(r=>r.id===op.id);if(at<0)list.push(structuredClone(op.data));else list[at]={...list[at],...structuredClone(op.data)};}
            __db.revision++;
          }
          return {data:structuredClone(__db)};
        },channel:()=>({on(){return this},subscribe(){return this}}),removeChannel(){},
        from:()=>({select:()=>({eq:()=>({single:async()=>({data:{revision:__db.revision}})})})})
      })};`});
    const file=path.resolve('../ENVIAR-MENSAJES','.'+(url.pathname==='/'?'/index.html':url.pathname));
    try { return route.fulfill({body:await fs.readFile(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'}); }
    catch { return route.fulfill({status:404,body:''}); }
  });
  await page.goto('http://localhost/');
  await page.waitForFunction(()=>window.LINKEO_CENTRAL_PRODUCTS?.length===1);
  async function fillSale(){
    await page.evaluate(()=>openResult('ui-client'));
    await page.selectOption('#result-outcome','Venta cobrada');
    await page.selectOption('#result-product','prod-real');
    await page.fill('#result-quantity','2');
    await page.selectOption('#result-seller','kevin');
    await page.selectOption('#result-payment','Yape');
    await page.fill('#result-paid','120');
  }
  await fillSale();
  await page.click('#result-form button.primary');
  await page.waitForFunction(()=>window.store.leads.find(l=>l.id==='ui-client')?.saleRecorded===true);
  let data=await page.evaluate(()=>__db.tables);
  assert.equal(data.sales.length,1);assert.equal(data.sales[0].sold_by,'kevin');assert.equal(data.inventory[0].quantity,8);
  await page.evaluate(()=>LinkeoCloud.sync());
  assert.equal(await page.evaluate(()=>__db.tables.sales.length),1);
  // A second purchase can be saved offline and confirmed on reconnection.
  await fillSale();await context.setOffline(true);
  await page.click('#result-form button.primary');
  await page.waitForFunction(()=>window.store.leads.find(l=>l.id==='ui-client')?.saleRecorded===false);
  assert.equal(await page.evaluate(()=>__db.tables.sales.length),1);
  await context.setOffline(false);await page.evaluate(()=>LinkeoCloud.sync());
  await page.waitForFunction(()=>window.store.leads.find(l=>l.id==='ui-client')?.saleRecorded===true);
  data=await page.evaluate(()=>__db.tables);
  assert.equal(data.sales.length,2);assert.equal(data.inventory[0].quantity,6);assert.equal(data.nfc_cards.length,4);
  assert.deepEqual(errors,[]);
  console.log('Browser: form, confirmed sale, retry and offline second purchase passed.');
} finally { await browser.close(); }
