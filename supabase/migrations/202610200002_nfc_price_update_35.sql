-- Actualiza precios unitarios NFC a S/ 35 y mantiene el ahorro nominal vigente de cada pack.
-- Es idempotente y no modifica ventas ya registradas.
BEGIN;

WITH price_updates(sku, price, regular_price, savings, description) AS (
  VALUES
    ('SKU-LNK-6781', 35.00, 35.00, 0.00, NULL::text),
    ('SKU-LNK-9972', 35.00, 35.00, 0.00, NULL::text),
    ('SKU-LNK-1367', 35.00, 35.00, 0.00, NULL::text),
    ('SKU-LNK-4951', 35.00, 35.00, 0.00, NULL::text),
    ('SKU-LNK-IDENT', 35.00, 35.00, 0.00, NULL::text),
    ('SKU-PACK-DUO', 60.00, 70.00, 10.00, 'Pack Restaurante Dúo: 2 tarjetas NFC configuradas para caja y barra. Precio regular S/ 70.'),
    ('SKU-PACK-TRIO', 85.00, 105.00, 20.00, 'Combo Corporativo Trío: 2 tarjetas cuadradas y 1 display formato L. Precio regular S/ 105.'),
    ('SKU-PACK-EMPRENDEDOR', 55.00, 70.00, 15.00, 'Pack Emprendedor: 1 Tarjeta Horizontal (PVP S/ 35) + 1 Tarjeta Vertical (PVP S/ 35). Precio regular S/ 70.'),
    ('SKU-PACK-NEGOCIO', 60.00, 70.00, 10.00, 'Display de Mesa (PVP S/ 35) + Tarjeta Vertical (PVP S/ 35). Precio regular por separado S/ 70.'),
    ('SKU-PACK-DUO-PREMIUM', 60.00, 70.00, 10.00, 'Display de Mesa (PVP S/ 35) + Tarjeta Horizontal (PVP S/ 35). Precio regular por separado S/ 70.'),
    ('SKU-PACK-FULL', 85.00, 105.00, 20.00, 'Los tres modelos en un solo pack: Display de Mesa + Tarjeta Horizontal + Tarjeta Vertical. Precio regular S/ 105.')
)
UPDATE public.products AS product
SET price = update.price,
    description = coalesce(update.description, product.description),
    payload = jsonb_set(
      jsonb_set(
        coalesce(product.payload, '{}'::jsonb),
        '{regularPrice}',
        to_jsonb(update.regular_price),
        true
      ),
      '{web}',
      coalesce(product.payload->'web', '{}'::jsonb) ||
        jsonb_build_object(
          'regularPrice', update.regular_price,
          'savings', update.savings
        ) ||
        CASE
          WHEN update.description IS NULL THEN '{}'::jsonb
          ELSE jsonb_build_object('description', update.description)
        END,
      true
    )
FROM price_updates AS update
WHERE product.sku = update.sku;

COMMIT;
