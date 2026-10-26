-- ====================================================================
-- LINKEO GES & STOREFRONT - ROLLBACK SEGURO Y NO DESTRUCTIVO DEL CATÁLOGO
-- Fase 02 / Sprint 1 - Reversión Transaccional y Preservación de Datos
-- Reemplaza el DELETE indiscriminado por una despublicación segura
-- para proteger integridad referencial con ventas, inventario y auditoría.
-- ====================================================================

BEGIN;

-- 1. Despublicar de forma no destructiva los 6 productos incorporados en el Sprint 1
-- NO se ejecutan DELETE para no romper llaves foráneas, historiales de ventas ni huellas de auditoría.
UPDATE public.products
SET payload = jsonb_set(
  jsonb_set(
    coalesce(payload, '{}'::jsonb),
    '{web,published}',
    'false'::jsonb
  ),
  '{web,available}',
  'false'::jsonb
)
WHERE sku IN (
  'SKU-LNK-4951',         -- Tarjeta Vertical
  'SKU-LNK-IDENT',        -- Tarjeta Identificable Digital
  'SKU-PACK-EMPRENDEDOR', -- Pack Emprendedor
  'SKU-PACK-NEGOCIO',     -- Pack Negocio
  'SKU-PACK-DUO-PREMIUM', -- Pack Dúo Premium
  'SKU-PACK-FULL'         -- Pack Full Total
);

-- 2. Asegurar que los dos productos preexistentes confirmados permanezcan en su estado base
UPDATE public.products
SET
  price = 35.00,
  payload = jsonb_set(
    jsonb_set(
      coalesce(payload, '{}'::jsonb),
      '{web,published}',
      'true'::jsonb
    ),
    '{web,available}',
    'true'::jsonb
  )
WHERE sku IN ('SKU-LNK-9972', 'SKU-LNK-6781');

-- 3. Restaurar la función RPC pública linkeo_public_catalog()
-- REGLA CRÍTICA DE SEGURIDAD: NO se restaura el fallback antiguo que asumía available = true.
-- Se mantiene la regla segura COALESCE(available, false) y filtro estricto de published = true.
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
          WHEN 'SKU-LNK-9972' THEN 'display'
          ELSE lower(replace(p.sku, 'SKU-', ''))
        END
      ),
      'sku', p.sku,
      'name', coalesce(p.payload->'web'->>'name', p.name),
      'type', coalesce(p.type, 'individual'),
      'price', round(p.price::numeric, 2),
      'regular_price', round(p.price::numeric, 2),
      'savings', 0.00,
      'items', coalesce(p.payload->'web'->'items', '[]'::jsonb),
      'designs', coalesce(p.payload->'web'->'designs', '[]'::jsonb),
      'image', coalesce(p.payload->'web'->>'image', coalesce(p.image_url, '')),
      'icon', coalesce(p.payload->'web'->>'icon', ''),
      'badge', coalesce(p.badge, ''),
      'horizontal', coalesce((p.payload->'web'->>'horizontal')::boolean, p.sku = 'SKU-LNK-6781'),
      'sort_order', coalesce((p.payload->'web'->>'sortOrder')::integer, 999),
      'description', coalesce(p.payload->'web'->>'description', p.description, ''),
      'available', coalesce((p.payload->'web'->>'available')::boolean, false)
    )
    ORDER BY
      coalesce((p.payload->'web'->>'sortOrder')::integer, 999), p.name
  ), '[]'::jsonb)
  INTO v_products
  FROM public.products p
  WHERE (p.payload->'web'->>'published' = 'true');

  RETURN jsonb_build_object(
    'revision', coalesce(v_sync.revision, 0),
    'updated_at', coalesce(v_sync.updated_at, now()),
    'products', v_products
  );
END;
$$;

-- 4. Incrementar la revisión en catalog_sync para que todos los clientes invaliden caché inmediatamente
UPDATE public.catalog_sync
SET revision = revision + 1, updated_at = now()
WHERE id = 1;

COMMIT;
