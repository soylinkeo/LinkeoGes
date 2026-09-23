import { test, expect } from '@playwright/test';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';

test('two browser sessions share a lead, preserve its fields and report a failed save', async ({ browser }) => {
  const db=new PGlite();
  const uid='00000000-0000-4000-8000-000000000001';
  const contexts=[];
  let failCommit=false, writes=0;
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${uid}'::uuid $$;
      CREATE PUBLICATION supabase_realtime;
      CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
      INSERT INTO auth.users VALUES('${uid}','kevin@linkeocards.com',now());`);
    await db.exec((await fs.readFile('supabase_schema.sql','utf8')).replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',''));
    await db.exec(await fs.readFile('supabase/migrations/202609230001_shared_sync.sql','utf8'));
    const user={id:uid,email:'kevin@linkeocards.com',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}};
    const jwt = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'test'].join('.');
    const createPage=async()=>{
      const context=await browser.newContext();contexts.push(context);
      await context.route('https://linkeoges-test.supabase.co/**',async route=>{
        const url=new URL(route.request().url()); let body;
        if(url.pathname.includes('/auth/v1/token')) body={access_token:jwt,refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,user};
        else if(url.pathname.includes('/auth/v1/user')) body=user;
        else if(url.pathname.includes('/app_members')) body={partner_id:'kevin'};
        else if(url.pathname.includes('/rpc/linkeoges_snapshot')) body=(await db.query('select public.linkeoges_snapshot() as value')).rows[0].value;
        else if(url.pathname.includes('/rpc/linkeoges_commit')) {
          if(failCommit){await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'offline simulado'})});return;}
          const args=route.request().postDataJSON();
          try {body=(await db.query('select public.linkeoges_commit($1,$2,$3::jsonb) as value',[args.expected_revision,args.request_id,JSON.stringify(args.operations)])).rows[0].value;writes++;}
          catch(error){await route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({code:error.code,message:error.message})});return;}
        } else body={};
        await route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
      });
      const page=await context.newPage();
      page.on('pageerror',error=>{throw error;});
      await page.goto('http://localhost:5174');
      await page.getByRole('button',{name:/Kevin Servat/}).click();
      await page.getByPlaceholder('Ingresa tu contraseña').fill('test-password-not-real');
      await page.getByRole('button',{name:/Ingresar|Acceder|Iniciar/i}).click();
      await expect(page.getByText('Cambios guardados en la nube',{exact:true})).toBeVisible();
      return page;
    };
    const a=await createPage(), b=await createPage();
    await a.getByRole('button',{name:/Pipeline B2B/}).click();
    await a.getByRole('button',{name:'+ Nuevo Prospecto / Lead'}).click();
    await a.getByPlaceholder("Ej: Barbería Don Tito, Pollería Roky's...").fill('Cliente Compartido');
    await a.getByPlaceholder('Encargado o Dueño').fill('Contacto Persistente');
    await a.getByPlaceholder('Detalles de la conversación, objeciones, horarios preferidos...').fill('Seguimiento desde PC1');
    await a.getByRole('button',{name:'Crear Prospecto',exact:true}).click();
    await expect(a.getByText('Cambios guardados en la nube',{exact:true})).toBeVisible();
    await b.reload();
    await expect(b.getByText('Cambios guardados en la nube',{exact:true})).toBeVisible();
    await b.getByRole('button',{name:/Pipeline B2B/}).click();
    await expect(b.getByText('Cliente Compartido',{exact:true})).toBeVisible();
    const row=(await db.query("select payload from public.leads where business_name='Cliente Compartido'")).rows[0].payload;
    expect(row.assignedTo).toBe('kevin');expect(row.notes).toBe('Seguimiento desde PC1');expect(row.contactName).toBe('Contacto Persistente');
    expect(writes).toBe(1);
    failCommit=true;
    await b.getByRole('button',{name:'+ Nuevo Prospecto / Lead'}).click();
    await b.getByPlaceholder("Ej: Barbería Don Tito, Pollería Roky's...").fill('Pendiente Offline');
    await b.getByRole('button',{name:'Crear Prospecto',exact:true}).click();
    await expect(b.getByText('No se pudo sincronizar',{exact:true})).toBeVisible();
    expect((await db.query('select count(*)::int as n from public.leads')).rows[0].n).toBe(1);
    failCommit=false;
    await b.getByRole('button',{name:'Reintentar',exact:true}).click();
    await expect(b.getByText('Cambios guardados en la nube',{exact:true})).toBeVisible();
    expect((await db.query('select count(*)::int as n from public.leads')).rows[0].n).toBe(2);
  } finally {for(const context of contexts) await context.close();await db.close();}
});
