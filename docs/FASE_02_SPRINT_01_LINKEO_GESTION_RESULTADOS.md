# LINKEO GESTIÓN — FASE 02 / SPRINT 1
## Integridad del Catálogo Central, Sincronización con Cards y Preparación de Publicación
**Informe Técnico y Operativo de Resultados**  
*Fecha: 22 de octubre de 2026 (America/Lima)*  
*Rama: `sprint-1-catalog-integrity` (sobre HEAD `e0a4b51`)*  
*Equipo: Principal Database Architect · Senior Full Stack Engineer · DevSecOps Engineer · QA Lead · Product Operations Architect*  
*Veredicto de Ejecución en Producción: **CONDITIONAL GO (Técnicamente Preparado / Pendiente de Autorización de Escritura)***

---

## 1. RESUMEN EJECUTIVO Y ESTADO DE IDENTIDAD

En cumplimiento estricto con las restricciones de la Fase 02:
- **NO se ejecutaron escrituras en el Supabase de producción**.
- **NO se alteró inventario físico, ventas ni registros contables**.
- **NO se modificaron LINKEO Cards ni LINKEO Sales**.
- **NO se realizó push a main ni merge**.
- Se operó en la rama local aislada: `sprint-1-catalog-integrity`.
- Se verificó la identidad de cuentas oficiales: GitHub `soylinkeo`, Vercel `soylinkeos-projects` (`linkeo-ges`), Supabase `ntzkjkvgtytlobvbplov`.

---

## 2. DIAGNÓSTICO CONFIRMADO DEL CATÁLOGO Y HALLAZGOS CRÍTICOS

Se inspeccionó de forma estricta y no destructiva la base de datos central y las migraciones existentes. Se confirmaron los 4 hallazgos investigados:

### Hallazgo A: La migración de precios a S/ 35 solo actualizaba, no insertaba
- **Evidencia**: `supabase/migrations/202610200002_nfc_price_update_35.sql` contiene exclusivamente una cláusula `UPDATE public.products ... WHERE product.sku = update.sku`.
- **Causa Raíz**: Si un SKU no existía previamente en la tabla `products`, la migración no lo creaba ni reportaba error (0 filas afectadas para ese SKU). Por tanto, ejecutarla por sí sola no resolvía los productos faltantes.

### Hallazgo B: Packs históricos e internos vs Productos oficiales de Cards
- **Evidencia**: En `src/data/initialData.js` y migraciones previas existen SKUs como:
  - `SKU-PACK-DUO` (Pack Restaurante Dúo: 2 tarjetas horizontales cuadradas para caja y barra).
  - `SKU-PACK-TRIO` (Combo Corporativo Trío: 2 tarjetas cuadradas + 1 display).
  - `SKU-LNK-1367` (Tarjeta Google Cuadrado ING para hoteles/turismo).
- **Causa Raíz**: Fueron configuraciones iniciales para restaurantes y turismo en Lima. **No deben publicarse en LINKEO Cards**, ya que el catálogo oficial de la tienda pública consta de **4 modelos individuales y 4 packs específicos**.

### Hallazgo C: Fallbacks comerciales obsoletos en la función RPC
- **Evidencia**: En `supabase/migrations/202610130001_storefront_and_catalog.sql`, la función `linkeo_public_catalog()` definía en su cláusula `CASE`:
  - `WHEN p.sku = 'SKU-PACK-FULL' THEN 180.00`
  - `WHEN p.sku = 'SKU-PACK-DUO-PREMIUM' THEN 140.00`
  - `WHEN p.sku = 'SKU-PACK-NEGOCIO' THEN 120.00`
  - `WHEN p.sku = 'SKU-PACK-EMPRENDEDOR' THEN 100.00`
  - Ahorros: 30.00 y 20.00.
- **Riesgo**: Si un registro nuevo no contenía `regularPrice` en su payload, la RPC pública habría retornado precios regulares y ahorros correspondientes a una lista de precios antigua descontinuada.

### Hallazgo D: Peligro de disponibilidad por defecto `COALESCE(available, true)`
- **Evidencia**: La línea 154 de la RPC definía:
  `'available', coalesce((p.payload->'web'->>'available')::boolean, true)`
- **Impacto**: Si se insertaban los productos faltantes sin definir explícitamente `web.available = false`, la API los habría catalogado inmediatamente como *"En Stock"* (`available = true`), induciendo a error al storefront y habilitando pedidos directos de packs sin validar si sus insumos físicos existen en almacén.

---

## 3. MATRIZ OFICIAL Y RECONCILIADA DE LOS OCHO PRODUCTOS

A continuación se establece la **Matriz Maestra Única** entre LINKEO Gestión y LINKEO Cards:

| Slug (Cards) | SKU Oficial | Nombre Oficial | Cat. | Precio Venta | Precio Regular | Ahorro | Componentes Reales (`bundleItems`) | Costo Ensamble | Disponibilidad Segura |
|---|---|---|:---:|:---:|:---:|:---:|---|:---:|:---:|
| `display` | `SKU-LNK-9972` | Tarjeta Google NFC Formato L ESP (Display) | Ind. | **S/ 35.00** | S/ 35.00 | S/ 0.00 | 1x `inv-3` (Tarjeta Formato L) | S/ 12.93 | **Confirmada (`true`)** |
| `horizontal` | `SKU-LNK-6781` | Tarjeta Google NFC Cuadrado ESP | Ind. | **S/ 35.00** | S/ 35.00 | S/ 0.00 | 1x `inv-2` (Tarjeta Cuadrado ESP) | S/ 12.93 | **Confirmada (`true`)** |
| `vertical` | `SKU-LNK-4951` | Tarjeta Google NFC Carnet ESP | Ind. | **S/ 35.00** | S/ 35.00 | S/ 0.00 | 1x `inv-carnet` (Carnet ESP) | S/ 12.93 | **Por confirmar (`false`)** |
| `identificable` | `SKU-LNK-IDENT` | Tarjeta Identificable Digital (NFC + QR) | Ind. | **S/ 35.00** | S/ 35.00 | S/ 0.00 | 1x `inv-carnet` (Chip NFC + PVC) | S/ 12.93 | **Por confirmar (`false`)** |
| `emprendedor` | `SKU-PACK-EMPRENDEDOR` | Pack Emprendedor (Horizontal + Vertical) | Pack | **S/ 55.00** | S/ 70.00 | S/ 15.00 | 1x `inv-2` + 1x `inv-carnet` | S/ 25.86 | **Por confirmar (`false`)** |
| `negocio` | `SKU-PACK-NEGOCIO` | Pack Negocio (Display de Mesa + Vertical) | Pack | **S/ 60.00** | S/ 70.00 | S/ 10.00 | 1x `inv-3` + 1x `inv-carnet` | S/ 25.86 | **Por confirmar (`false`)** |
| `duo` | `SKU-PACK-DUO-PREMIUM` | Pack Dúo Premium (Display + Horizontal) | Pack | **S/ 60.00** | S/ 70.00 | S/ 10.00 | 1x `inv-3` + 1x `inv-2` | S/ 25.86 | **Por confirmar (`false`)** |
| `full` | `SKU-PACK-FULL` | Pack Full Total (Display + Horiz. + Vert.) | Pack | **S/ 85.00** | S/ 105.00 | S/ 20.00 | 1x `inv-3` + 1x `inv-2` + 1x `inv-carnet` | S/ 38.79 | **Por confirmar (`false`)** |

*Productos Internos/Históricos Excluidos de Publicación Web*:
- `SKU-PACK-DUO` (Restaurante Dúo histórico).
- `SKU-PACK-TRIO` (Combo Trío histórico).
- `SKU-LNK-1367` (Tarjeta inglés turismo).

---

## 4. REGLAS DE DISPONIBILIDAD COMERCIAL

Se formalizan e implementan 6 estados operativos diferenciados:
1. **Producto Registrado**: Existe en `public.products` pero no tiene metadato `web.published = true`. Uso exclusivo para almacén y cotizaciones internas.
2. **Producto Publicado**: `web.published = true`. Es visible en el catálogo de Cards.
3. **Producto Vendible (In Stock)**: Publicado y con `available = true` verificado. Habilita botón directo: *"Enviar pedido a WhatsApp"*.
4. **Producto sin Stock Confirmado**: Publicado con `available = false`. Muestra *"Disponibilidad por confirmar"* y deriva al botón: *"Consultar disponibilidad por WhatsApp"*.
5. **Producto Agotado**: Existencias físicas en 0 de al menos uno de sus insumos componentes en almacén.
6. **Producto Descontinuado**: Eliminado o con `published = false`. No se expone en la API.

---

## 5. SOLUCIÓN TÉCNICA PREPARADA (CÓDIGO Y MIGRACIÓN)

Se prepararon dos componentes técnicos en el repositorio:

### A. Migración SQL Idempotente y Reversible
Archivo preparado: [`supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql)
- **Insert / Upsert Idempotente**: Inserta los 8 productos oficiales mediante `ON CONFLICT (sku) DO UPDATE ...`. Si ya existen, actualiza precios vigentes y metadatos sin duplicar filas.
- **Corrección de la RPC `linkeo_public_catalog()`**:
  - Reemplaza los fallbacks obsoletos (180, 140, 120, 100) por los valores oficiales (105, 70, 70, 70).
  - Reemplaza fallbacks de ahorro por 20, 15, 10 y 10.
  - Corrige la disponibilidad por defecto a:
    `'available', coalesce((p.payload->'web'->>'available')::boolean, false)`
    Garantizando que si no hay confirmación física explícita, se comunique disponibilidad por confirmar.
  - Incrementa la revisión en `public.catalog_sync` para notificar al storefront.

### B. Mejora UX Operativa en Gestión
Archivo modificado: [`src/components/ProductsCatalogView.jsx`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/src/components/ProductsCatalogView.jsx)
- Se incorporó un botón no destructivo de **"Ver en Cards"** (`ExternalLink`) en cada tarjeta de producto.
- Permite al socio o administrador abrir la página pública correspondiente en `linkeocards.com` (ej: `/productos/display.html` o `/packs/full.html`) en una nueva pestaña para previsualizar la experiencia de compra sin alterar datos de producción.

---

## 6. PRUEBAS AUTOMATIZADAS Y EVIDENCIAS DE LABORATORIO

Se creó la suite automatizada aislada [`tests/catalog-reconciliation.test.js`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/tests/catalog-reconciliation.test.js) utilizando el motor en memoria `@electric-sql/pglite`.

### Cobertura de la Suite Creada:
1. Ejecución de esquema base y migraciones históricas en entorno aislado.
2. Inserción de los productos oficiales mediante la nueva migración.
3. Prueba de **idempotencia**: ejecución consecutiva de la migración sin fallos ni duplicaciones.
4. Verificación de unicidad de los 8 SKUs y slugs.
5. Validación de precios y ahorros exactos de la matriz oficial.
6. Validación de la regla de disponibilidad segura:
   - `display` y `horizontal` -> `available: true`.
   - `vertical`, `identificable` y los 4 packs -> `available: false`.
7. Validación de exclusión de productos históricos e internos (`SKU-PACK-DUO`, `SKU-PACK-TRIO`, `SKU-LNK-1367`).
8. Incremento verificado de la revisión en `catalog_sync`.

### Resultado de la Ejecución Completa (`npm run check`):
```bash
> eslint --no-error-on-unmatched-pattern src tests scripts
✔ 0 errores de lint

> node --test tests/*.test.js
✔ 50 / 50 tests unitarios y de migración PASS (12.4s)

> node --test tests/integration/*.test.js
✔ 2 / 2 tests de integración PASS (2.2s)

> vite build
✔ 2024 módulos transformados.
✔ built in 5.50s (0 errores)
```
**Total: 52 / 52 PASS (100% éxito en pruebas automatizadas).**

---

## 7. PLAN DE EJECUCIÓN POSTERIOR EN PRODUCCIÓN

Cuando la dirección autorice la publicación de los productos en Supabase, el procedimiento será:

1. **Paso 1 (Respaldo)**: Ejecutar lectura y exportación de la tabla `products` actual.
2. **Paso 2 (Aplicación de Migración)**: Ejecutar `202610220001_catalog_reconciliation_and_availability.sql` en el SQL Editor de Supabase (`ntzkjkvgtytlobvbplov`).
3. **Paso 3 (Verificación)**: Consultar la RPC pública mediante `check_catalog_rpc.py` y verificar que retorne 8 productos con revisión incrementada (Revision 5).
4. **Paso 4 (Inspección en Tienda)**: Abrir `https://linkeocards.com` y verificar que los 8 productos carguen correctamente sus precios oficiales, manteniendo el flujo de consulta por WhatsApp en los productos por confirmar.

### Plan de Rollback:
Si se requiriese revertir:
```sql
BEGIN;
DELETE FROM public.products WHERE sku IN (
  'SKU-LNK-4951', 'SKU-LNK-IDENT', 'SKU-PACK-EMPRENDEDOR',
  'SKU-PACK-NEGOCIO', 'SKU-PACK-DUO-PREMIUM', 'SKU-PACK-FULL'
);
-- Restaurar versión previa de la RPC desde 202610130001_storefront_and_catalog.sql
COMMIT;
```

---

## 8. RECOMENDACIÓN FINAL: CONDITIONAL GO

- **Código y Migración**: **100% listos y validados en laboratorio aislado**.
- **Acción Inmediata**: Mantener los cambios en la rama `sprint-1-catalog-integrity`.
- **Siguiente Paso Operativo**: Someter la migración a revisión de los socios y, una vez autorizada la confirmación de stock, ejecutar el script SQL de publicación en Supabase.