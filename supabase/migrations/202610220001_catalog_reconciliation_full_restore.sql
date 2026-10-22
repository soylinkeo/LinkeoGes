-- ====================================================================
-- LINKEO GES & STOREFRONT - RESTAURACIÓN INTEGRAL DE ESTADO PRE-MIGRACIÓN
-- Fase 02 / Sprint 1 - Reversión Completa de Datos, Esquema y Permisos
-- Utilizar cuando se requiera retornar la base de datos exactamente a su estado
-- inicial observado antes del despliegue del Sprint 1.
-- ====================================================================

BEGIN;

-- 1. Restaurar los dos productos preexistentes al estado verificado previo a la migración
UPDATE public.products
SET
  name = CASE sku
    WHEN 'SKU-LNK-9972' THEN 'Tarjeta Google NFC L ESP'
    WHEN 'SKU-LNK-6781' THEN 'Tarjeta Google NFC Cuadrado ESP'
    ELSE name
  END,
  price = 35.00,
  cost = 12.93,
  margin = 22.07,
  margin_pct = 63.06,
  badge = CASE sku
    WHEN 'SKU-LNK-9972' THEN 'Premium'
    WHEN 'SKU-LNK-6781' THEN 'Popular'
    ELSE badge
  END,
  image_url = CASE sku
    WHEN 'SKU-LNK-9972' THEN 'display-polished.png'
    WHEN 'SKU-LNK-6781' THEN 'tarjeta-h-polished.png'
    ELSE image_url
  END,
  payload = jsonb_set(
    coalesce(payload, '{}'::jsonb),
    '{web}',
    jsonb_build_object(
      'slug', CASE sku WHEN 'SKU-LNK-9972' THEN 'display' ELSE 'horizontal' END,
      'published', true,
      'available', true,
      'name', CASE sku WHEN 'SKU-LNK-9972' THEN 'Tarjeta Google NFC L ESP' ELSE 'Tarjeta Google NFC Cuadrado ESP' END,
      'regularPrice', 35.00,
      'savings', 0.00,
      'horizontal', sku = 'SKU-LNK-6781',
      'sortOrder', CASE sku WHEN 'SKU-LNK-9972' THEN 60 ELSE 70 END,
      'image', CASE sku WHEN 'SKU-LNK-9972' THEN 'display-polished.png' ELSE 'tarjeta-h-polished.png' END,
      'icon', CASE sku WHEN 'SKU-LNK-9972' THEN '🏢' ELSE '💳' END,
      'items', CASE sku WHEN 'SKU-LNK-9972' THEN '["1 Display de Mesa (Acrílico)"]'::jsonb ELSE '["1 Tarjeta Horizontal (NFC + QR)"]'::jsonb END,
      'designs', CASE sku WHEN 'SKU-LNK-9972' THEN '["Blanco acrílico"]'::jsonb ELSE '["Negro elegante", "Azul con blanco"]'::jsonb END,
      'description', CASE sku
        WHEN 'SKU-LNK-9972' THEN 'Display vertical en ángulo L de alto impacto visual para caja y recepción con reseña directa de Google Maps.'
        ELSE 'Tarjeta inteligente con chip NTAG215 para reseñas de Google en español. Diseñada para mostrador y barras de restaurantes.'
      END
    )
  )
WHERE sku IN ('SKU-LNK-9972', 'SKU-LNK-6781');

-- 2. Manejo seguro de los 6 productos nuevos incorporados en el Sprint 1:
-- A) Si NO tienen referencias en ventas, tarjetas nfc ni logs de auditoría:
--    eliminarlos limpiamente para retornar al estado de 2 filas
DELETE FROM public.products p
WHERE p.sku IN (
  'SKU-LNK-4951', 'SKU-LNK-IDENT', 'SKU-PACK-EMPRENDEDOR',
  'SKU-PACK-NEGOCIO', 'SKU-PACK-DUO-PREMIUM', 'SKU-PACK-FULL'
)
AND NOT EXISTS (
  SELECT 1 FROM public.sales s WHERE s.product_id = p.id
)
AND NOT EXISTS (
  SELECT 1 FROM public.nfc_cards c WHERE c.assigned_to = p.id OR c.url LIKE '%' || p.sku || '%'
)
AND NOT EXISTS (
  SELECT 1 FROM public.audit_logs a WHERE a.entity_id = p.id
);

-- B) Si alguno tuviese referencias operativas (protección estricta contra huérfanos):
--    no se elimina físicamente, sino que se archiva y despublica totalmente
UPDATE public.products p
SET
  category = 'Descontinuado',
  type = 'historico',
  payload = jsonb_set(
    jsonb_set(coalesce(payload, '{}'::jsonb), '{web,published}', 'false'::jsonb),
    '{web,available}', 'false'::jsonb
  )
WHERE p.sku IN (
  'SKU-LNK-4951', 'SKU-LNK-IDENT', 'SKU-PACK-EMPRENDEDOR',
  'SKU-PACK-NEGOCIO', 'SKU-PACK-DUO-PREMIUM', 'SKU-PACK-FULL'
);

-- 3. Restaurar la definición de la función RPC pública linkeo_public_catalog()
-- con la versión estricta de dos productos
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

-- 4. Reconfirmar permisos de ejecución para roles públicos
REVOKE ALL ON FUNCTION public.linkeo_public_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.linkeo_public_catalog() TO anon, authenticated;

-- 5. Avanzar la revisión en catalog_sync para invalidar cachés en tiendas y clientes
UPDATE public.catalog_sync
SET revision = revision + 1, updated_at = now()
WHERE id = 1;

COMMIT;
