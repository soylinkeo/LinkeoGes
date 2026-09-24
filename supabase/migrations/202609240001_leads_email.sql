-- LinkeoGes Migración: Agregar columna opcional email a la tabla leads si no existe
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email text;
