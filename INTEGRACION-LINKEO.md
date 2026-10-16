# Contrato compartido de LINKEO

Las tres aplicaciones usan `ntzkjkvgtytlobvbplov` como base central. La tienda pública consulta únicamente las funciones de catálogo/reseñas; Gestión y Mensajes usan las cuentas de socios y `linkeoges_snapshot` / `linkeoges_commit`.

## Venta desde ENVIAR-MENSAJES

1. Conectar una cuenta para cargar el catálogo y almacén central.
2. En Registrar resultado → Venta cobrada, seleccionar producto, cantidad, vendedor (`luis` o `kevin`), medio de pago, fecha e importe de esta compra.
3. Se conserva un ID de pedido en el respaldo local. La compra se guarda como cobrada y por entregar, junto con las tarjetas NFC y los movimientos de inventario del producto o pack.
4. Un único commit confirma prospecto, venta, tarjetas y almacén. Un conflicto de revisión vuelve a leer el stock antes de replanificar. Si falta stock, no se guarda una venta parcial.
5. El mismo pedido no vuelve a consumir stock tras una respuesta perdida. Registrar otra compra del cliente genera otro ID; editar sus notas no crea ventas.

La lógica de stock y venta está en `src/shared/sales-domain.js`, con una copia idéntica en ENVIAR-MENSAJES. Las pruebas entre repositorios comprueban que no diverjan. El adaptador de Mensajes conserva las columnas y payload que utiliza Gestión, incluyendo `cardIds`, `stockMovements`, `leadId` y costo central.

El esquema existente valida `cantidad × precio unitario = total`; el formulario exige un importe representable con precio unitario de dos decimales. No registra anticipos parciales ni una línea contable de flete separada. El reporte completo de compras repetidas está en Gestión; el reporte local por prospecto conserva su último cobro.

## Catálogo y reseñas

Los productos se identifican por ID/SKU central. Las cotizaciones personalizadas son borradores; para vender hay que seleccionar un producto del catálogo. No se deduce un lote mayorista por similitud de nombre.

La web solo permite preparar pedidos con productos publicados en la respuesta central. Las fichas estáticas de productos omitidos quedan con disponibilidad por confirmar. Una caché de precios no habilita compras durante la carga inicial. Las reseñas consultan y escriben exclusivamente en la base central.

## Históricos y publicación

Los registros antiguos marcados Vendido sin ID de pedido no se convierten automáticamente: pueden estar ya contabilizados. Deben conciliarse antes de ingresar un nuevo cobro. Gestión normaliza nombres históricos de socios al leer ventas, sin reescribir datos de producción.

Estos cambios no requieren una migración SQL nueva: se verificaron contra el RPC transaccional existente. No se insertaron productos ni se inventaron existencias en producción. El endpoint público consultado durante la auditoría publicaba dos productos; para ofrecer otros modelos/packs se debe configurar su catálogo central y composición real.

Las correcciones están en las tres carpetas locales. Se deben publicar sus versiones actualizadas para que las webs alojadas utilicen este contrato. No se desplegó ni se ejecutó una venta real con cuentas de socios en producción.

## Validación reproducible

Desde Linkeo_Ges:

```sh
npm run check
npm run test:integration
node tests/integration/sales-browser.mjs
node tests/integration/storefront-browser.mjs
```

Las pruebas de integración requieren las carpetas hermanas ENVIAR-MENSAJES y LINKEO-V2. Usan PostgreSQL en memoria y navegador con servidor simulado, sin escribir en producción. En Windows, los tests de navegador usan Edge.

Desde ENVIAR-MENSAJES:

```sh
node --test core.test.cjs cloud.test.cjs cloud-integration.test.cjs sales.test.cjs
```

Desde LINKEO-V2:

```sh
node --test scripts/catalog-sync.test.cjs
```
