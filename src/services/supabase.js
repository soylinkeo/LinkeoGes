import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://ntzkjkvgtytlobvbplov.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50emtqa3ZndHl0bG9idmJwbG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMTkxNzgsImV4cCI6MjEwNTY5NTE3OH0.qHF9gTv-gazjmEHkStQAqWek3iADbxLye3JwGPtoaTU';

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
    category: s.category || 'Insumos',
    itemSupplied: s.category || '',
    contactPerson: s.contact_person || '',
    contact: s.contact_person || '',
    phone: s.phone || '',
    email: s.email || '',
    country: s.country || 'Perú',
    leadTimeDays: Number(s.lead_time_days || 5),
    leadTime: `${s.lead_time_days || 5} días`,
    minOrderQty: Number(s.min_order_qty || 1),
    minOrder: `${s.min_order_qty || 1} unidades`,
    status: s.status || 'Activo',
    paymentTerms: s.payment_terms || '',
    notes: s.notes || ''
  }),

  supplierToDb: (s) => ({
    id: s.id,
    name: s.name,
    category: s.category || s.itemSupplied || 'Insumos Generales',
    contact_person: s.contactPerson || s.contact || '',
    phone: s.phone || '',
    email: s.email || '',
    country: s.country || 'Perú',
    lead_time_days: Number(s.leadTimeDays || (typeof s.leadTime === 'string' ? parseInt(s.leadTime, 10) : 5) || 5),
    min_order_qty: Number(s.minOrderQty || (typeof s.minOrder === 'string' ? parseInt(s.minOrder, 10) : 1) || 1),
    status: s.status || 'Activo',
    payment_terms: s.paymentTerms || '',
    notes: s.notes || (s.unitCostAvg ? `Costo: ${s.unitCostAvg}` : '')
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
    client: e.client_name || '',
    clientName: e.client_name || '',
    partner: e.responsible || 'both',
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
    client_name: e.client || e.clientName || '',
    responsible: e.partner || e.responsible || 'both',
    status: e.status || 'pendiente',
    description: e.description || ''
  }),

  productToFront: (p) => {
    let bundleItems = [];
    let cleanDescription = p.description || '';
    if (cleanDescription.includes('||BUNDLE:')) {
      try {
        const parts = cleanDescription.split('||BUNDLE:');
        cleanDescription = parts[0].trim();
        bundleItems = JSON.parse(parts[1].replace(/\|\|$/, '').trim());
      } catch (e) {}
    }
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      type: p.type || (bundleItems.length > 0 ? 'pack' : 'individual'),
      price: Number(p.price),
      cost: Number(p.cost),
      margin: Number(p.margin),
      marginPct: Number(p.margin_pct || 0),
      badge: p.badge || '',
      description: cleanDescription,
      imageUrl: p.image_url || '',
      bundleItems: bundleItems
    };
  },

  productToDb: (p) => {
    let dbDescription = p.description || '';
    if (p.bundleItems && Array.isArray(p.bundleItems) && p.bundleItems.length > 0) {
      dbDescription = `${dbDescription.trim()} ||BUNDLE:${JSON.stringify(p.bundleItems)}||`;
    }
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      type: p.type || (p.bundleItems && p.bundleItems.length > 0 ? 'pack' : 'individual'),
      price: Number(p.price) || 0,
      cost: Number(p.cost) || 0,
      margin: Number(p.margin) || 0,
      margin_pct: Number(p.marginPct || p.margin_pct || 0),
      badge: p.badge || '',
      description: dbDescription,
      image_url: p.imageUrl || p.image_url || ''
    };
  },

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

  // Carga inicial masiva desde Supabase (Resiliente y con fallback en la nube)
  async fetchAllInitialData() {
    if (!isSupabaseConfigured) return null;

    try {
      const fetchTable = async (query) => {
        try {
          const res = await query;
          return res.error ? null : res.data;
        } catch (e) {
          return null;
        }
      };

      const [
        salesData,
        expensesData,
        leadsData,
        nfcData,
        invData,
        suppData,
        eventsData,
        prodData,
        distData,
        auditData
      ] = await Promise.all([
        fetchTable(supabase.from('sales').select('*').order('created_at', { ascending: false })),
        fetchTable(supabase.from('expenses').select('*').order('created_at', { ascending: false })),
        fetchTable(supabase.from('leads').select('*').order('created_at', { ascending: false })),
        fetchTable(supabase.from('nfc_cards').select('*').order('created_at', { ascending: false })),
        fetchTable(supabase.from('inventory').select('*').order('sku', { ascending: true })),
        fetchTable(supabase.from('suppliers').select('*').order('created_at', { ascending: false })),
        fetchTable(supabase.from('calendar_events').select('*').order('date', { ascending: true })),
        fetchTable(supabase.from('products').select('*').order('created_at', { ascending: false })),
        fetchTable(supabase.from('districts').select('*').order('name', { ascending: true })),
        fetchTable(supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100))
      ]);

      // Consultar proyecciones (tabla dedicada o fallback en audit_logs)
      let projections = null;
      try {
        const { data, error } = await supabase.from('projections').select('*').eq('id', 'current').maybeSingle();
        if (!error && data?.data) projections = data.data;
      } catch (e) {}

      if (!projections && auditData) {
        const projLog = auditData.find(a => a.id === 'sys-projections-current');
        if (projLog?.snapshot) projections = projLog.snapshot;
      }

      // Consultar plan 30 días (tabla dedicada o fallback en audit_logs)
      let plan30Days = null;
      try {
        const { data, error } = await supabase.from('plan_30_days').select('*').eq('id', 'current').maybeSingle();
        if (!error && data?.tasks) plan30Days = data.tasks;
      } catch (e) {}

      if (!plan30Days && auditData) {
        const planLog = auditData.find(a => a.id === 'sys-plan-30-days');
        if (planLog?.snapshot) plan30Days = planLog.snapshot;
      }

      // Filtrar registros de sistema internos de la lista de auditoría para no mostrarlos como bajas
      const userAuditLogs = auditData
        ? auditData.filter(a => !a.id.startsWith('sys-')).map(mappers.auditLogToFront)
        : [];

      return {
        sales: salesData ? salesData.map(mappers.saleToFront) : [],
        expenses: expensesData ? expensesData.map(mappers.expenseToFront) : [],
        leads: leadsData ? leadsData.map(mappers.leadToFront) : [],
        nfcCards: nfcData ? nfcData.map(mappers.nfcToFront) : [],
        inventory: invData ? invData.map(mappers.inventoryToFront) : [],
        suppliers: suppData ? suppData.map(mappers.supplierToFront) : [],
        calendarEvents: eventsData ? eventsData.map(mappers.eventToFront) : [],
        products: prodData ? prodData.map(mappers.productToFront) : [],
        districts: distData && distData.length > 0 ? distData.map(d => d.name) : null,
        auditLogs: userAuditLogs,
        projections,
        plan30Days
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
  },

  // Persistencia de Proyecciones en Base de Datos Supabase (Dual: tabla dedicada + audit_logs)
  async saveProjections(projectionsData) {
    if (!isSupabaseConfigured || !supabase) return false;
    let saved = false;
    try {
      const { error } = await supabase
        .from('projections')
        .upsert({ id: 'current', data: projectionsData, updated_at: new Date().toISOString() });
      if (!error) saved = true;
    } catch (e) {}

    try {
      const { error: fbErr } = await supabase
        .from('audit_logs')
        .upsert({
          id: 'sys-projections-current',
          entity_type: 'system_config',
          entity_id: 'projections',
          entity_name: 'Proyecciones y Metas Financieras',
          deleted_by: 'system',
          reason: 'Sincronización de proyecciones en tiempo real',
          snapshot: projectionsData,
          restorable: false
        });
      if (!fbErr) saved = true;
    } catch (e) {}
    return saved;
  },

  // Persistencia del Plan 30 Días en Base de Datos Supabase (Dual: tabla dedicada + audit_logs)
  async savePlan30Days(tasks) {
    if (!isSupabaseConfigured || !supabase) return false;
    let saved = false;
    try {
      const { error } = await supabase
        .from('plan_30_days')
        .upsert({ id: 'current', tasks, updated_at: new Date().toISOString() });
      if (!error) saved = true;
    } catch (e) {}

    try {
      const { error: fbErr } = await supabase
        .from('audit_logs')
        .upsert({
          id: 'sys-plan-30-days',
          entity_type: 'system_config',
          entity_id: 'plan_30_days',
          entity_name: 'Plan 30 Días Estratégico',
          deleted_by: 'system',
          reason: 'Sincronización de tareas en tiempo real',
          snapshot: tasks,
          restorable: false
        });
      if (!fbErr) saved = true;
    } catch (e) {}
    return saved;
  },

  // Persistencia de Catálogo y Packs Promocionales
  async saveProduct(product) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const payload = mappers.productToDb(product);
      const { data, error } = await supabase.from('products').upsert(payload).select();
      if (error) console.warn('Error saving product to Supabase:', error);
      return data;
    } catch (e) {
      console.warn('Exception saving product to Supabase:', e);
      return null;
    }
  },

  async deleteProduct(productId) {
    if (!isSupabaseConfigured || !supabase) return false;
    return await this.delete('products', productId);
  },

  // Persistencia de Stock Físico e Insumos (Inventario)
  async saveInventoryItem(item) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const payload = mappers.inventoryToDb(item);
      const { data, error } = await supabase.from('inventory').upsert(payload).select();
      if (error) console.warn('Error saving inventory item to Supabase:', error);
      return data;
    } catch (e) {
      console.warn('Exception saving inventory item to Supabase:', e);
      return null;
    }
  },

  async deleteInventoryItem(itemId) {
    if (!isSupabaseConfigured || !supabase) return false;
    return await this.delete('inventory', itemId);
  },

  // Persistencia de Proveedores
  async saveSupplier(supplier) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const payload = mappers.supplierToDb(supplier);
      const { data, error } = await supabase.from('suppliers').upsert(payload).select();
      if (error) console.warn('Error saving supplier to Supabase:', error);
      return data;
    } catch (e) {
      console.warn('Exception saving supplier to Supabase:', e);
      return null;
    }
  },

  async deleteSupplier(supplierId) {
    if (!isSupabaseConfigured || !supabase) return false;
    return await this.delete('suppliers', supplierId);
  }
};
