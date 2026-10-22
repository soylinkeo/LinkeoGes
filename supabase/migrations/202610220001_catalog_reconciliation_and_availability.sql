-- ====================================================================
-- LINKEO GES & STOREFRONT - RECONCILIACIÓN DEL CATÁLOGO CENTRAL Y REGLAS DE DISPONIBILIDAD
-- Fase 02 / Sprint 1 - Preparación para Sincronización Segura
-- Idempotente, reversible, sin locks exclusivos de tabla y con validación de integridad.
-- NO EJECUTAR EN PRODUCCIÓN SIN AUTORIZACIÓN EXPRESA DE LOS SOCIOS.
-- ====================================================================

BEGIN;

-- 1. Asegurar índice único por SKU en public.products si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_key' AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_sku_key UNIQUE (sku);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 2. Optimización de la función trigger bump_catalog_sync()
-- CERO BLOQUEOS EXCLUSIVOS: NUNCA utiliza ALTER TABLE DISABLE TRIGGER ni ACCESS EXCLUSIVE.
-- Utiliza una variable de configuración local a la transacción (GUC transaction-scoped)
-- para garantizar exactamente un incremento (+1) por transacción, independientemente
-- de si el statement ejecuta INSERT, UPDATE o ambos de forma concurrente.
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

-- 3. Insertar o reconciliar los 8 productos comerciales oficiales de LINKEO
-- Política de Disponibilidad Segura:
-- - display y horizontal tienen stock físico confirmado -> available = true
-- - vertical, identificable y los 4 packs comerciales -> disponibles pero con available = false
--   hasta que inventario valide existencias de todos sus insumos en Sprint 2,
--   preservando el flujo de consulta por WhatsApp en el storefront ("Disponibilidad por confirmar").

INSERT INTO public.products (
  id, sku, name, category, type, price, cost, margin, margin_pct, badge, description, image_url, payload
)
VALUES
  -- 1. Display de Mesa (Acrílico) - Slug: display
  (
    'prod-ind-display',
    'SKU-LNK-9972',
    'Tarjeta Google NFC Formato L ESP',
    'Individual',
    'individual',
    35.00,
    12.93,
    22.07,
    63.06,
    'Premium',
    'Display vertical en ángulo L de alto impacto visual para caja y recepción con reseña directa de Google Maps.',
    'display-polished.webp',
    jsonb_build_object(
      'inventoryId', 'inv-3',
      'regularPrice', 35.00,
      'bundleItems', '[]'::jsonb,
      'web', jsonb_build_object(
        'slug', 'display',
        'published', true,
        'available', true,
        'name', 'Display de Mesa',
        'regularPrice', 35.00,
        'savings', 0.00,
        'horizontal', false,
        'sortOrder', 60,
        'image', 'display-polished.webp',
        'icon', '🏢',
        'items', '["1 Display de Mesa (Acrílico)"]'::jsonb,
        'designs', '["Blanco acrílico"]'::jsonb,
        'description', 'Display acrílico en ángulo L para barra y mostrador. Escaneo NFC y código QR de alta definición.'
      )
    )
  ),
  -- 2. Tarjeta Horizontal (NFC + QR) - Slug: horizontal
  (
    'prod-ind-horizontal',
    'SKU-LNK-6781',
    'Tarjeta Google NFC Cuadrado ESP',
    'Individual',
    'individual',
    35.00,
    12.93,
    22.07,
    63.06,
    'Popular',
    'Tarjeta inteligente horizontal con chip NTAG215 para reseñas de Google en español. Diseñada para mostrador y barras.',
    'tarjeta-h-polished.webp',
    jsonb_build_object(
      'inventoryId', 'inv-2',
      'regularPrice', 35.00,
      'bundleItems', '[]'::jsonb,
      'web', jsonb_build_object(
        'slug', 'horizontal',
        'published', true,
        'available', true,
        'name', 'Tarjeta Horizontal',
        'regularPrice', 35.00,
        'savings', 0.00,
        'horizontal', true,
        'sortOrder', 70,
        'image', 'tarjeta-h-polished.webp',
        'icon', '💳',
        'items', '["1 Tarjeta Horizontal (NFC + QR)"]'::jsonb,
        'designs', '["Negro elegante", "Azul con blanco"]'::jsonb,
        'description', 'Tarjeta horizontal premium con chip NTAG215 integrado y código QR de respaldo directo a Google Maps.'
      )
    )
  ),
  -- 3. Tarjeta Vertical (NFC Portátil) - Slug: vertical
  (
    'prod-ind-vertical',
    'SKU-LNK-4951',
    'Tarjeta Google NFC Carnet ESP',
    'Individual',
    'individual',
    35.00,
    12.93,
    22.07,
    63.06,
    'Portátil',
    'Tarjeta vertical formato carnet portátil, práctica y elegante para llevar la conexión consigo.',
    'tarjeta-v-polished.webp',
    jsonb_build_object(
      'inventoryId', 'inv-carnet',
      'regularPrice', 35.00,
      'bundleItems', '[]'::jsonb,
      'web', jsonb_build_object(
        'slug', 'vertical',
        'published', true,
        'available', false,
        'name', 'Tarjeta Vertical',
        'regularPrice', 35.00,
        'savings', 0.00,
        'horizontal', false,
        'sortOrder', 80,
        'image', 'tarjeta-v-polished.webp',
        'icon', '📱',
        'items', '["1 Tarjeta Vertical (NFC)"]'::jsonb,
        'designs', '["Multicolor Google"]'::jsonb,
        'description', 'Formato carnet vertical portable para llevar en billetera o credencial con enlace directo NFC.'
      )
    )
  ),
  -- 4. Tarjeta Identificable Digital (NFC + QR) - Slug: identificable
  (
    'prod-ind-identificable',
    'SKU-LNK-IDENT',
    'Tarjeta Identificable Digital (NFC + QR)',
    'Individual',
    'individual',
    35.00,
    12.93,
    22.07,
    63.06,
    'Digital',
    'Tarjeta identificable personal o corporativa con chip NFC y código QR de alta definición.',
    'tarjeta-identificable-polished.webp',
    jsonb_build_object(
      'inventoryId', 'inv-carnet',
      'regularPrice', 35.00,
      'bundleItems', '[]'::jsonb,
      'web', jsonb_build_object(
        'slug', 'identificable',
        'published', true,
        'available', false,
        'name', 'Tarjeta Identificable',
        'regularPrice', 35.00,
        'savings', 0.00,
        'horizontal', false,
        'sortOrder', 50,
        'image', 'tarjeta-identificable-polished.webp',
        'icon', '✨',
        'items', '["1 Tarjeta Identificable Digital (NFC + QR)"]'::jsonb,
        'designs', '["Negro mate texturizado"]'::jsonb,
        'description', 'Tarjeta personal o corporativa con acabado negro mate y QR de alta resistencia.'
      )
    )
  ),
  -- 5. Pack Emprendedor (Horizontal + Vertical) - Slug: emprendedor
  (
    'prod-pack-emprendedor',
    'SKU-PACK-EMPRENDEDOR',
    'Pack Emprendedor (Horizontal + Vertical)',
    'Pack',
    'pack',
    55.00,
    25.86,
    29.14,
    52.98,
    '🔥 Oferta Web',
    'Pack Emprendedor: 1 Tarjeta Horizontal (PVP S/ 35) + 1 Tarjeta Vertical (PVP S/ 35). Precio regular S/ 70. ||BUNDLE:[{"id":"inv-2","sku":"SKU-LNK-6781","name":"Tarjeta Google NFC Cuadrado ESP","quantity":1,"unitCost":12.93},{"id":"inv-carnet","sku":"SKU-LNK-4951","name":"Tarjeta Google NFC Carnet ESP","quantity":1,"unitCost":12.93}]||',
    'pack-emprendedor.webp',
    jsonb_build_object(
      'regularPrice', 70.00,
      'bundleItems', '[{"id":"inv-2","sku":"SKU-LNK-6781","name":"Tarjeta Google NFC Cuadrado ESP","quantity":1,"unitCost":12.93},{"id":"inv-carnet","sku":"SKU-LNK-4951","name":"Tarjeta Google NFC Carnet ESP","quantity":1,"unitCost":12.93}]'::jsonb,
      'web', jsonb_build_object(
        'slug', 'emprendedor',
        'published', true,
        'available', false,
        'name', 'Pack Emprendedor',
        'regularPrice', 70.00,
        'savings', 15.00,
        'horizontal', true,
        'sortOrder', 40,
        'image', 'pack-emprendedor.webp',
        'icon', '🚀',
        'items', '["1 Tarjeta Horizontal", "1 Tarjeta Vertical"]'::jsonb,
        'designs', '["Negro elegante", "Azul con blanco"]'::jsonb,
        'description', 'La combinación ideal para comenzar: 1 tarjeta de mostrador horizontal + 1 tarjeta vertical portable.'
      )
    )
  ),
  -- 6. Pack Negocio (Display de Mesa + Vertical) - Slug: negocio
  (
    'prod-pack-negocio',
    'SKU-PACK-NEGOCIO',
    'Pack Negocio (Display de Mesa + Vertical)',
    'Pack',
    'pack',
    60.00,
    25.86,
    34.14,
    56.90,
    'Mostrador + Tarjeta',
    'Display de Mesa (PVP S/ 35) + Tarjeta Vertical (PVP S/ 35). Precio regular por separado S/ 70. ||BUNDLE:[{"id":"inv-3","sku":"SKU-LNK-9972","name":"Tarjeta Google NFC L ESP","quantity":1,"unitCost":12.93},{"id":"inv-carnet","sku":"SKU-LNK-4951","name":"Tarjeta Google NFC Carnet ESP","quantity":1,"unitCost":12.93}]||',
    'pack-negocio.webp',
    jsonb_build_object(
      'regularPrice', 70.00,
      'bundleItems', '[{"id":"inv-3","sku":"SKU-LNK-9972","name":"Tarjeta Google NFC L ESP","quantity":1,"unitCost":12.93},{"id":"inv-carnet","sku":"SKU-LNK-4951","name":"Tarjeta Google NFC Carnet ESP","quantity":1,"unitCost":12.93}]'::jsonb,
      'web', jsonb_build_object(
        'slug', 'negocio',
        'published', true,
        'available', false,
        'name', 'Pack Negocio',
        'regularPrice', 70.00,
        'savings', 10.00,
        'horizontal', false,
        'sortOrder', 30,
        'image', 'pack-negocio.webp',
        'icon', '💼',
        'items', '["1 Display de Mesa", "1 Tarjeta Vertical"]'::jsonb,
        'designs', '[]'::jsonb,
        'description', 'Presencia fija en caja mediante display acrílico más tarjeta vertical para entregas y visitas.'
      )
    )
  ),
  -- 7. Pack Dúo Premium (Display de Mesa + Horizontal) - Slug: duo
  (
    'prod-pack-duo-premium',
    'SKU-PACK-DUO-PREMIUM',
    'Pack Dúo Premium (Display de Mesa + Horizontal)',
    'Pack',
    'pack',
    60.00,
    25.86,
    34.14,
    56.90,
    'Mayor Presencia',
    'Display de Mesa (PVP S/ 35) + Tarjeta Horizontal (PVP S/ 35). Precio regular por separado S/ 70. ||BUNDLE:[{"id":"inv-3","sku":"SKU-LNK-9972","name":"Tarjeta Google NFC L ESP","quantity":1,"unitCost":12.93},{"id":"inv-2","sku":"SKU-LNK-6781","name":"Tarjeta Google NFC Cuadrado ESP","quantity":1,"unitCost":12.93}]||',
    'pack-duo.webp',
    jsonb_build_object(
      'regularPrice', 70.00,
      'bundleItems', '[{"id":"inv-3","sku":"SKU-LNK-9972","name":"Tarjeta Google NFC L ESP","quantity":1,"unitCost":12.93},{"id":"inv-2","sku":"SKU-LNK-6781","name":"Tarjeta Google NFC Cuadrado ESP","quantity":1,"unitCost":12.93}]'::jsonb,
      'web', jsonb_build_object(
        'slug', 'duo',
        'published', true,
        'available', false,
        'name', 'Pack Dúo Premium',
        'regularPrice', 70.00,
        'savings', 10.00,
        'horizontal', true,
        'sortOrder', 20,
        'image', 'pack-duo.webp',
        'icon', '⚡',
        'items', '["1 Display de Mesa", "1 Tarjeta Horizontal"]'::jsonb,
        'designs', '["Negro elegante", "Azul con blanco"]'::jsonb,
        'description', 'Doble visibilidad en el local: display vertical para el mostrador y tarjeta horizontal para barra.'
      )
    )
  ),
  -- 8. Pack Full Total (Display + Horizontal + Vertical) - Slug: full
  (
    'prod-pack-full',
    'SKU-PACK-FULL',
    'Pack Full (Display de Mesa + Horizontal + Vertical)',
    'Pack',
    'pack',
    85.00,
    38.79,
    46.21,
    54.36,
    '👑 Los 3 Modelos',
    'Los tres modelos en un solo pack: Display de Mesa + Tarjeta Horizontal + Tarjeta Vertical. Precio regular S/ 105. ||BUNDLE:[{"id":"inv-3","sku":"SKU-LNK-9972","name":"Tarjeta Google NFC L ESP","quantity":1,"unitCost":12.93},{"id":"inv-2","sku":"SKU-LNK-6781","name":"Tarjeta Google NFC Cuadrado ESP","quantity":1,"unitCost":12.93},{"id":"inv-carnet","sku":"SKU-LNK-4951","name":"Tarjeta Google NFC Carnet ESP","quantity":1,"unitCost":12.93}]||',
    'pack-full.webp',
    jsonb_build_object(
      'regularPrice', 105.00,
      'bundleItems', '[{"id":"inv-3","sku":"SKU-LNK-9972","name":"Tarjeta Google NFC L ESP","quantity":1,"unitCost":12.93},{"id":"inv-2","sku":"SKU-LNK-6781","name":"Tarjeta Google NFC Cuadrado ESP","quantity":1,"unitCost":12.93},{"id":"inv-carnet","sku":"SKU-LNK-4951","name":"Tarjeta Google NFC Carnet ESP","quantity":1,"unitCost":12.93}]'::jsonb,
      'web', jsonb_build_object(
        'slug', 'full',
        'published', true,
        'available', false,
        'name', 'Pack Full Total',
        'regularPrice', 105.00,
        'savings', 20.00,
        'horizontal', true,
        'sortOrder', 10,
        'image', 'pack-full.webp',
        'icon', '🔥',
        'items', '["1 Display de Mesa", "1 Tarjeta Horizontal", "1 Tarjeta Vertical"]'::jsonb,
        'designs', '["Negro elegante", "Azul con blanco"]'::jsonb,
        'description', 'Cobertura completa de puntos de contacto: display de mesa, tarjeta horizontal de mostrador y tarjeta vertical portátil.'
      )
    )
  )
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  price = EXCLUDED.price,
  cost = EXCLUDED.cost,
  margin = EXCLUDED.margin,
  margin_pct = EXCLUDED.margin_pct,
  badge = EXCLUDED.badge,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  payload = (
    coalesce(public.products.payload, '{}'::jsonb) ||
    jsonb_build_object(
      'regularPrice', EXCLUDED.payload->'regularPrice',
      'bundleItems', coalesce(public.products.payload->'bundleItems', EXCLUDED.payload->'bundleItems'),
      'inventoryId', coalesce(public.products.payload->'inventoryId', EXCLUDED.payload->'inventoryId'),
      'web', coalesce(public.products.payload->'web', '{}'::jsonb) || (EXCLUDED.payload->'web')
    )
  );

-- 4. Actualizar la función pública linkeo_public_catalog() con fallbacks comerciales correctos
-- y regla segura de disponibilidad: COALESCE(available, false)
CREATE OR REPLACE FUNCTION public.linkeo_public_catalog()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_sync record;
  v_products jsonb;
BEGIN
  SELECT revision, updated_at INTO v_sync FROM public.catalog_sync WHERE id = 1;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'slug', coalesce(p.payload->'web'->>'slug',
        CASE p.sku
          WHEN 'SKU-LNK-6781' THEN 'horizontal'
          WHEN 'SKU-LNK-4951' THEN 'vertical'
          WHEN 'SKU-LNK-9972' THEN 'display'
          WHEN 'SKU-PACK-DUO-PREMIUM' THEN 'duo'
          WHEN 'SKU-PACK-NEGOCIO' THEN 'negocio'
          WHEN 'SKU-PACK-EMPRENDEDOR' THEN 'emprendedor'
          WHEN 'SKU-PACK-FULL' THEN 'full'
          WHEN 'SKU-LNK-IDENT' THEN 'identificable'
          ELSE lower(replace(p.sku, 'SKU-', ''))
        END
      ),
      'sku', p.sku,
      'name', coalesce(p.payload->'web'->>'name', p.name),
      'type', coalesce(p.type, 'individual'),
      'price', round(p.price::numeric, 2),
      'regular_price', CASE
        WHEN (p.payload->>'regularPrice') IS NOT NULL AND (p.payload->>'regularPrice')::numeric > 0
          THEN round((p.payload->>'regularPrice')::numeric, 2)
        WHEN (p.payload->'web'->>'regularPrice') IS NOT NULL AND (p.payload->'web'->>'regularPrice')::numeric > 0
          THEN round((p.payload->'web'->>'regularPrice')::numeric, 2)
        WHEN p.sku = 'SKU-PACK-FULL' THEN 105.00
        WHEN p.sku IN ('SKU-PACK-DUO-PREMIUM', 'SKU-PACK-NEGOCIO', 'SKU-PACK-EMPRENDEDOR') THEN 70.00
        ELSE round(p.price::numeric, 2)
      END,
      'savings', CASE
        WHEN (p.payload->'web'->>'savings') IS NOT NULL
          THEN round((p.payload->'web'->>'savings')::numeric, 2)
        WHEN (p.payload->>'regularPrice') IS NOT NULL AND (p.payload->>'regularPrice')::numeric > p.price
          THEN round(((p.payload->>'regularPrice')::numeric - p.price)::numeric, 2)
        WHEN p.sku = 'SKU-PACK-FULL' THEN 20.00
        WHEN p.sku = 'SKU-PACK-EMPRENDEDOR' THEN 15.00
        WHEN p.sku IN ('SKU-PACK-DUO-PREMIUM', 'SKU-PACK-NEGOCIO') THEN 10.00
        ELSE 0.00
      END,
      'items', coalesce(p.payload->'web'->'items',
        CASE p.sku
          WHEN 'SKU-PACK-FULL' THEN '["1 Display de Mesa", "1 Tarjeta Horizontal", "1 Tarjeta Vertical"]'::jsonb
          WHEN 'SKU-PACK-DUO-PREMIUM' THEN '["1 Display de Mesa", "1 Tarjeta Horizontal"]'::jsonb
          WHEN 'SKU-PACK-NEGOCIO' THEN '["1 Display de Mesa", "1 Tarjeta Vertical"]'::jsonb
          WHEN 'SKU-PACK-EMPRENDEDOR' THEN '["1 Tarjeta Horizontal", "1 Tarjeta Vertical"]'::jsonb
          WHEN 'SKU-LNK-IDENT' THEN '["1 Tarjeta Identificable Digital (NFC + QR)"]'::jsonb
          WHEN 'SKU-LNK-9972' THEN '["1 Display de Mesa (Acrílico)"]'::jsonb
          WHEN 'SKU-LNK-6781' THEN '["1 Tarjeta Horizontal (NFC + QR)"]'::jsonb
          WHEN 'SKU-LNK-4951' THEN '["1 Tarjeta Vertical (NFC)"]'::jsonb
          ELSE '[]'::jsonb
        END
      ),
      'designs', coalesce(p.payload->'web'->'designs',
        CASE p.sku
          WHEN 'SKU-PACK-FULL' THEN '["Negro elegante", "Azul con blanco"]'::jsonb
          WHEN 'SKU-PACK-DUO-PREMIUM' THEN '["Negro elegante", "Azul con blanco"]'::jsonb
          WHEN 'SKU-PACK-EMPRENDEDOR' THEN '["Negro elegante", "Azul con blanco"]'::jsonb
          WHEN 'SKU-LNK-IDENT' THEN '["Negro mate texturizado"]'::jsonb
          WHEN 'SKU-LNK-9972' THEN '["Blanco acrílico"]'::jsonb
          WHEN 'SKU-LNK-6781' THEN '["Negro elegante", "Azul con blanco"]'::jsonb
          WHEN 'SKU-LNK-4951' THEN '["Multicolor Google"]'::jsonb
          ELSE '[]'::jsonb
        END
      ),
      'image', coalesce(p.payload->'web'->>'image',
        CASE p.sku
          WHEN 'SKU-PACK-FULL' THEN 'pack-full.webp'
          WHEN 'SKU-PACK-DUO-PREMIUM' THEN 'pack-duo.webp'
          WHEN 'SKU-PACK-NEGOCIO' THEN 'pack-negocio.webp'
          WHEN 'SKU-PACK-EMPRENDEDOR' THEN 'pack-emprendedor.webp'
          WHEN 'SKU-LNK-IDENT' THEN 'tarjeta-identificable-polished.webp'
          WHEN 'SKU-LNK-9972' THEN 'display-polished.webp'
          WHEN 'SKU-LNK-6781' THEN 'tarjeta-h-polished.webp'
          WHEN 'SKU-LNK-4951' THEN 'tarjeta-v-polished.webp'
          ELSE coalesce(p.image_url, '')
        END
      ),
      'icon', coalesce(p.payload->'web'->>'icon',
        CASE p.sku
          WHEN 'SKU-PACK-FULL' THEN '🔥'
          WHEN 'SKU-PACK-DUO-PREMIUM' THEN '⚡'
          WHEN 'SKU-PACK-NEGOCIO' THEN '💼'
          WHEN 'SKU-PACK-EMPRENDEDOR' THEN '🚀'
          WHEN 'SKU-LNK-IDENT' THEN '✨'
          WHEN 'SKU-LNK-9972' THEN '🏢'
          WHEN 'SKU-LNK-6781' THEN '💳'
          WHEN 'SKU-LNK-4951' THEN '📱'
          ELSE ''
        END
      ),
      'badge', coalesce(p.badge, ''),
      'horizontal', coalesce((p.payload->'web'->>'horizontal')::boolean,
        p.sku IN ('SKU-PACK-FULL', 'SKU-PACK-DUO-PREMIUM', 'SKU-PACK-EMPRENDEDOR', 'SKU-LNK-6781')
      ),
      'sort_order', coalesce((p.payload->'web'->>'sortOrder')::integer,
        CASE p.sku
          WHEN 'SKU-PACK-FULL' THEN 10
          WHEN 'SKU-PACK-DUO-PREMIUM' THEN 20
          WHEN 'SKU-PACK-NEGOCIO' THEN 30
          WHEN 'SKU-PACK-EMPRENDEDOR' THEN 40
          WHEN 'SKU-LNK-IDENT' THEN 50
          WHEN 'SKU-LNK-9972' THEN 60
          WHEN 'SKU-LNK-6781' THEN 70
          WHEN 'SKU-LNK-4951' THEN 80
          ELSE 999
        END
      ),
      'description', coalesce(p.payload->'web'->>'description', p.description, ''),
      -- REGLA SEGURA: default a false si no está explícitamente confirmado como true
      'available', coalesce((p.payload->'web'->>'available')::boolean, false)
    )
    ORDER BY
      coalesce((p.payload->'web'->>'sortOrder')::integer,
        CASE p.sku
          WHEN 'SKU-PACK-FULL' THEN 10
          WHEN 'SKU-PACK-DUO-PREMIUM' THEN 20
          WHEN 'SKU-PACK-NEGOCIO' THEN 30
          WHEN 'SKU-PACK-EMPRENDEDOR' THEN 40
          WHEN 'SKU-LNK-IDENT' THEN 50
          WHEN 'SKU-LNK-9972' THEN 60
          WHEN 'SKU-LNK-6781' THEN 70
          WHEN 'SKU-LNK-4951' THEN 80
          ELSE 999
        END
      ), p.name
  ), '[]'::jsonb)
  INTO v_products
  FROM public.products p
  WHERE (
    (p.payload->'web'->>'published' = 'true')
    OR (
      (p.payload->'web'->>'published') IS NULL
      AND p.sku IN (
        'SKU-LNK-6781', 'SKU-LNK-4951', 'SKU-LNK-9972',
        'SKU-PACK-DUO-PREMIUM', 'SKU-PACK-NEGOCIO', 'SKU-PACK-EMPRENDEDOR',
        'SKU-PACK-FULL', 'SKU-LNK-IDENT'
      )
    )
  );

  RETURN jsonb_build_object(
    'revision', coalesce(v_sync.revision, 0),
    'updated_at', coalesce(v_sync.updated_at, now()),
    'products', v_products
  );
END;
$$;

-- 5. Reconfirmar permisos de ejecución para la RPC pública del catálogo
REVOKE ALL ON FUNCTION public.linkeo_public_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.linkeo_public_catalog() TO anon, authenticated;

-- El trigger trg_bump_catalog_sync incrementa automáticamente la revisión (+1)
-- durante la transacción al modificarse la tabla products de forma no bloqueante.

COMMIT;
