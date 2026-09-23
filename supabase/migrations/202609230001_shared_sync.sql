-- Ejecutar con SQL Editor como administrador DESPUÉS de supabase_schema.sql.
-- No elimina datos existentes. Publicar el nuevo frontend después de esta migración.
BEGIN;

CREATE TABLE IF NOT EXISTS public.app_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id text UNIQUE NOT NULL CHECK (partner_id IN ('luis', 'kevin'))
);
CREATE TABLE IF NOT EXISTS public.app_sync (
  id integer PRIMARY KEY CHECK (id = 1), revision bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_sync(id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.app_settings (id text PRIMARY KEY, value jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS public.app_requests (
  id uuid PRIMARY KEY, user_id uuid NOT NULL, revision bigint NOT NULL, response jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.operation_journal (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, request_id uuid NOT NULL,
  user_id uuid NOT NULL, partner_id text NOT NULL, operations jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['sales','expenses','nfc_cards','leads','inventory','suppliers','calendar_events','products','audit_logs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT ''{}''::jsonb', t);
  END LOOP;
END $$;
ALTER TABLE public.nfc_cards ALTER COLUMN uid DROP NOT NULL;

-- Recover singleton settings from their dedicated tables or the old fallback.
INSERT INTO public.app_settings(id,value)
SELECT 'projectionsData', data FROM public.projections WHERE id='current'
ON CONFLICT DO NOTHING;
INSERT INTO public.app_settings(id,value)
SELECT 'plan30Days', tasks FROM public.plan_30_days WHERE id='current'
ON CONFLICT DO NOTHING;
INSERT INTO public.app_settings(id,value)
SELECT CASE id WHEN 'sys-projections-current' THEN 'projectionsData' ELSE 'plan30Days' END, snapshot
FROM public.audit_logs WHERE id IN ('sys-projections-current','sys-plan-30-days') AND snapshot IS NOT NULL
ON CONFLICT DO NOTHING;

-- Existing confirmed Auth accounts can be linked; no public signup becomes a member automatically.
INSERT INTO public.app_members(user_id,partner_id)
SELECT id, CASE lower(email) WHEN 'luis@linkeocards.com' THEN 'luis' ELSE 'kevin' END
FROM auth.users WHERE lower(email) IN ('luis@linkeocards.com','kevin@linkeocards.com') AND email_confirmed_at IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.linkeoges_partner() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT partner_id FROM public.app_members WHERE user_id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.linkeoges_partner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.linkeoges_partner() TO authenticated;

-- Remove every previous permissive policy, including the legacy credential store.
DO $$ DECLARE t text; p record; BEGIN
  FOREACH t IN ARRAY ARRAY['sales','expenses','nfc_cards','leads','inventory','suppliers','calendar_events','products','districts','audit_logs','user_credentials','projections','plan_30_days','app_members','app_sync','app_settings','app_requests','operation_journal'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t);
    END LOOP;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t);
  END LOOP;
END $$;
GRANT SELECT ON public.app_members, public.app_sync TO authenticated;
CREATE POLICY member_self ON public.app_members FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY member_sync ON public.app_sync FOR SELECT TO authenticated USING(public.linkeoges_partner() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.linkeoges_snapshot() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result jsonb; t text; rows jsonb; tables jsonb := '{}'::jsonb;
BEGIN
  IF public.linkeoges_partner() IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado' USING ERRCODE='42501'; END IF;
  -- Hold a shared revision lock throughout the read, so tables cannot mix versions.
  SELECT jsonb_build_object('revision',revision) INTO result FROM public.app_sync WHERE id=1 FOR SHARE;
  FOREACH t IN ARRAY ARRAY['sales','expenses','nfc_cards','leads','inventory','suppliers','calendar_events','products','districts','audit_logs'] LOOP
    EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.id), ''[]''::jsonb) FROM public.%I r WHERE r.id NOT LIKE ''sys-%%''',t) INTO rows;
    tables := tables || jsonb_build_object(t,rows);
  END LOOP;
  RETURN result || jsonb_build_object('tables',tables,'settings',
    (SELECT coalesce(jsonb_object_agg(id,value),'{}'::jsonb) FROM public.app_settings));
END $$;

CREATE OR REPLACE FUNCTION public.linkeoges_commit(expected_revision bigint, request_id uuid, operations jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor text := public.linkeoges_partner(); current_revision bigint;
  op jsonb; t text; kind text; row_id text; value jsonb; old_row jsonb;
  cols text; vals text; updates text; affected integer; recorded_user uuid; saved_response jsonb;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado' USING ERRCODE='42501'; END IF;
  IF request_id IS NULL OR jsonb_typeof(operations) <> 'array' OR jsonb_array_length(operations)>2000 THEN
    RAISE EXCEPTION 'Operación inválida';
  END IF;
  SELECT revision INTO current_revision FROM public.app_sync WHERE id=1 FOR UPDATE;
  SELECT user_id,response INTO recorded_user,saved_response FROM public.app_requests WHERE id=request_id;
  IF FOUND THEN
    IF recorded_user <> auth.uid() THEN RAISE EXCEPTION 'Solicitud no autorizada'; END IF;
    RETURN saved_response;
  END IF;
  IF expected_revision IS DISTINCT FROM current_revision THEN
    RAISE EXCEPTION 'La versión cambió en otra computadora' USING ERRCODE='40001';
  END IF;
  FOR op IN SELECT * FROM jsonb_array_elements(operations) LOOP
    t := op->>'table'; kind := op->>'kind'; row_id := op->>'id'; value := op->'data';
    IF t IS NULL OR NOT t = ANY(ARRAY['sales','expenses','nfc_cards','leads','inventory','suppliers','calendar_events','products','districts','audit_logs','app_settings']) THEN
      RAISE EXCEPTION 'Tabla no permitida';
    END IF;
    IF kind IS NULL OR NOT kind = ANY(ARRAY['insert','update','delete','upsert']) THEN RAISE EXCEPTION 'Acción inválida'; END IF;
    IF kind='upsert' AND t<>'app_settings' THEN RAISE EXCEPTION 'Upsert no permitido'; END IF;
    IF t='app_settings' THEN
      IF kind<>'upsert' OR row_id IS NULL OR NOT row_id=ANY(ARRAY['projectionsData','plan30Days','projectPhases','partnersState']) THEN RAISE EXCEPTION 'Configuración inválida'; END IF;
      INSERT INTO public.app_settings(id,value) VALUES(row_id,value->'value') ON CONFLICT(id) DO UPDATE SET value=excluded.value;
      CONTINUE;
    END IF;
    IF kind='delete' THEN
      IF t='audit_logs' THEN RAISE EXCEPTION 'La auditoría es inmutable'; END IF;
      IF t='districts' THEN DELETE FROM public.districts WHERE name=op->>'name';
      ELSE EXECUTE format('DELETE FROM public.%I WHERE id=$1',t) USING row_id; END IF;
      GET DIAGNOSTICS affected = ROW_COUNT;
      IF affected<>1 THEN RAISE EXCEPTION 'El registro a eliminar ya no existe'; END IF;
      CONTINUE;
    END IF;
    IF row_id IS NULL OR row_id LIKE 'sys-%' OR jsonb_typeof(value)<>'object' THEN RAISE EXCEPTION 'Registro inválido'; END IF;
    value := value || jsonb_build_object('id',row_id);
    IF t='audit_logs' THEN
      IF kind='update' THEN
        SELECT to_jsonb(a) INTO old_row FROM public.audit_logs a WHERE id=row_id;
        IF old_row IS NULL THEN RAISE EXCEPTION 'Auditoría inexistente'; END IF;
        -- Only review/restoration metadata can change; authorship, reason and snapshot cannot.
        UPDATE public.audit_logs SET payload = payload ||
          CASE WHEN value->'payload'->>'status'='restored' THEN jsonb_build_object('restored',true,'restoredBy',actor,'restoredByName',CASE actor WHEN 'luis' THEN 'Luis Romero' ELSE 'Kevin Servat' END,'restoredAt',now(),'status','restored')
          ELSE jsonb_build_object('reviewedBy',actor,'reviewedByName',CASE actor WHEN 'luis' THEN 'Luis Romero' ELSE 'Kevin Servat' END,'reviewedAt',now(),'status','approved') END
        WHERE id=row_id;
        CONTINUE;
      END IF;
      value := value || jsonb_build_object('deleted_by',actor,'timestamp',now(), 'payload',
        coalesce(value->'payload','{}'::jsonb) || jsonb_build_object('author',actor,'deletedBy',actor,'authorName',CASE actor WHEN 'luis' THEN 'Luis Romero' ELSE 'Kevin Servat' END,'timestamp',now()));
    END IF;
    -- Validate monetary and stock input in the server as well as the forms.
    IF t='inventory' AND ((value->>'quantity')::numeric < 0 OR (value->>'quantity')::numeric <> trunc((value->>'quantity')::numeric)) THEN RAISE EXCEPTION 'Stock inválido'; END IF;
    IF t='sales' AND ((value->>'quantity')::numeric <= 0 OR (value->>'unit_price')::numeric < 0 OR (value->>'total_cost')::numeric < 0
      OR abs((value->>'total_amount')::numeric - (value->>'quantity')::numeric*(value->>'unit_price')::numeric) > 0.01) THEN RAISE EXCEPTION 'Venta inválida'; END IF;
    IF t='expenses' AND (value->>'amount')::numeric <= 0 THEN RAISE EXCEPTION 'El monto debe ser mayor que cero'; END IF;
    IF t='products' AND ((value->>'price')::numeric < 0 OR (value->>'cost')::numeric < 0) THEN RAISE EXCEPTION 'Precio o costo inválido'; END IF;

    -- SQL identifiers come exclusively from real columns of an allowlisted table.
    IF EXISTS(SELECT 1 FROM jsonb_object_keys(value) k WHERE NOT EXISTS(
      SELECT 1 FROM pg_attribute a WHERE a.attrelid=format('public.%I',t)::regclass AND a.attname=k AND a.attnum>0 AND NOT a.attisdropped
    )) THEN RAISE EXCEPTION 'Campo desconocido en %',t; END IF;
    SELECT string_agg(format('%I',k),','), string_agg(format('r.%I',k),','), string_agg(format('%I=r.%I',k,k),',')
      INTO cols,vals,updates FROM jsonb_object_keys(value) k;
    IF kind='insert' THEN
      EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1) r',t,cols,vals,t) USING value;
    ELSE
      EXECUTE format('UPDATE public.%I target SET %s FROM jsonb_populate_record(NULL::public.%I,$1) r WHERE target.id=$2',t,updates,t) USING value,row_id;
      GET DIAGNOSTICS affected = ROW_COUNT;
      IF affected<>1 THEN RAISE EXCEPTION 'El registro a modificar ya no existe'; END IF;
    END IF;
  END LOOP;
  INSERT INTO public.operation_journal(request_id,user_id,partner_id,operations) VALUES(request_id,auth.uid(),actor,operations);
  UPDATE public.app_sync SET revision=revision+1,updated_at=now() WHERE id=1 RETURNING revision INTO current_revision;
  saved_response := public.linkeoges_snapshot();
  INSERT INTO public.app_requests(id,user_id,revision,response) VALUES(request_id,auth.uid(),current_revision,saved_response);
  RETURN saved_response;
END $$;
REVOKE ALL ON FUNCTION public.linkeoges_snapshot() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.linkeoges_commit(bigint,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.linkeoges_snapshot(), public.linkeoges_commit(bigint,uuid,jsonb) TO authenticated;

DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='app_sync') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_sync;
  END IF;
END $$;
COMMIT;
