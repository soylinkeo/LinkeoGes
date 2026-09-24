-- Migración: Asegurar columnas de analítica NFC en la tabla nfc_cards
-- Ejecutar en Supabase SQL Editor si se desea tener las columnas nativas además del payload jsonb:

ALTER TABLE public.nfc_cards ADD COLUMN IF NOT EXISTS bips_nfc INTEGER DEFAULT 0;
ALTER TABLE public.nfc_cards ADD COLUMN IF NOT EXISTS bips_qr INTEGER DEFAULT 0;
ALTER TABLE public.nfc_cards ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE;
