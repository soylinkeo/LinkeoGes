const legacyMappers = {
  saleToFront: (s) => ({
    id: s.id,
    saleNumber: s.payload?.saleNumber || s.id.toUpperCase(),
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
    cardIds: s.payload?.cardIds || []
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
    unit_cost: Number(s.quantity ? s.cost / s.quantity : 0),
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
    email: l.email || l.payload?.email || '',
    stage: l.stage || 'prospecto',
    priority: l.priority || 'media',
    responsible: l.responsible || 'both',
    assignedTo: l.payload?.assignedTo || l.responsible || 'both',
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
    responsible: l.assignedTo || l.responsible || 'both',
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
    readCount: Number(c.read_count || 0),
    bipsNfc: Number(c.bips_nfc || 0),
    bipsQr: Number(c.bips_qr || 0),
    lastReadAt: c.last_read_at || null
  }),

  nfcToDb: (c) => ({
    id: c.id,
    uid: c.chipUid || null,
    batch: c.batch || '',
    model: c.model || 'Tarjeta NFC',
    category: c.category || 'Individual',
    url: c.reviewUrl || '',
    status: c.status || 'virgen',
    assigned_to: c.businessName || '',
    read_count: Number(c.readCount || (Number(c.bipsNfc || 0) + Number(c.bipsQr || 0)) || 0),
    bips_nfc: Number(c.bipsNfc || 0),
    bips_qr: Number(c.bipsQr || 0),
    last_read_at: c.lastReadAt || null
  }),

  inventoryToFront: (i) => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    category: i.category,
    quantity: Number(i.quantity || 0),
    minThreshold: Number(i.min_threshold ?? 10),
    unitCost: Number(i.unit_cost || 0),
    supplier: i.supplier || '',
    leadTimeDays: Number(i.lead_time_days ?? 7),
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
    min_threshold: Number(i.minThreshold ?? 10),
    unit_cost: Number(i.unitCost || 0),
    supplier: i.supplier || '',
    lead_time_days: Number(i.leadTimeDays ?? 7),
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


// Preserve every form field in payload, while typed SQL columns remain authoritative.
export const mappers = Object.fromEntries(Object.entries(legacyMappers).map(([name, map]) => [
  name, name.endsWith('ToDb')
    ? (value) => ({ ...map(value), payload: value })
    : (row) => ({ ...map(row), ...(row.payload || {}), id: row.id })
]));
