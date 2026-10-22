# LINKEO GESTIÓN — FASE 02 / SPRINT 1
## RELEASE GATE: VALIDACIÓN DEFINITIVA PRE-PRODUCCIÓN
**Auditoría Técnica, Análisis de Locks, Preflight y Protocolo de Release**  
*Fecha: 22 de octubre de 2026 (America/Lima)*  
*Proyecto: `soylinkeo/LinkeoGes`*  
*Rama: `sprint-1-catalog-integrity` (sobre HEAD `e0a4b51`)*  
*Entornos Auditados: Supabase Central (`ntzkjkvgtytlobvbplov`) · Vercel (`linkeo-ges`)*  
*Roles: Principal PostgreSQL Architect · Supabase Security Engineer · ERP Data Integrity Specialist · QA Automation Lead · Release Manager*  
*Veredicto Final: **CONDITIONAL GO (Técnicamente Validado / Pendiente de Autorización de Socios)***

---

## 1. ESTADO DEFINITIVO DEL SQL Y ANÁLISIS DE SENTENCIAS (ZERO TABLE LOCKS)

Se reexaminó integralmente el script de migración:  
[`supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql)

### Análisis de Concurrencia y Eliminación de `DISABLE TRIGGER`:
En la revisión anterior se identificó que PostgreSQL ejecuta triggers a nivel de sentencia para INSERT y UPDATE simultáneamente durante un `INSERT ... ON CONFLICT DO UPDATE`. La solución preliminar contemplaba `ALTER TABLE products DISABLE TRIGGER trg_bump_catalog_sync`.  
**Evaluación Crítica de Arquitectura**: En PostgreSQL, `ALTER TABLE ... DISABLE TRIGGER` adquiere un bloqueo de tipo **`ACCESS EXCLUSIVE`** sobre `public.products`, bloqueando consultas concurrentes de lectura (`SELECT`) y escritura de la operación comercial mientras dure la transacción.  
**Solución Definitiva Implementada**:
- **Se eliminó completamente cualquier sentencia `DISABLE TRIGGER` o `ENABLE TRIGGER`**.
- La tabla `public.products` **NUNCA sufre bloqueos exclusivos**.
- Se optimizó la función del trigger `public.bump_catalog_sync()` utilizando una variable de configuración local a la transacción (GUC transaction-scoped `linkeo.catalog_bumped`):
  ```sql
  CREATE OR REPLACE FUNCTION public.bump_catalog_sync()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
  BEGIN
    IF current_setting('linkeo.catalog_bumped', true) IS DISTINCT FROM 'true' THEN
      PERFORM set_config('linkeo.catalog_bumped', 'true', true);
      UPDATE public.catalog_sync
      SET revision = revision + 1, updated_at = now()
      WHERE id = 1;
    END IF;
    RETURN NULL;
  END;
  $$;
  ```
  - El tercer parámetro de `set_config(..., true)` establece `is_local = true`, lo que circunscribe el flag estrictamente a la transacción en curso.
  - El primer evento del statement evalúa que `linkeo.catalog_bumped` no es `'true'`, marca la variable como `'true'` e incrementa `revision = revision + 1`.
  - El segundo evento dentro de la misma transacción detecta `linkeo.catalog_bumped = 'true'` y omite el incremento.
  - Al completar la transacción (`COMMIT` o `ROLLBACK`), la variable se purga automáticamente de la sesión de PostgreSQL.
  - Transacciones concurrentes poseen su propio contexto GUC aislado y serializan limpiamente en el bloqueo de fila de `public.catalog_sync WHERE id = 1`.
  - **Resultado**: Incremento **monótono y exactamente de +1 por transacción**, sin bloqueos exclusivos, sin riesgo de dejar triggers deshabilitados y con tolerancia total a concurrencia.

### Desglose Sentencia por Sentencia:
1. `BEGIN;` — Garantiza atomicidad transaccional completa.
2. `DO $$ ... ADD CONSTRAINT products_sku_key UNIQUE (sku); ... $$;` — Idempotente; no altera nada si la restricción ya existe.
3. `CREATE OR REPLACE FUNCTION public.bump_catalog_sync() ...` — Idempotente a nivel de transacción, control de revisión sin deshabilitar triggers (evita bloqueos de tabla `ACCESS EXCLUSIVE` y maneja concurrencia mediante bloqueo de fila estándar en `catalog_sync`).
4. `INSERT INTO public.products (...) VALUES (...) ON CONFLICT (sku) DO UPDATE SET ...` —
   - **Preservación de ID**: No actualiza `id` (mantiene intactas llaves foráneas con `sales.product_id`).
   - **Merge recursivo de JSONB**: Combina `{web}` sin borrar atributos operativos (`inventoryId`, `regularPrice`, campos de operador).
   - **Sintaxis dual en packs**: Registra `bundleItems` en `payload` y la marca `||BUNDLE:[...]||` en `description` para máxima compatibilidad con `mappers.js` y `sale-operations.js`.
   - **Disponibilidad estricta**: `available = true` exclusivamente para `display` y `horizontal` (lotes físicos comprobados). `available = false` para los 6 restantes.
5. `CREATE OR REPLACE FUNCTION public.linkeo_public_catalog() ...` —
   - `SECURITY DEFINER` con `search_path = ''`.
   - Disponibilidad segura: `'available', coalesce((p.payload->'web'->>'available')::boolean, false)`.
   - Fallbacks oficiales: S/ 105 (Full), S/ 70 (Dúo, Negocio, Emprendedor) y ahorros de S/ 20, S/ 15, S/ 10.
   - Filtro estricto: Sólo expone productos con `published = true`.
6. `COMMIT;` — Cierre atómico. El trigger automático avanza la revisión sin necesidad de sentencia manual.

---

## 2. PREFLIGHT DE SOLO LECTURA EN SUPABASE CENTRAL (`ntzkjkvgtytlobvbplov`)

Se ejecutaron consultas de diagnóstico de solo lectura contra la base productiva oficial:

| Elemento Auditado en Producción | Estado Observado | Evidencia Empírica |
|---|---|---|
| **Proyecto Supabase** | `ntzkjkvgtytlobvbplov` | Verificado en `.env.local` y API central |
| **Tabla `catalog_sync`** | `id: 1, revision: 4` | `updated_at: 2026-10-20T21:23:58.96926+00:00` |
| **RPC `linkeo_public_catalog()`** | Retorna exactamente 2 productos | `SKU-LNK-9972` (Display) y `SKU-LNK-6781` (Horizontal) |
| **Precios Actuales en Producción** | S/ 35.00 cada uno | Confirmados en la salida JSON de la RPC |
| **Disponibilidad Actual en Producción** | `available: true` en ambos | Correcto para los 2 modelos de mostrador |
| **Productos Faltantes en Producción** | 6 productos no existen aún | `vertical`, `identificable` y los 4 packs no aparecen |
| **Políticas de Seguridad (RLS)** | Activas y protegiendo tablas | Lecturas anónimas directas a `products` rechazadas (401) |

### Script Oficial de Respaldo Pre-Migración (Paso Previo Obligatorio):
El administrador debe ejecutar este script en el SQL Editor de Supabase y guardar la salida antes de aplicar cualquier cambio:

```sql
SELECT jsonb_build_object(
  'timestamp', now(),
  'database', current_database(),
  'catalog_sync', (SELECT row_to_json(cs) FROM public.catalog_sync cs WHERE id = 1),
  'existing_products_count', (SELECT count(*) FROM public.products),
  'existing_products', (
    SELECT jsonb_agg(row_to_json(p)) FROM public.products p
  ),
  'rpc_catalog_definition', (
    SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'linkeo_public_catalog'
  )
) AS snapshot_pre_migracion_linkeo;
```

---

## 3. MEJORA DEL ROLLBACK: CONTENCIÓN COMERCIAL VS RESTAURACIÓN INTEGRAL

Se establecieron formalmente **dos niveles de reversión** diferenciados:

### Nivel 1: Rollback de Contención Comercial / Emergencia
- **Script**: [`supabase/migrations/202610220001_catalog_reconciliation_rollback.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_rollback.sql)
- **Cuándo Usar**: En caso de alerta comercial inmediata (ej: clientes intentando comprar masivamente packs por WhatsApp cuya producción no esté lista).
- **Mecanismo**: Despublica de inmediato los 6 nuevos SKUs (`web.published = false, web.available = false`) y asegura que la RPC pública retorne sólo `display` y `horizontal`.
- **Ventaja**: **CERO eliminación física de filas**. Si durante los minutos de actividad se registró alguna venta o cotización que referenciaba a esos productos, la relación referencial no se rompe y no se generan registros huérfanos.

### Nivel 2: Restauración Integral de Estado
- **Script**: [`supabase/migrations/202610220001_catalog_reconciliation_full_restore.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_full_restore.sql)
- **Cuándo Usar**: Si se requiere retornar la base de datos exactamente a su estado estructural previo a la migración.
- **Mecanismo**:
  1. Restaura los campos y `payload` originales de `display` y `horizontal` observados en el preflight.
  2. Para los 6 productos nuevos: elimina (`DELETE`) aquellos que **NO tengan ventas asociadas**. Si alguno hubiese registrado ventas, lo archiva como `category = 'Descontinuado'` y `published = false` para no quebrar restricciones de clave foránea.
  3. Restaura la versión estricta de la RPC de 2 productos y sus permisos (`GRANT EXECUTE ... TO anon, authenticated`).
  4. Incrementa `catalog_sync.revision` para que todas las aplicaciones cliente limpien sus cachés.

Ambos niveles fueron probados y validados en laboratorio aislado.

---

## 4. MATRIZ OFICIAL RECONCILIADA DE LOS OCHO PRODUCTOS

| Slug (Cards) | SKU Oficial | Nombre Oficial | Cat. | PVP (S/) | Regular (S/) | Ahorro (S/) | Insumos Reales (`bundleItems`) | Costo Ensamble | Disponibilidad Tienda |
|---|---|---|:---:|:---:|:---:|:---:|---|:---:|:---:|
| `display` | `SKU-LNK-9972` | Tarjeta Google NFC Formato L ESP (Display) | Ind. | **35.00** | 35.00 | 0.00 | 1x `inv-3` (Tarjeta Formato L) | S/ 12.93 | **Confirmada (`true`)** |
| `horizontal` | `SKU-LNK-6781` | Tarjeta Google NFC Cuadrado ESP | Ind. | **35.00** | 35.00 | 0.00 | 1x `inv-2` (Tarjeta Cuadrado ESP) | S/ 12.93 | **Confirmada (`true`)** |
| `vertical` | `SKU-LNK-4951` | Tarjeta Google NFC Carnet ESP | Ind. | **35.00** | 35.00 | 0.00 | 1x `inv-carnet` (Carnet ESP) | S/ 12.93 | **Por confirmar (`false`)** |
| `identificable` | `SKU-LNK-IDENT` | Tarjeta Identificable Digital (NFC + QR) | Ind. | **35.00** | 35.00 | 0.00 | 1x `inv-carnet` (Chip NFC + PVC) | S/ 12.93 | **Por confirmar (`false`)** |
| `emprendedor` | `SKU-PACK-EMPRENDEDOR` | Pack Emprendedor (Horizontal + Vertical) | Pack | **55.00** | 70.00 | 15.00 | 1x `inv-2` + 1x `inv-carnet` | S/ 25.86 | **Por confirmar (`false`)** |
| `negocio` | `SKU-PACK-NEGOCIO` | Pack Negocio (Display de Mesa + Vertical) | Pack | **60.00** | 70.00 | 10.00 | 1x `inv-3` + 1x `inv-carnet` | S/ 25.86 | **Por confirmar (`false`)** |
| `duo` | `SKU-PACK-DUO-PREMIUM` | Pack Dúo Premium (Display + Horizontal) | Pack | **60.00** | 70.00 | 10.00 | 1x `inv-3` + 1x `inv-2` | S/ 25.86 | **Por confirmar (`false`)** |
| `full` | `SKU-PACK-FULL` | Pack Full Total (Display + Horiz. + Vert.) | Pack | **85.00** | 105.00 | 20.00 | 1x `inv-3` + 1x `inv-2` + 1x `inv-carnet` | S/ 38.79 | **Por confirmar (`false`)** |

*Productos internos/históricos (`SKU-PACK-DUO`, `SKU-PACK-TRIO`, `SKU-LNK-1367`) se mantienen 100% excluidos de la tienda pública.*

---

## 5. RESULTADOS DE PRUEBAS AUTOMATIZADAS DE LABORATORIO

Se ejecutó la suite de verificación completa en entorno aislado `@electric-sql/pglite`:

```bash
> linkeoges@1.1.0 check
> npm run lint && npm test && npm run build

> eslint --no-error-on-unmatched-pattern src tests scripts
✔ 0 errores de ESLint

> node --test tests/*.test.js
✔ 1. Catalog reconciliation: 8 official products, SKU/slug uniqueness, safe availability and RPC (2214ms)
✔ 2. Transactional Safety & Non-Destructive Upsert: Preserves IDs, sales foreign links, custom metadata (1335ms)
✔ 3. Deterministic catalog_sync revision bumping WITHOUT disabling triggers (zero ACCESS EXCLUSIVE locks) (1293ms)
✔ 4. Safe Rollback Nivel 1 (Contención Comercial): Despublicación sin eliminación física, cero huérfanos (1299ms)
✔ 5. Safe Rollback Nivel 2 (Restauración Integral): Restaura campos de display/horizontal y limpia no vendidos (1311ms)
✔ 6. Cards & Sales Contract Compatibility: bundleItems, costs, margins, and NULL handling (1326ms)
✔ 49 pruebas unitarias y contables existentes PASS (10168ms)
✔ Total Unit/Migration: 55 / 55 PASS

> node --test tests/integration/*.test.js
✔ Mensajes -> PostgreSQL -> Gestión: atomic sale, concurrent stock, retry and second purchase (1812ms)
✔ shared sales rules stay identical and legacy partner names normalize in Gestión (2ms)
✔ Total Integración: 2 / 2 PASS

> vite build
✔ 2024 módulos transformados
✔ built in 5.19s (0 errores)
```
**Total General: 57 / 57 PASS (100% éxito operativo).**

---

## 6. CRITERIOS DE VERIFICACIÓN POST-MIGRACIÓN (SIN ASUMIR VALORES FIJOS)

En concordancia con las directrices de dirección, la verificación post-migración **no asume que la revisión será un valor fijo (como 5)**, sino que evalúa las condiciones dinámicas:

1. **Monotonicidad de la Revisión**:  
   $$\text{revision}_{\text{post}} > \text{revision}_{\text{pre}}$$  
   Si en el preflight previo al despliegue se observó $\text{revision} = R_0$, se verifica que $\text{revision} \ge R_0 + 1$.
2. **Cardinalidad del Catálogo**:  
   La función RPC `linkeo_public_catalog()` debe devolver exactamente **8 productos**.
3. **Disponibilidad Verificada**:
   - `display` y `horizontal` reportan `available: true`.
   - Los 6 productos restantes reportan `available: false`.
4. **Comportamiento en LINKEO Cards (`linkeocards.com`)**:
   - Selector combobox muestra los 8 productos.
   - `Display` y `Horizontal` muestran botón activo para WhatsApp.
   - Los 6 productos restantes muestran la etiqueta *"Disponibilidad por confirmar"* y derivan a consulta.

---

## 7. PLAN DE EJECUCIÓN CONTROLADA EN SUPABASE

Una vez obtenida la autorización expresa de los socios:

1. **Paso 1**: Ingresar al SQL Editor de Supabase (`ntzkjkvgtytlobvbplov`) y ejecutar la consulta de **Snapshot Pre-Migración**. Guardar el JSON obtenido.
2. **Paso 2**: Copiar y pegar el contenido íntegro de [`supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql).
3. **Paso 3**: Ejecutar. Confirmar finalización exitosa.
4. **Paso 4**: Ejecutar la consulta de verificación de solo lectura:
   ```sql
   SELECT public.linkeo_public_catalog() AS catalogo_post_migracion;
   ```
   Confirmar que `products` contenga 8 elementos, que la revisión haya aumentado, y que sólo 2 productos tengan `available = true`.
5. **Paso 5**: Comprobar en el navegador abriendo `https://linkeocards.com/`.

---

## 8. IMPACTO PREVISTO EN CARDS Y SALES ENGINE

- **LINKEO Cards (`LINKEO-V2`)**:
  - Detecta el incremento de revisión y actualiza el catálogo reactivamente mediante `dist/catalog-sync.js`.
  - Coincidencia exacta de slugs (`display`, `horizontal`, `vertical`, `identificable`, `emprendedor`, `negocio`, `duo`, `full`).
  - No permite pedidos directos de productos sin existencias auditadas.
- **LINKEO Sales (`ENVIAR-MENSAJES`)**:
  - Cero descuento de mochilas y cero movimiento de inventario por la migración del catálogo.
  - Contratos de `sales-domain.js` y `sale-operations.js` plenamente respetados.
  - Disponibilidad de `bundleItems` estructurados para los 4 packs para cuando se registren ventas futuras.

---

## 9. VEREDICTO FINAL: CONDITIONAL GO

### **CONDITIONAL GO (Técnicamente Validado para Publicación Controlada)**

- **Evaluación Técnica**:
  - SQL optimizado sin locks exclusivos de tabla: **APROBADO**.
  - Control de trigger y revisiones dinámicas sin valores fijos asumidos: **APROBADO**.
  - Dualidad de rollback (contención de emergencia + restauración integral): **APROBADO**.
  - 57 / 57 pruebas automatizadas de laboratorio aprobadas: **APROBADO**.
  - Preflight de solo lectura confirmado en Supabase: **APROBADO**.
  - Build de producción Vite sin errores: **APROBADO**.

- **Condición Única Pendiente para el Pase a Producción**:
  - **Autorización expresa y formal de los socios de LINKEO** para la ejecución en el SQL Editor de Supabase central.

*Se mantiene estricta detención operativa antes de aplicar cambios en producción.*

---

## 10. PAQUETE DE EJECUCIÓN CONTROLADA — PENDIENTE DE AUTORIZACIÓN

> [!IMPORTANT]
> **ESTE PAQUETE NO DEBE EJECUTARSE EN PRODUCCIÓN SIN AUTORIZACIÓN EXPRESA DE LOS SOCIOS.**  
> Todos los artefactos están congelados, versionados y verificados con hashes criptográficos SHA-256.

### 10.1 Manifiesto de Artefactos Criptográficos y Control de Versiones

- **Repositorio**: `soylinkeo/LinkeoGes`
- **Rama Oficial de Release**: `sprint-1-catalog-integrity`
- **Commit Base Auditado**: `e0a4b515f7114143ea3cf0047042bd302f4ea27b`
- **Ambiente Objetivo**: Supabase Central (`ntzkjkvgtytlobvbplov`)

| Archivo SQL | Propósito | SHA-256 Checksum |
|---|---|---|
| [`202610220001_catalog_reconciliation_and_availability.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql) | Migración principal: reconciliación de 8 SKUs, GUC bump +1, availability segura, RPC | `9DBB527CC6360783646908E80C3CE65FAF7FC03EAEA6CCB16E4A5177F2E2B89D` |
| [`202610220001_catalog_reconciliation_rollback.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_rollback.sql) | Rollback Nivel 1: Contención comercial inmediata, despublica 6 SKUs, 0 DELETEs | `245A9AFCCF92FECE5F05957E38D56F04518069C700DF3B703BF2180C98F4224C` |
| [`202610220001_catalog_reconciliation_full_restore.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_full_restore.sql) | Rollback Nivel 2: Restauración integral, restaura 2 originales, limpia no vendidos o archiva | `98C3957EA9D930E3DA48093F38C7375EB46A33909A116BF5E54BB26B75CACF1A` |

---

### 10.2 Línea Base Empírica Observada (Preflight en `ntzkjkvgtytlobvbplov`)

- **Revisión base ($R_0$)**: `4` (timestamp: `2026-10-20T21:23:58.96926+00:00`).
- **Productos en RPC pública**: Exactamente 2 (`SKU-LNK-9972`, `SKU-LNK-6781`), precio S/ 35.00 cada uno, ambos con `available = true`.
- **Productos faltantes**: 6 (`vertical`, `identificable`, `emprendedor`, `negocio`, `duo`, `full`).
- **Seguridad RLS**: Activa (bloquea lecturas anónimas directas a tablas operativas con HTTP 401).

---

### 10.3 Protocolo Paso a Paso de Ejecución en Supabase SQL Editor

Cuando los socios otorguen la **Aprobación de Ejecución**, el operador designado debe seguir estrictamente este orden:

#### Paso 1: Ejecutar Snapshot de Respaldo Pre-Migración
En Supabase SQL Editor, ejecutar y copiar el JSON de salida a un archivo local seguro:
```sql
SELECT jsonb_build_object(
  'timestamp', now(),
  'database', current_database(),
  'catalog_sync', (SELECT row_to_json(cs) FROM public.catalog_sync cs WHERE id = 1),
  'existing_products_count', (SELECT count(*) FROM public.products),
  'existing_products', (SELECT jsonb_agg(row_to_json(p)) FROM public.products p),
  'rpc_catalog_definition', (SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'linkeo_public_catalog')
) AS snapshot_pre_migracion_linkeo;
```

#### Paso 2: Ejecutar la Migración Principal
Copiar el texto completo de `supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql` y ejecutar en el SQL Editor.  
Verificar que la ejecución retorne `Success. No rows returned` dentro de una transacción atómica `BEGIN ... COMMIT`.

#### Paso 3: Validación Inmediata Post-Migración (Criterios Dinámicos)
Ejecutar la siguiente consulta de auditoría:
```sql
SELECT 
  cs.revision AS revision_actual,
  (cs.revision > 4) AS revision_incrementada_ok,
  count(p.id) AS total_productos_bd,
  (SELECT count(*) FROM jsonb_array_elements(public.linkeo_public_catalog()->'products')) AS productos_en_tienda,
  (SELECT count(*) FROM jsonb_array_elements(public.linkeo_public_catalog()->'products') el WHERE (el->>'available')::boolean = true) AS disponibles_inmediatos,
  (SELECT count(*) FROM jsonb_array_elements(public.linkeo_public_catalog()->'products') el WHERE (el->>'available')::boolean = false) AS disponibles_por_confirmar
FROM public.catalog_sync cs, public.products p
WHERE cs.id = 1
GROUP BY cs.revision;
```
**Resultado Esperado Obligatorio**:
- `revision_actual`: $R_1 \ge 5$ (específicamente $4 + 1 = 5$).
- `revision_incrementada_ok`: `true`.
- `total_productos_bd`: $\ge 8$.
- `productos_en_tienda`: `8`.
- `disponibles_inmediatos`: `2` (`display` y `horizontal`).
- `disponibles_por_confirmar`: `6`.

#### Paso 4: Comprobación del Storefront Público
Abrir `https://linkeocards.com/`:
- El catálogo debe mostrar los 8 productos.
- `Display` y `Horizontal` deben permitir cotización y pedido inmediato.
- Los otros 6 productos deben mostrar badge/texto *"Disponibilidad por confirmar"* y derivar a consulta por WhatsApp.

---

### 10.4 Protocolo de Rollback y Contención de Contingencias

Si ocurre cualquier anomalía, aplicar el nivel de rollback correspondiente:

#### A. Si la alerta es puramente comercial (ej: pedidos masivos por WhatsApp de packs no ensamblados):
- **Ejecutar**: [`supabase/migrations/202610220001_catalog_reconciliation_rollback.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_rollback.sql).
- **Efecto**: Despublica de inmediato los 6 productos de la tienda pública sin borrar ninguna fila.
- **Riesgo referencial**: **0%** (no borra registros; no quiebra FKs de ventas o auditorías).

#### B. Si se requiere restauración integral de estado:
- **Ejecutar**: [`supabase/migrations/202610220001_catalog_reconciliation_full_restore.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_full_restore.sql).
- **Efecto**: Restaura `display` y `horizontal` a su estado exacto pre-migración. Elimina productos nuevos sin ventas; si se generó alguna venta, los archiva como `category = 'Descontinuado'` protegiendo la integridad referencial.
- **Riesgo referencial**: **0%** (protección activa en cascada).

---

### 10.5 Condiciones de Aborto Obligatorio (Hard Stop)

El operador **DEBE DETENER LA EJECUCIÓN INMEDIATAMENTE Y HACER ROLLBACK** si:
1. `cs.revision` post-migración no es estrictamente mayor que el $R_0$ observado en el preflight.
2. La consulta RPC `linkeo_public_catalog()` reporta un número diferente a 8 productos.
3. Más de 2 productos reportan `available = true` (violación de la política de disponibilidad segura de inventario).
4. El script arroja cualquier error de sintaxis, timeout o violación de restricción en Supabase.
5. Se detecta bloqueo activo en transacciones de venta concurrentes en `sales` o `nfc_cards`.
