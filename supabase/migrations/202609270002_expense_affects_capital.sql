-- Migración: Añadir columna affects_capital a la tabla expenses
-- Permite marcar egresos operativos que restan al Total en Capital (Ventas - Gastos afectables)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS affects_capital boolean DEFAULT false;
