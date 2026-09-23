import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Convertidores entre snake_case (PostgreSQL) y camelCase (React Frontend)
export const mappers = {
  saleToFront: (s) => ({
    id: s.id,
    saleNumber: s.id.slice(0, 8).toUpperCase(),
    date: s.date,
    clientName: s.client_name,
    contactPerson: s.contact_person || '',
    phone: s.phone || '',
    district: s.district || '',
    productId: s.product_id,
    productName: s.product_name,
    quantity: Number(s.quantity),
    unitPrice: Number(s.unit_price),
    totalAmount: Number(s.total_amount),
    cost: Number(s.total_cost || 0),
    profit: Number(s.gross_margin || 0),
    paymentMethod: s.payment_method,
    soldBy: s.sold_by,
    status: s.delivery_status || 'entregado',
    cardIds: []
  }),

  saleToDb: (s) => ({
    id: s.id,
    client_name: s.clientName,
    contact_person: s.contactPerson || '',
    phone: s.phone || '',
    district: s.district || '',
    product_id: s.productId,
    product_name: s.productName,
    quantity: Number(s.quantity) || 1,
    unit_price: Number(s.unitPrice) || 0,
    total_amount: Number(s.totalAmount) || 0,
    unit_cost: Number(s.unitPrice ? s.cost / s.quantity : 0),
    total_cost: Number(s.cost) || 0,
    gross_margin: Number(s.profit) || 0,
    payment_method: s.paymentMethod,
    sold_by: s.soldBy,
    delivery_status: s.status || 'entregado',
    date: s.date || new Date().toISOString().slice(0, 10)
  }),

  expenseToFront: (e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amount: Number(e.amount),
    paymentMethod: e.payment_method,
    paidBy: e.paid_by,
    month: e.month,
    date: e.date,
    receiptUrl: e.receipt_url || ''
  }),

  expenseToDb: (e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amount: Number(e.amount),
    payment_method: e.paymentMethod,
    paid_by: e.paidBy,
    month: e.month,
    date: e.date || new Date().toISOString().slice(0, 10),
    receipt_url: e.receiptUrl || ''
  }),

  leadToFront: (l) => ({
    id: l.id,
    businessName: l.business_name,
    rubro: l.rubro || '',
    district: l.district || '',
    address: l.address || '',
    contactName: l.contact_name || '',
    phone: l.phone || '',
    stage: l.stage || 'prospecto',
    priority: l.priority || 'media',
    responsible: l.responsible || 'both',
    estimatedValue: Number(l.estimated_value || 0),
    googleMapsUrl: l.google_maps_url || '',
    notes: l.notes || ''
  }),

  leadToDb: (l) => ({
    id: l.id,
    business_name: l.businessName,
    rubro: l.rubro || '',
    district: l.district || '',
    address: l.address || '',
    contact_name: l.contactName || '',
    phone: l.phone || '',
    stage: l.stage || 'prospecto',
    priority: l.priority || 'media',
    responsible: l.responsible || 'both',
    estimated_value: Number(l.estimatedValue || 0),
    google_maps_url: l.googleMapsUrl || '',
    notes: l.notes || ''
  }),

  nfcToFront: (c) => ({
    id: c.id,
    chipUid: c.uid,
    batch: c.batch || '',
    model: c.model,
    category: c.category || 'Individual',
    reviewUrl: c.url || '',
    status: c.status || 'virgen',
    businessName: c.assigned_to || '',
    readCount: Number(c.read_count || 0)
  }),

  nfcToDb: (c) => ({
    id: c.id,
    uid: c.chipUid || c.id,
    batch: c.batch || '',
    model: c.model || 'Tarjeta NFC',
    category: c.category || 'Individual',
    url: c.reviewUrl || '',
    status: c.status || 'virgen',
    assigned_to: c.businessName || '',
    read_count: Number(c.readCount || 0)
  }),

  inventoryToFront: (i) => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    category: i.category,
    quantity: Number(i.quantity || 0),
    minThreshold: Number(i.min_threshold || 10),
    unitCost: Number(i.unit_cost || 0),
    supplier: i.supplier || '',
    leadTimeDays: Number(i.lead_time_days || 7),
    status: i.status || 'optimo',
    reorderUrl: i.reorder_url || '',
    notes: i.notes || ''
  }),

  inventoryToDb: (i) => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    category: i.category,
    quantity: Number(i.quantity || 0),
    min_threshold: Number(i.minThreshold || 10),
    unit_cost: Number(i.unitCost || 0),
    supplier: i.supplier || '',
    lead_time_days: Number(i.leadTimeDays || 7),
    status: i.status || 'optimo',
    reorder_url: i.reorderUrl || '',
    notes: i.notes || ''
  }),

  supplierToFront: (s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    contactPerson: s.contact_person || '',
    phone: s.phone || '',
    email: s.email || '',
    country: s.country || 'Perú',
    leadTimeDays: Number(s.lead_time_days || 5),
    minOrderQty: Number(s.min_order_qty || 1),
    status: s.status || 'Activo',
    paymentTerms: s.payment_terms || '',
    notes: s.notes || ''
  }),

  supplierToDb: (s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    contact_person: s.contactPerson || '',
    phone: s.phone || '',
    email: s.email || '',
    country: s.country || 'Perú',
    lead_time_days: Number(s.leadTimeDays || 5),
    min_order_qty: Number(s.minOrderQty || 1),
    status: s.status || 'Activo',
    payment_terms: s.paymentTerms || '',
    notes: s.notes || ''
  }),

  eventToFront: (e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    date: e.date,
    startTime: e.start_time,
    endTime: e.end_time || '',
    district: e.district || '',
    address: e.address || '',
    clientName: e.client_name || '',
    responsible: e.responsible || 'both',
    status: e.status || 'pendiente',
    description: e.description || ''
  }),

  eventToDb: (e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    date: e.date,
    start_time: e.startTime,
    end_time: e.endTime || '',
    district: e.district || '',
    address: e.address || '',
    client_name: e.clientName || '',
    responsible: e.responsible || 'both',
    status: e.status || 'pendiente',
    description: e.description || ''
  }),

  productToFront: (p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    type: p.type,
    price: Number(p.price),
    cost: Number(p.cost),
    margin: Number(p.margin),
    marginPct: Number(p.margin_pct || 0),
    badge: p.badge || '',
    description: p.description || '',
    imageUrl: p.image_url || ''
  }),

  productToDb: (p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    type: p.type,
    price: Number(p.price),
    cost: Number(p.cost),
    margin: Number(p.margin),
    margin_pct: Number(p.marginPct || 0),
    badge: p.badge || '',
    description: p.description || '',
    image_url: p.imageUrl || ''
  }),

  auditLogToFront: (a) => ({
    id: a.id,
    timestamp: a.timestamp,
    actionType: a.action_type || 'Modificación',
    entityType: a.entity_type,
    entityId: a.entity_id,
    entityName: a.entity_name,
    author: a.deleted_by,
    authorName: a.deleted_by === 'kevin' ? 'Kevin Servat' : 'Luis Romero',
    deletedBy: a.deleted_by,
    reason: a.reason,
    snapshot: a.snapshot,
    restorable: a.restorable
  }),

  auditLogToDb: (a) => ({
    id: a.id,
    entity_type: a.entityType,
    entity_id: a.entityId,
    entity_name: a.entityName,
    deleted_by: a.author || a.deletedBy || 'luis',
    reason: a.reason || '',
    snapshot: a.snapshot || null,
    restorable: a.restorable ?? true
  })
};

/**
 * Servicio unificado de sincronización LinkeoGes
 */
export const dbService = {
  isCloudReady: () => isSupabaseConfigured,

  // Carga inicial masiva desde Supabase
  async fetchAllInitialData() {
    if (!isSupabaseConfigured) return null;

    try {
      const [
        salesRes,
        expensesRes,
        leadsRes,
        nfcRes,
        invRes,
        suppRes,
        eventsRes,
        prodRes,
        distRes,
        auditRes
      ] = await Promise.all([
        supabase.from('sales').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('nfc_cards').select('*').order('created_at', { ascending: false }),
        supabase.from('inventory').select('*').order('sku', { ascending: true }),
        supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
        supabase.from('calendar_events').select('*').order('date', { ascending: true }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('districts').select('*').order('name', { ascending: true }),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50)
      ]);

      return {
        sales: salesRes.data ? salesRes.data.map(mappers.saleToFront) : [],
        expenses: expensesRes.data ? expensesRes.data.map(mappers.expenseToFront) : [],
        leads: leadsRes.data ? leadsRes.data.map(mappers.leadToFront) : [],
        nfcCards: nfcRes.data ? nfcRes.data.map(mappers.nfcToFront) : [],
        inventory: invRes.data ? invRes.data.map(mappers.inventoryToFront) : [],
        suppliers: suppRes.data ? suppRes.data.map(mappers.supplierToFront) : [],
        calendarEvents: eventsRes.data ? eventsRes.data.map(mappers.eventToFront) : [],
        products: prodRes.data ? prodRes.data.map(mappers.productToFront) : [],
        districts: distRes.data && distRes.data.length > 0 ? distRes.data.map(d => d.name) : null,
        auditLogs: auditRes.data ? auditRes.data.map(mappers.auditLogToFront) : []
      };
    } catch (err) {
      console.warn('Error fetching all initial data from Supabase:', err);
      return null;
    }
  },

  // Inserción y eliminación genérica
  async insert(table, item, mapper) {
    if (!isSupabaseConfigured) return null;
    try {
      const payload = mapper ? mapper(item) : item;
      const { data, error } = await supabase.from(table).insert([payload]).select();
      if (error) console.warn(`Error inserting into ${table}:`, error);
      return data;
    } catch (e) {
      console.warn(`Exception inserting into ${table}:`, e);
      return null;
    }
  },

  async delete(table, id) {
    if (!isSupabaseConfigured) return null;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) console.warn(`Error deleting from ${table}:`, error);
      return !error;
    } catch (e) {
      console.warn(`Exception deleting from ${table}:`, e);
      return false;
    }
  },

  async update(table, id, fields, mapper) {
    if (!isSupabaseConfigured) return null;
    try {
      const payload = mapper ? mapper(fields) : fields;
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
      if (error) console.warn(`Error updating ${table}:`, error);
      return data;
    } catch (e) {
      console.warn(`Exception updating ${table}:`, e);
      return null;
    }
  }
};
