-- Actualiza el catálogo NFC y conserva el descuento aproximado de cada pack.
-- Se puede ejecutar más de una vez; no modifica ventas ya registradas.
BEGIN;

WITH price_updates(sku, price, regular_price, savings, description) AS (
  VALUES
    ('SKU-LNK-6781', 40.00, 40.00, 0.00, NULL::text),
    ('SKU-LNK-9972', 40.00, 40.00, 0.00, NULL::text),
    ('SKU-LNK-1367', 40.00, 40.00, 0.00, NULL::text),
    ('SKU-LNK-4951', 40.00, 40.00, 0.00, NULL::text),
    ('SKU-LNK-IDENT', 40.00, 40.00, 0.00, NULL::text),
    ('SKU-PACK-DUO', 70.00, 80.00, 10.00, 'Pack Restaurante Dúo: 2 tarjetas NFC configuradas para caja y barra. Precio regular S/ 80.'),
    ('SKU-PACK-TRIO', 100.00, 120.00, 20.00, 'Combo Corporativo Trío: 2 tarjetas cuadradas y 1 display formato L. Precio regular S/ 120.'),
    ('SKU-PACK-EMPRENDEDOR', 65.00, 80.00, 15.00, 'Pack Emprendedor: 1 Tarjeta Horizontal (PVP S/ 40) + 1 Tarjeta Vertical (PVP S/ 40). Precio regular S/ 80.'),
    ('SKU-PACK-NEGOCIO', 70.00, 80.00, 10.00, 'Display de Mesa (PVP S/ 40) + Tarjeta Vertical (PVP S/ 40). Precio regular por separado S/ 80.'),
    ('SKU-PACK-DUO-PREMIUM', 70.00, 80.00, 10.00, 'Display de Mesa (PVP S/ 40) + Tarjeta Horizontal (PVP S/ 40). Precio regular por separado S/ 80.'),
    ('SKU-PACK-FULL', 100.00, 120.00, 20.00, 'Los tres modelos en un solo pack: Display de Mesa + Tarjeta Horizontal + Tarjeta Vertical. Precio regular S/ 120.')
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
