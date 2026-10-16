# Auditoría de integración LINKEO — 16 de octubre de 2026

## Resultado

Integración parcial. Los tres proyectos apuntan a Supabase `ntzkjkvgtytlobvbplov`, pero no comparten todavía un contrato comercial completo. Se revisó código local y endpoints públicos; no se modificaron aplicaciones ni datos de producción.

| Aplicación | Función | Integración observada |
|---|---|---|
| LINKEO-V2 | Tienda pública | Consulta `linkeo_public_catalog`; prepara pedidos por WhatsApp; reseñas con respaldo en una segunda base |
| Linkeo_Ges | Gestión, inventario y contabilidad | `linkeoges_snapshot` y `linkeoges_commit`, autenticación por socios, revisión e idempotencia |
| ENVIAR-MENSAJES | Prospección, seguimiento y cotización | Comparte snapshot/commit; sincroniza leads y ya intenta insertar ventas |

## Hallazgos prioritarios

1. **Confirmación de ventas incorrecta.** `ENVIAR-MENSAJES/cloud.js:356` valida toda operación buscando su ID en `snapshot.tables.leads`, incluso operaciones de `sales` producidas por `cloud-core.js`. Una venta confirmada por el servidor puede mostrarse como error y dejar pendientes locales. Las pruebas existentes no verifican este recorrido completo.
2. **Ventas con reglas diferentes.** `cloud-core.js` inserta una venta sin operaciones de inventario ni tarjetas NFC. Gestión usa `src/utils/operations.js:createSale` para validar stock, descontar componentes y crear tarjetas. La ruta de Mensajes también asume producto `prod-h`, costo 12.93, método `Yape / Efectivo` y entrega completada cuando faltan datos. El catálogo inicial de Gestión utiliza otros IDs, como `prod-ind-1`.
3. **Responsables incompatibles.** Mensajes escribe `Luis Romero` o `Kevin Servat` en `sold_by`; Gestión utiliza `luis` y `kevin`. Dashboard y exportación interpretan cualquier valor distinto de `luis` como Kevin. Corregir tanto el contrato como los registros afectados si existen.
4. **Catálogo público incompleto.** Consulta real HTTP 200: solo `display` / `SKU-LNK-9972` / S/80 y `horizontal` / `SKU-LNK-6781` / S/60. Esto demuestra el contenido del catálogo público, no que solo existan dos productos en la tabla privada. `LINKEO-V2/dist/catalog-sync.js` mezcla los resultados con el catálogo estático y conserva los productos omitidos; packs y otros modelos pueden seguir ofreciéndose sin confirmación central.
5. **Reseñas en dos bases.** `dist/supabase-config.js` conserva `vrfcicsbqcxpbcfquwxh` como respaldo. `reviews.js` puede leer o escribir allí cuando faltan funciones/tablas centrales. Ambos endpoints públicos respondieron 200 y devolvieron cero reseñas aprobadas; no se inspeccionaron reseñas privadas o pendientes.
6. **Cotizaciones y semántica parcial.** Mensajes descarga productos y tiene presets centrales, pero mantiene valores y productos de respaldo; el guion mayorista busca por nombres mediante `/reventa|lote|10|negocio/`, por lo que puede tomar el precio de un pack Negocio como precio de un lote de diez. Usar IDs/SKU explícitos. Los estados comerciales se traducen a etapas de Gestión, pero `Vendido` no distingue cobro, configuración y entrega.
7. **Idempotencia comercial insuficiente.** El ID de venta se deriva del prospecto y `saleRecorded` se establece durante la planificación, antes del commit. Se debe confirmar el registro después de la respuesta y distinguir pedidos repetidos del mismo cliente. El corte de lotes también debe mantener juntas las operaciones de cada venta.
8. **Documentación desactualizada.** README de Mensajes afirma que Vendido no genera venta contable, pero el código actual sí lo intenta. No usar el README como prueba de comportamiento.

## Verificación

- Gestión: 48/48 pruebas aprobadas, incluyendo base PostgreSQL en memoria, operaciones y sincronización.
- Mensajes: 33/33 pruebas aprobadas (core, cloud y cloud-integration).
- Tienda: 4/4 pruebas de mezcla del catálogo aprobadas.
- Reproducción en memoria, sin escrituras: un prospecto vendido genera operaciones `leads` y `sales`, asigna producto por defecto `prod-h`, vendedor `Luis Romero` y marca `saleRecorded` antes del commit; el ID de venta no existe en la lista de leads que utiliza el validador.
- Endpoints públicos reales de catálogo y reseñas consultados sin insertar datos.
- El conector Supabase conectado lista proyectos distintos de los de LINKEO. No se pudo auditar mediante él el esquema privado, miembros, políticas actuales ni ventas reales. No se verificó equivalencia entre código local y despliegues Vercel ni se efectuó una venta autenticada de extremo a extremo.

## Orden de unificación propuesto

1. Fijar un contrato central: producto ID/SKU, precio y costo, composición de packs, socio `luis/kevin`, prospecto, pedido, cobro y entrega como conceptos separados.
2. Corregir confirmación por tabla y convertir el cierre comercial en una operación atómica que registre venta, stock, tarjetas y auditoría, con ID de pedido e idempotencia estables.
3. Completar publicación del catálogo; resolver explícitamente productos retirados, no disponibles y precios de respaldo. Eliminar búsquedas comerciales ambiguas por nombre.
4. Comprobar y finalizar la consolidación de reseñas antes de retirar la conexión antigua.
5. Verificar con cuentas autorizadas el circuito completo: cotizar en Mensajes, cobrar, confirmar venta en Gestión, verificar stock y responsable, reintentar sin duplicación y registrar una segunda compra del mismo cliente.

Las mejoras de ventas en Mensajes deben construirse sobre este contrato para evitar que el reporte comercial y la contabilidad diverjan.
