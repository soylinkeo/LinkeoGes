# LINKEO GESTIÓN — FASE 02 / SPRINT 1
## RUNBOOK OPERATIVO: PROCEDIMIENTO DE EJECUCIÓN CONTROLADA EN PRODUCCIÓN
**Catálogo Central, Reglas de Disponibilidad y Protocolo de Pase a Producción**  
*Fecha: 22 de octubre de 2026 (America/Lima)*  
*Proyecto: `soylinkeo/LinkeoGes`*  
*Rama Oficial: `sprint-1-catalog-integrity` (sobre commit `e0a4b515f7114143ea3cf0047042bd302f4ea27b`)*  
*Entornos: Supabase Central (`ntzkjkvgtytlobvbplov`) · Vercel (`soylinkeos-projects` / `linkeo-ges`)*  
*Roles: Release Manager · Supabase Database Administrator · DevSecOps Engineer*  
*Estado Operativo: **CONDITIONAL GO (Técnicamente Validado / Pendiente de Autorización de Socios)***

---

> [!CAUTION]
> **ESTRICTA DETENCIÓN OPERATIVA PRE-PRODUCCIÓN**  
> Este documento define el procedimiento técnico y operativo a seguir **ÚNICAMENTE TRAS RECIBIR LA AUTORIZACIÓN EXPRESA DE AMBOS SOCIOS FUNDADORES DE LINKEO**.  
> **NO SE DEBEN EJECUTAR ESCRITURAS EN LA BASE DE DATOS DE PRODUCCIÓN NI DESPLIEGUES EN VERCEL HASTA CONTAR CON DICHA APROBACIÓN.**

---

## 1. PAQUETE CONGELADO Y VERIFICACIÓN CRIPTOGRÁFICA DE SHA-256

El paquete de scripts SQL se encuentra formalmente **congelado** en el repositorio. Antes de cualquier ejecución, el operador debe verificar que los archivos en disco posean exactamente los siguientes hashes SHA-256:

| Componente | Script SQL | SHA-256 Checksum Oficial | Estado |
|---|---|---|:---:|
| **Migración Principal** | [`supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql) | `9DBB527CC6360783646908E80C3CE65FAF7FC03EAEA6CCB16E4A5177F2E2B89D` | **VERIFICADO** |
| **Rollback de Contención (Nivel 1)** | [`supabase/migrations/202610220001_catalog_reconciliation_rollback.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_rollback.sql) | `245A9AFCCF92FECE5F05957E38D56F04518069C700DF3B703BF2180C98F4224C` | **VERIFICADO** |
| **Restauración Integral (Nivel 2)** | [`supabase/migrations/202610220001_catalog_reconciliation_full_restore.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_full_restore.sql) | `98C3957EA9D930E3DA48093F38C7375EB46A33909A116BF5E54BB26B75CACF1A` | **VERIFICADO** |

> [!WARNING]
> Si cualquiera de los hashes calculados difiere de los valores indicados, **la operación queda inmediatamente abortada** y debe someterse a nueva auditoría. Queda terminantemente prohibido reemplazar o modificar scripts silenciosamente.

### Precisión Técnica sobre el Manejo de Concurrencia
El mecanismo implementado en `bump_catalog_sync()` opera como un **control de revisión sin deshabilitar triggers**:
- Utiliza una variable de configuración de sesión local a la transacción (`set_config('linkeo.catalog_bumped', 'true', true)`).
- **Evita bloqueos de tabla**: No ejecuta `ALTER TABLE ... DISABLE TRIGGER`, eliminando la adquisición de bloqueos de tipo `ACCESS EXCLUSIVE` sobre la tabla `public.products`. Las consultas de lectura (`SELECT`) de la operación diaria no son bloqueadas.
- **Control de concurrencia estándar**: Las escrituras concurrentes están sujetas a la semántica estándar MVCC de PostgreSQL, serializando ordenadamente mediante el bloqueo de fila habitual sobre el registro `public.catalog_sync WHERE id = 1`.

---

## 2. LISTA DE CONDICIONES PREVIAS (CHECKLIST DE VENTANA DE EJECUCIÓN)

Antes de iniciar la ventana de ejecución, el operador y el supervisor técnico deben constatar el cumplimiento de todos los siguientes puntos:

- [ ] **1. Autorización Formal Otorgada**: Constancia por escrito de la aprobación expresa de ambos socios fundadores de LINKEO.
- [ ] **2. Verificación de Identidad**: Proyecto Supabase confirmado: `ntzkjkvgtytlobvbplov` (organización `soylinkeo`). Repositorio: `soylinkeo/LinkeoGes`.
- [ ] **3. Confirmación de Línea Base en Producción**:
  - `catalog_sync.revision` registrado en $R_0 = 4$ (o valor observado en preflight inmediato).
  - Exactamente 2 productos expuestos en la tienda: `Display` (`SKU-LNK-9972`) y `Horizontal` (`SKU-LNK-6781`), ambos a S/ 35.00 con `available = true`.
- [ ] **4. Respaldo Integral Previo (Snapshot)**: Ejecución y almacenamiento del script de snapshot pre-migración en formato JSON.
- [ ] **5. Disponibilidad Inmediata de Rollback**: Scripts de Nivel 1 y Nivel 2 cargados en pestañas independientes del SQL Editor o consola local listos para ejecución.
- [ ] **6. Ventana Libre de Operaciones Concurrentes**: Comprobación en `sales` y `audit_logs` de que no existan cierres contables masivos o transacciones de inventario en curso en ese momento.
- [ ] **7. Roles Designados**: Identificación nominal del responsable de ejecución y del supervisor técnico.

*Si cualquiera de las condiciones anteriores no se cumple al 100%, la ejecución se detiene de inmediato.*

---

## 3. PROTOCOLO DE AUTORIZACIÓN FORMAL DE LOS SOCIOS

Para habilitar la ventana operativa, se requiere la aprobación explícita de los dos socios de LINKEO bajo el siguiente alcance:

1. **Aprobación de la Migración Principal (A)**: Autorización para aplicar el script `202610220001_catalog_reconciliation_and_availability.sql` en Supabase central.
2. **Aprobación de Contención Comercial (B)**: Autorización pre-otorgada para aplicar inmediatamente el Rollback de Nivel 1 (`202610220001_catalog_reconciliation_rollback.sql`) si cualquier validación post-migración arroja anomalías.
3. **Restricción de Restauración Integral (Nivel 2)**: La ejecución del Rollback de Nivel 2 (que involucra modificación o archivo de productos) **requerirá una consulta y revisión técnica específica adicional**, a menos que los socios hayan otorgado autorización previa explícita y particularizada para dicho procedimiento de restauración completa.

### Acta Oficial de Autorización de Cambio en Producción

```markdown
# LINKEO — AUTORIZACIÓN DE CAMBIO EN PRODUCCIÓN

**Proyecto:** LINKEO Gestión  
**Fase:** 02 / Sprint 1  
**Entorno:** Supabase Central ntzkjkvgtytlobvbplov  
**Objeto:** Reconciliación y publicación controlada del catálogo de ocho productos oficiales.

**Alcance aprobado para consideración:**
- Registrar o reconciliar los productos definidos en el paquete congelado.
- Conservar los precios oficiales.
- Mantener available=false para los seis productos sin stock confirmado.
- Preservar ventas, inventario y registros financieros.
- Ejecutar el procedimiento de verificación posterior.

**Autorización A — Migración principal:** Pendiente de aprobación expresa.
**Autorización B — Contención comercial Nivel 1 ante anomalías confirmadas:** Pendiente de aprobación expresa.
**Restauración integral Nivel 2:** No autorizada por esta acta; requiere aprobación específica.

**Aprobación de los socios:**
- Luis: [ ] Pendiente de aprobación expresa
- Kevin: [ ] Pendiente de aprobación expresa

**Condición:** No ejecutar ninguna escritura mientras ambas autorizaciones A y B no estén confirmadas y registradas.
**Resultado esperado:** Ocho productos sincronizados con LINKEO Cards; dos con disponibilidad confirmada (Display y Horizontal), y seis disponibles únicamente para consulta comercial vía WhatsApp.
```

> [!IMPORTANT]
> **Este informe NO constituye autorización de producción.** Hasta recibir la aprobación expresa de Luis y Kevin para las autorizaciones A y B, Supabase permanece 100% intacto y el paquete se mantiene congelado.

---

## 4. PROCEDIMIENTO OPERATIVO TRAS AUTORIZACIÓN (PASO A PASO)

Una vez obtenida la autorización formal, el operador procederá con el siguiente flujo secuencial de 12 pasos:

### Paso 1: Preflight Inmediato de Solo Lectura
Ejecutar en el SQL Editor de Supabase (`ntzkjkvgtytlobvbplov`):
```sql
SELECT 
  cs.revision,
  cs.updated_at,
  (SELECT count(*) FROM public.products) AS total_productos,
  (SELECT count(*) FROM jsonb_array_elements(public.linkeo_public_catalog()->'products')) AS storefront_count
FROM public.catalog_sync cs
WHERE cs.id = 1;
```
*Registrar el valor de `revision` como $R_{\text{pre}}$.*

### Paso 2: Generar y Descargar Respaldo Pre-Migración
Ejecutar la consulta de snapshot y exportar/copiar el JSON resultante:
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

### Paso 3: Aplicación de la Migración Principal Aprobada
Copiar el contenido íntegro de [`supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_and_availability.sql) en el SQL Editor.  
Ejecutar la consulta. La transacción atómica debe concluir con mensaje `Success`.

### Paso 4: Registro del Resultado Operativo
Anotar el timestamp exacto de finalización, duración de la consulta en milisegundos y asegurar que no se hayan generado errores o advertencias. En ningún caso se deben compartir o divulgar credenciales de conexión.

### Paso 5: Validación de la RPC Pública
Ejecutar la función RPC:
```sql
SELECT public.linkeo_public_catalog() AS catalogo_resultado;
```
Verificar que la clave `products` contenga exactamente **8 elementos**.

### Paso 6: Verificación de los Ocho Slugs y Precios
Comprobar la lista devuelta por la RPC:
- `display`: S/ 35.00
- `horizontal`: S/ 35.00
- `vertical`: S/ 35.00
- `identificable`: S/ 35.00
- `emprendedor`: S/ 55.00
- `negocio`: S/ 60.00
- `duo`: S/ 60.00
- `full`: S/ 85.00

### Paso 7: Confirmación de Disponibilidad Inmediata (Stock Físico Verificado)
Verificar que **únicamente** los dos productos con existencias en mostrador reporten disponibilidad activa:
- `display` -> `available: true`
- `horizontal` -> `available: true`

### Paso 8: Confirmación de Disponibilidad por Confirmar (Consulta)
Verificar que los 6 productos restantes reporten:
- `available: false` (o `false` implícito mediante `coalesce`).

### Paso 9: Auditoría de Integridad de Ventas e Inventario
Ejecutar consulta de verificación para asegurar que la migración no haya alterado movimientos históricos:
```sql
SELECT 
  (SELECT count(*) FROM public.sales) AS total_ventas,
  (SELECT count(*) FROM public.inventory) AS total_inventario,
  (SELECT count(*) FROM public.nfc_cards) AS total_cards;
```
> [!NOTE]
> **Cuidado Operativo — Actividad Comercial Concurrente**:  
> Si se registra una venta legítima durante la ventana de ejecución, los conteos pueden incrementarse de forma normal. El operador debe inspeccionar `created_at` en `public.sales`: si el incremento corresponde a una venta real registrada por un vendedor, la prueba es válida. Lo crítico es verificar que **ninguna venta previa haya quedado huérfana o alterada** en sus montos y enlaces `product_id`.

### Paso 10: Comprobación Funcional en LINKEO Cards (`linkeocards.com`)
Abrir en el navegador en modo incógnito: `https://linkeocards.com/` (sin realizar cambios en el repositorio de Cards).
- Confirmar que el combobox de selección presente los 8 productos reconciliados.
- Confirmar que `Display` y `Horizontal` permitan continuar al pedido directo.
- Confirmar que los otros 6 productos muestren el aviso de disponibilidad por confirmar y deriven a WhatsApp para consulta.

### Paso 11: Registro de la Nueva Revisión de Catálogo
Ejecutar:
```sql
SELECT revision, updated_at FROM public.catalog_sync WHERE id = 1;
```
Confirmar que:
$$\text{revision}_{\text{post}} \ge R_{\text{pre}} + 1$$

### Paso 12: Activación de Contención Comercial (Nivel 1) ante Desviaciones Confirmadas
> [!WARNING]
> **Cuidado Operativo — Evitar Rollbacks Precipitados por Falso Positivo**:  
> Un timeout de red, microcorte o demora temporal en la respuesta de Supabase **NO debe desencadenar un rollback automático**.  
> El operador debe seguir este protocolo de diagnóstico:
> 1. Verificar si la migración llegó a confirmarse (`COMMIT`) en Supabase revisando `catalog_sync.revision`.
> 2. Reintentar la consulta de verificación de solo lectura.
> 3. Solo si se constata fehacientemente una falla lógica (ej. productos incorrectos, más de 2 con disponibilidad activa, o error de restricción), proceder a ejecutar el **Rollback Nivel 1** ([`202610220001_catalog_reconciliation_rollback.sql`](file:///C:/Users/Luis%20Romero/Documents/Proyectos/Linkeo_Ges/supabase/migrations/202610220001_catalog_reconciliation_rollback.sql)), el cual despublica de inmediato los 6 productos sin borrar registros.

---

## 5. PROTOCOLO DE CIERRE Y NOTION

Tras completar satisfactoriamente la ejecución y las 12 comprobaciones anteriores:

1. **Generación de Acta de Publicación**:
   - Fecha, hora de inicio y hora de fin (UTC y Lima).
   - Operador ejecutor y supervisor.
   - Hash del script aplicado y hash del snapshot de respaldo.
   - Revisión previa ($R_{\text{pre}}$) y revisión final ($R_{\text{post}}$).
   - Resumen de pruebas post-ejecución.

2. **Actualización en Notion**:
   - **Hoja Principal** ([`e61c71e2-c2ac-48ab-a1f0-f1cc1ace172e`](https://app.notion.com/p/LINKEO-Plataforma-NFC-Identidad-Digital-e61c71e2c2ac48aba1f0f1cc1ace172e)): Añadir el hito de publicación en la bitácora cronológica con estado oficial **CERRADO EN PRODUCCIÓN**.
   - **Subpágina Anexa** ([`40170a8b-90f1-81b1-93c2-fc5417ae196e`](https://app.notion.com/p/Anexo-LINKEO-Gesti-n-Auditor-a-T-cnica-Operativa-y-Comercial-Fase-01-40170a8b90f181b193c2fc5417ae196e)): Registrar la sección 12 con el acta técnica, métricas post-publicación y registro de confirmación del catálogo en producción.

3. **Condición de Estado**:
   - Mientras **NO** exista autorización formal y ejecución validada, el estado se preserva en **`CONDITIONAL GO`**, y la base de producción permanece **100% INTACTA**.
