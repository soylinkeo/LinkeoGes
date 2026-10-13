-- Migración para Linkeo_Ges: Catálogo público, sincronización y reseñas del Storefront
-- Ejecutar en Supabase SQL Editor de Linkeo_Ges (ntzkjkvgtytlobvbplov).
-- Es segura y reversible (idempotente). No elimina datos.

BEGIN;

-- 1. Tabla de sincronización del catálogo público
CREATE TABLE IF NOT EXISTS public.catalog_sync (
  id integer PRIMARY KEY CHECK (id = 1),
  revision bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.catalog_sync(id, revision) VALUES (1, 0) ON CONFLICT DO NOTHING;

ALTER TABLE public.catalog_sync ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalog_sync_public_read ON public.catalog_sync;
CREATE POLICY catalog_sync_public_read ON public.catalog_sync FOR SELECT TO public USING (true);
GRANT SELECT ON public.catalog_sync TO anon, authenticated;

-- Trigger para incrementar revision en catalog_sync cuando cambien productos
CREATE OR REPLACE FUNCTION public.bump_catalog_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.catalog_sync
  SET revision = revision + 1, updated_at = now()
  WHERE id = 1;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_catalog_sync ON public.products;
CREATE TRIGGER trg_bump_catalog_sync
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH STATEMENT EXECUTE FUNCTION public.bump_catalog_sync();

-- 2. Función RPC pública del catálogo
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
        WHEN p.sku = 'SKU-PACK-FULL' THEN 180.00
        WHEN p.sku = 'SKU-PACK-DUO-PREMIUM' THEN 140.00
        WHEN p.sku = 'SKU-PACK-NEGOCIO' THEN 120.00
        WHEN p.sku = 'SKU-PACK-EMPRENDEDOR' THEN 100.00
        ELSE NULL
      END,
      'savings', CASE
        WHEN (p.payload->'web'->>'savings') IS NOT NULL
          THEN round((p.payload->'web'->>'savings')::numeric, 2)
        WHEN (p.payload->>'regularPrice') IS NOT NULL AND (p.payload->>'regularPrice')::numeric > p.price
          THEN round(((p.payload->>'regularPrice')::numeric - p.price)::numeric, 2)
        WHEN p.sku = 'SKU-PACK-FULL' THEN 30.00
        WHEN p.sku IN ('SKU-PACK-DUO-PREMIUM', 'SKU-PACK-NEGOCIO', 'SKU-PACK-EMPRENDEDOR') THEN 20.00
        ELSE 0
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
          WHEN 'SKU-PACK-FULL' THEN 'pack-full.png'
          WHEN 'SKU-PACK-DUO-PREMIUM' THEN 'pack-duo.png'
          WHEN 'SKU-PACK-NEGOCIO' THEN 'pack-negocio.png'
          WHEN 'SKU-PACK-EMPRENDEDOR' THEN 'pack-emprendedor.png'
          WHEN 'SKU-LNK-IDENT' THEN 'tarjeta-identificable-polished.png'
          WHEN 'SKU-LNK-9972' THEN 'display-polished.png'
          WHEN 'SKU-LNK-6781' THEN 'tarjeta-h-polished.png'
          WHEN 'SKU-LNK-4951' THEN 'tarjeta-v-polished.png'
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
      'available', coalesce((p.payload->'web'->>'available')::boolean, true)
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
REVOKE ALL ON FUNCTION public.linkeo_public_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.linkeo_public_catalog() TO anon, authenticated;

-- 3. Tabla y funciones de reseñas públicas de la tienda (unificadas desde vrfcicsbqcxpbcfquwxh)
CREATE TABLE IF NOT EXISTS public.linkeo_store_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 60),
  business text NOT NULL DEFAULT '' CHECK (char_length(business) <= 100),
  product_id text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(comment) BETWEEN 15 AND 1500),
  contact_email text NOT NULL CHECK (char_length(contact_email) BETWEEN 5 AND 254),
  district text NOT NULL DEFAULT '' CHECK (char_length(district) <= 100),
  order_reference text NOT NULL DEFAULT '' CHECK (char_length(order_reference) <= 100),
  consent_version text NOT NULL DEFAULT 'reviews-v1',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'))
);

ALTER TABLE public.linkeo_store_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.linkeo_store_reviews FROM public, anon, authenticated;

CREATE INDEX IF NOT EXISTS linkeo_reviews_public_idx ON public.linkeo_store_reviews (created_at DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS linkeo_reviews_contact_idx ON public.linkeo_store_reviews (contact_email, created_at DESC);

-- RPC pública para leer reseñas aprobadas
CREATE OR REPLACE FUNCTION public.linkeo_public_reviews()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  display_name text,
  business text,
  product_id text,
  rating smallint,
  comment text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT r.id, r.created_at, r.display_name, r.business, r.product_id, r.rating, r.comment
  FROM public.linkeo_store_reviews r
  WHERE r.status = 'approved'
  ORDER BY r.created_at DESC
  LIMIT 30;
$$;
REVOKE ALL ON FUNCTION public.linkeo_public_reviews() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.linkeo_public_reviews() TO anon, authenticated;

-- RPC pública para enviar reseña (con rate limiting y protección antispam)
CREATE OR REPLACE FUNCTION public.linkeo_submit_review(
  p_submission_id uuid,
  p_display_name text,
  p_business text,
  p_product_id text,
  p_rating integer,
  p_comment text,
  p_contact_email text,
  p_district text,
  p_order_reference text,
  p_consent boolean,
  p_website text DEFAULT ''
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_email text := lower(btrim(p_contact_email));
BEGIN
  IF p_consent IS DISTINCT FROM true OR coalesce(p_website, '') <> '' THEN
    RAISE EXCEPTION 'Invalid submission' USING ERRCODE = '22023';
  END IF;
  IF v_email IS NULL OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Invalid email' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_email, 0));

  IF EXISTS(SELECT 1 FROM public.linkeo_store_reviews WHERE submission_id = p_submission_id) THEN
    RETURN;
  END IF;

  IF EXISTS(SELECT 1 FROM public.linkeo_store_reviews WHERE contact_email = v_email AND created_at > now() - interval '10 minutes')
     OR (SELECT count(*) FROM public.linkeo_store_reviews WHERE contact_email = v_email AND created_at > now() - interval '1 day') >= 3 THEN
    RAISE EXCEPTION 'Please wait before submitting another review' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.linkeo_store_reviews (
    submission_id, display_name, business, product_id,
    rating, comment, contact_email, district, order_reference
  ) VALUES (
    p_submission_id, btrim(p_display_name), btrim(coalesce(p_business, '')), p_product_id,
    p_rating, btrim(p_comment), v_email, btrim(coalesce(p_district, '')), btrim(coalesce(p_order_reference, ''))
  );
END;
$$;
REVOKE ALL ON FUNCTION public.linkeo_submit_review(uuid,text,text,text,integer,text,text,text,text,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.linkeo_submit_review(uuid,text,text,text,integer,text,text,text,text,boolean,text) TO anon, authenticated;

-- 4. Funciones de administración de reseñas para socios de Linkeo_Ges
CREATE OR REPLACE FUNCTION public.linkeoges_reviews()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.linkeoges_partner() IS NULL THEN
    RAISE EXCEPTION 'Acceso no autorizado' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::jsonb)
    FROM public.linkeo_store_reviews r
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.linkeoges_review_moderate(p_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.linkeoges_partner() IS NULL THEN
    RAISE EXCEPTION 'Acceso no autorizado' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Estado inválido' USING ERRCODE = '22023';
  END IF;

  UPDATE public.linkeo_store_reviews
  SET status = p_status
  WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.linkeoges_reviews() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.linkeoges_review_moderate(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.linkeoges_reviews(), public.linkeoges_review_moderate(uuid, text) TO authenticated;

-- 5. Realtime publication
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='catalog_sync') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.catalog_sync;
  END IF;
END $$;

COMMIT;
