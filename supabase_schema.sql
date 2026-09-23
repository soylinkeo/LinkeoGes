-- ====================================================================
-- LINKEO GES - ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Proyecto: LinkeoGes ERP & CRM (Tarjetas Inteligentes NFC)
-- Socios: Luis Romero & Kevin Servat (Co-CEOs 50/50)
-- ====================================================================

-- Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: VENTAS (SALES)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    client_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    district TEXT,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    gross_margin NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    sold_by TEXT NOT NULL,
    delivery_status TEXT DEFAULT 'entregado',
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA: GASTOS (EXPENSES)
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    paid_by TEXT NOT NULL,
    month TEXT NOT NULL,
    date TEXT NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA: TARJETAS NFC & TRAZABILIDAD (NFC_CARDS)
CREATE TABLE IF NOT EXISTS nfc_cards (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    uid TEXT UNIQUE NOT NULL,
    batch TEXT,
    model TEXT NOT NULL,
    category TEXT,
    url TEXT,
    status TEXT DEFAULT 'virgen',
    assigned_to TEXT,
    read_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA: PROSPECTOS / LEADS KANBAN (LEADS)
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    business_name TEXT NOT NULL,
    rubro TEXT,
    district TEXT,
    address TEXT,
    contact_name TEXT,
    phone TEXT,
    stage TEXT DEFAULT 'prospecto',
    priority TEXT DEFAULT 'media',
    responsible TEXT DEFAULT 'both',
    estimated_value NUMERIC(10,2) DEFAULT 0,
    google_maps_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA: INVENTARIO (INVENTORY)
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    min_threshold INTEGER DEFAULT 10,
    unit_cost NUMERIC(10,2) DEFAULT 0,
    supplier TEXT,
    lead_time_days INTEGER DEFAULT 7,
    status TEXT DEFAULT 'optimo',
    reorder_url TEXT,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA: PROVEEDORES (SUPPLIERS)
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    country TEXT DEFAULT 'Perú',
    lead_time_days INTEGER DEFAULT 5,
    min_order_qty INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Activo',
    payment_terms TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA: EVENTOS DE AGENDA (CALENDAR_EVENTS)
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    district TEXT,
    address TEXT,
    client_name TEXT,
    responsible TEXT NOT NULL,
    status TEXT DEFAULT 'pendiente',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA: BITÁCORA DE AUDITORÍA (AUDIT_LOGS)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    deleted_by TEXT NOT NULL,
    reason TEXT,
    snapshot JSONB,
    restorable BOOLEAN DEFAULT TRUE
);

-- 9. TABLA: MAESTRO DE DISTRITOS (DISTRICTS)
CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserción inicial de distritos de Lima
INSERT INTO districts (name) VALUES 
('Miraflores'), ('San Isidro'), ('Barranco'), ('Surco'), ('San Borja'), 
('Magdalena'), ('Jesús María'), ('Lince'), ('San Miguel'), ('Pueblo Libre'), 
('La Molina'), ('Surquillo'), ('Lima Cercado')
ON CONFLICT (name) DO NOTHING;

-- 10. TABLA: CATÁLOGO DE PRODUCTOS & INNOVACIONES (PRODUCTS)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    type TEXT,
    price NUMERIC(10,2) NOT NULL,
    cost NUMERIC(10,2) NOT NULL,
    margin NUMERIC(10,2) NOT NULL,
    margin_pct NUMERIC(5,2),
    badge TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) con acceso total mediante Anon Key
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura anónima (para uso interno autorizado mediante frontend)
CREATE POLICY "Acceso total a sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a nfc_cards" ON nfc_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a districts" ON districts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a products" ON products FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Supabase Realtime para sincronización instantánea entre socios
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE nfc_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE products;

