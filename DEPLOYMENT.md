# Activación de LinkeoGes 1.1

La compilación nueva y la migración SQL deben activarse juntas. El cliente anterior
no es compatible con las políticas seguras y deja de escribir después del cambio.

1. En **Authentication → Users** de Supabase, el administrador crea las cuentas
   `luis@linkeocards.com` y `kevin@linkeocards.com`, con correo confirmado y claves
   individuales. Las contraseñas antiguas del frontend no se migran a Auth.
2. Confirmar que ambas cuentas existen antes del cambio. Desactivar el registro
   público si no se utiliza; en cualquier caso, solo los miembros de `app_members`
   pueden leer o modificar información de LinkeoGes.
3. Conservar un respaldo de la base antes del cambio. Exportar los datos locales
   que solo existan en una computadora. La versión nueva no borra localStorage.
4. Ejecutar `supabase_schema.sql` para asegurar que existen las tablas base, y luego
   `supabase/migrations/202609230001_shared_sync.sql`. La migración es transaccional
   y repetible; conserva las filas existentes y bloquea el acceso anónimo.
5. En Vercel, configurar **Production y Preview** con `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` del mismo proyecto Supabase. Esta última es la clave
   pública anon/publishable, nunca una clave service_role ni una contraseña.
6. Publicar la compilación nueva y recargar ambas computadoras. Iniciar sesión
   con la nueva contraseña. Ambos usuarios comparten las mismas tablas y ajustes.
7. Registrar una modificación identificable en una computadora y comprobarla en
   la otra. Realtime actualiza de inmediato; el respaldo de sondeo consulta cada
   15 segundos y también al volver a la pestaña o recuperar conexión.

## Verificación SQL de administración

```sql
select partner_id from public.app_members order by partner_id;
select id, revision, updated_at from public.app_sync;
select policyname, roles, cmd from pg_policies
where schemaname = 'public' and tablename in ('app_members', 'app_sync');
```

No hay permisos de escritura directa para anon/authenticated. Las operaciones
pasan por `linkeoges_commit`, que comprueba membresía, bloquea la revisión, valida
los registros, guarda todo o revierte todo y registra un historial en el servidor.

## Conflictos, recuperación y datos antiguos

- Una edición simultánea sobre una versión antigua se rechaza; no se fusiona
  silenciosamente ni sobrescribe el cambio del otro socio. Descargar el borrador,
  cargar la última versión y repetir únicamente el cambio necesario.
- Una respuesta de red incierta conserva el identificador de la solicitud. Un
  reintento de esa misma solicitud no duplica registros.
- El botón **Respaldar** descarga todos los módulos y las copias locales antiguas
  disponibles en ese navegador, sin claves ni sesiones. Excel exporta todos los
  módulos, pero JSON es el respaldo sin pérdida de estructura.
- Los campos que la versión anterior nunca envió al servidor solo pueden
  recuperarse desde la computadora que conserva la copia local. No es posible
  reconstruirlos a partir de Supabase si ya fueron eliminados en ambos sitios.
- Las ventas históricas sin movimientos de almacén requieren conciliación manual
  al eliminarlas. No se inventan movimientos ni UID físicos de tarjetas.
- Las cuentas `user_credentials` y los registros `sys-*` antiguos quedan fuera del
  acceso del cliente. El administrador puede conservarlos para revisión histórica.

## Reversión

Si falla el SQL antes de COMMIT, no se aplica ninguna parte de la migración.
Después del corte, no publicar el cliente antiguo ni reabrir políticas anónimas.
Mantener la base protegida y corregir/publicar el cliente 1.1. Las columnas payload,
los ajustes, el diario y las tablas originales se mantienen sin borrados masivos.

## Pruebas

`npm run check` ejecuta lint, pruebas de dominio/sincronización, SQL real en PGlite
y compilación. `npm run test:browser` prueba dos sesiones de navegador contra la
migración SQL con autenticación simulada exclusivamente en el entorno de pruebas.
Estas pruebas nunca usan ni modifican el proyecto Supabase de producción.

Referencias: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Supabase Auth](https://supabase.com/docs/reference/javascript/auth-signinwithpassword),
[Realtime](https://supabase.com/docs/guides/realtime/postgres-changes).
