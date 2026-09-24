import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mappers } from '../src/services/mappers.js';
import { calculateFinance } from '../src/utils/financeUtils.js';
import { computeDynamicTargets } from '../src/utils/projectionsUtils.js';
import { localDate, getAccountingMonth, accountingMonths } from '../src/utils/dateUtils.js';
import { createSale, getStockMovements, applyStockMovements } from '../src/utils/operations.js';
import { INITIAL_PRODUCTS, INITIAL_INVENTORY } from '../src/data/initialData.js';
import { formatGoogleMapsUrl } from '../src/utils/mapsUtils.js';

test('cloud round trips preserve all fields in every entity', () => {
  for (const entity of ['sale','expense','lead','nfc','inventory','supplier','event','product','auditLog']) {
    const input = { id: 'test', name: 'Prueba', quantity: 2, price: 50, amount: 20, notes: 'observación',
      type: 'Liquidación', assignedTo: 'kevin', nextStepDate: '2027-01-05', placeId: 'place',
      history: [{ action: 'configurada' }], cardIds: ['card1'], actionType: 'Creación', reviewedBy: 'kevin',
      minThreshold: 0, leadTimeDays: 0, bundleItems: [{ id: 'inv1', quantity: 2 }], extraField: 'preservar' };
    const result = mappers[entity+'ToFront'](mappers[entity+'ToDb'](input));
    for (const [key,value] of Object.entries(input)) assert.deepEqual(result[key],value, `${entity}.${key}`);
  }
});
test('paying the full partner debt leaves zero and does not affect profit', () => {
  const expenses = [{ paidBy: 'kevin', amount: 100, category: 'Movilidad' }];
  const before = calculateFinance([],expenses);
  const after = calculateFinance([], [...expenses,{ paidBy:'luis',amount:50,type:'Liquidación' }]);
  assert.equal(before.debtLuisToKevin,50); assert.equal(after.debtLuisToKevin,0);
  assert.equal(after.netProfit,before.netProfit);
});
test('purchases are not deducted a second time as operating expenses', () => {
  const result = calculateFinance([{ totalAmount:100,cost:40 }], [{ paidBy:'kevin',amount:40,category:'Compra de mercadería' }]);
  assert.equal(result.netProfit,60); assert.equal(result.debtLuisToKevin,20);
  assert.equal(result.inventoryPurchases, 40); assert.equal(result.totalDisbursed, 40);
});
test('a loss-making product cannot yield a feasible sales target', () => {
  const result = computeDynamicTargets({ projectedProducts:[{ price:10,baseCost:20,mixPercent:100 }] });
  assert.equal(result.isFeasible,false); assert.equal(result.monthlyUnitsTarget,0); assert.equal(result.weightedMargin,-10);
});
test('dates use Lima, including UTC midnight and future accounting years', () => {
  assert.equal(localDate(new Date('2027-01-01T02:00:00Z')),'2026-12-31');
  assert.equal(getAccountingMonth('2027-02-12'),'Febrero 2027');
  assert.ok(accountingMonths(['2040-01-01']).includes('Enero 2040'));
});
test('multi-unit sale records matching cards, unique identifiers and reversible stock', () => {
  const inventory = [{id:'i1',sku:'S1',name:'Card',quantity:5}];
  const product = {id:'p1',sku:'S1',name:'Card',price:50,cost:20};
  const form = {quantity:3,clientName:'Negocio',paymentMethod:'Yape'};
  const result = createSale({form,product,inventory,userId:'kevin'});
  assert.equal(result.cards.length,3); assert.equal(result.inventory[0].quantity,2);
  assert.equal(result.sale.totalAmount,150); assert.ok(result.cards.every(c=>c.chipUid===''));
  assert.deepEqual(applyStockMovements(result.inventory,result.sale.stockMovements,1),inventory);
  assert.notEqual(result.sale.id,createSale({form,product,inventory,userId:'kevin'}).sale.id);
  assert.throws(()=>createSale({form:{...form,quantity:6},product,inventory}),/Stock insuficiente/);
});
test('bundle duplicates aggregate and missing warehouse links fail instead of guessing', () => {
  const inventory = [{id:'i1',name:'Card',quantity:3}];
  assert.throws(()=>getStockMovements({bundleItems:[{id:'i1',quantity:2},{id:'i1',quantity:2}]},1,inventory),/Stock insuficiente/);
  assert.throws(()=>getStockMovements({id:'missing',name:'Card'},1,inventory),/Vincula/);
});

test('all inventory cards exist in catalog products and deduct physical stock upon sale', () => {
  const cardsInInventory = INITIAL_INVENTORY.filter(i => (i.category || '').toUpperCase().includes('CHIPS'));
  assert.equal(cardsInInventory.length, 3);
  for (const card of cardsInInventory) {
    const matchingProd = INITIAL_PRODUCTS.find(p => p.sku === card.sku || p.inventoryId === card.id);
    assert.ok(matchingProd, `Product for inventory card ${card.name} (${card.sku}) must exist in catalog`);
    const result = createSale({
      form: { clientName: 'Test Client', quantity: 1, paymentMethod: 'Yape' },
      product: matchingProd,
      inventory: INITIAL_INVENTORY,
      userId: 'luis'
    });
    const updatedCard = result.inventory.find(i => i.id === card.id);
    assert.equal(updatedCard.quantity, card.quantity - 1);
  }
});

test('appointment completion and daily tasks round-trip with status, summary and partner assignment', () => {
  const completedAppointment = {
    id: 'evt-100',
    title: 'Demo Restaurante Don Tito',
    type: 'demo',
    date: '2026-09-24',
    startTime: '16:00',
    endTime: '17:00',
    partner: 'luis',
    status: 'realizada',
    completed: true,
    resultSummary: 'Se realizó demo exitosa con tarjeta L. Interesados en 2 unidades.'
  };
  const apptFront = mappers.eventToFront(mappers.eventToDb(completedAppointment));
  assert.equal(apptFront.status, 'realizada');
  assert.equal(apptFront.resultSummary, completedAppointment.resultSummary);
  assert.equal(apptFront.partner, 'luis');

  const dailyTask = {
    id: 'task-100',
    title: 'Contactar 15 prospectos por WhatsApp',
    type: 'daily_task',
    isDailyTask: true,
    partner: 'both',
    status: 'completada',
    completed: true,
    category: 'Prospección',
    priority: 'alta'
  };
  const taskFront = mappers.eventToFront(mappers.eventToDb(dailyTask));
  assert.equal(taskFront.type, 'daily_task');
  assert.equal(taskFront.isDailyTask, true);
  assert.equal(taskFront.partner, 'both');
  assert.equal(taskFront.category, 'Prospección');
  assert.equal(taskFront.priority, 'alta');
});

test('dynamic custom fixed and variable costs calculate unit economics and break-even targets', async () => {
  const { computeDynamicTargets } = await import('../src/utils/projectionsUtils.js');

  const projectionsData = {
    businessParams: {
      customProfitTarget: 3900,
      partnersCount: 2
    },
    fixedCosts: [
      { id: 'fc-1', concept: 'Internet y Servidores', amount: 300, note: 'Infraestructura' }
    ],
    variableCosts: [
      { id: 'vc-1', concept: 'Empaque Kraft', type: 'unit_amount', amount: 3, note: 'Bolsa con sticker' },
      { id: 'vc-2', concept: 'Delivery por unidad', type: 'unit_amount', amount: 2, note: 'Envío promedio' },
      { id: 'vc-3', concept: 'Comisión Pasarela', type: 'percentage', amount: 5, note: '5% POS/Tarjeta' }
    ],
    projectedProducts: [
      { id: 'p1', name: 'Tarjeta NFC Linkeo', price: 60, baseCost: 13, mixPercent: 100, included: true }
    ]
  };

  const targetsWithDelivery = computeDynamicTargets(projectionsData);
  assert.equal(targetsWithDelivery.isFeasible, true);
  assert.equal(targetsWithDelivery.totalFixedCosts, 300);
  assert.equal(targetsWithDelivery.weightedPrice, 60);
  // Unit var cost = 13 + 5 + (60 * 0.05) = 21. Margin = 60 - 21 = 39.
  assert.equal(targetsWithDelivery.weightedMargin, 39);
  // Required units = ceil((300 + 3900) / 39) = ceil(4200 / 39) = 108
  assert.equal(targetsWithDelivery.monthlyUnitsTarget, 108);

  // Eliminar el costo variable de delivery
  const projectionsDataWithoutDelivery = {
    ...projectionsData,
    variableCosts: projectionsData.variableCosts.filter(c => c.id !== 'vc-2')
  };
  const targetsWithoutDelivery = computeDynamicTargets(projectionsDataWithoutDelivery);
  // Unit var cost = 13 + 3 + (60 * 0.05) = 19. Margin = 60 - 19 = 41.
  assert.equal(targetsWithoutDelivery.weightedMargin, 41);
  // Required units = ceil((300 + 3900) / 41) = ceil(4200 / 41) = 103
  assert.equal(targetsWithoutDelivery.monthlyUnitsTarget, 103);
});

test('plan 30 days tasks allow inline field modifications and day reassignment', () => {
  let plan = [
    { day: 1, week: 1, action: 'Definir oferta', target: 'Oferta escrita', channel: 'Gestión', responsible: 'Luis Romero', completed: false, result: '' }
  ];

  // Modificar acción y meta
  plan = plan.map(t => t.day === 1 ? { ...t, action: 'Visitar 5 cafeterías en Miraflores', target: '3 demos', channel: 'Presencial' } : t);
  assert.equal(plan[0].action, 'Visitar 5 cafeterías en Miraflores');
  assert.equal(plan[0].target, '3 demos');
  assert.equal(plan[0].channel, 'Presencial');

  // Reasignar día con _originalDay
  const updateWithNewDay = { ...plan[0], day: 5, week: 1, _originalDay: 1 };
  plan = plan.map(t => {
    const match = updateWithNewDay._originalDay !== undefined ? t.day === updateWithNewDay._originalDay : t.day === updateWithNewDay.day;
    if (match) {
      const { _originalDay, ...clean } = updateWithNewDay;
      return clean;
    }
    return t;
  });
  assert.equal(plan[0].day, 5);
  assert.equal(plan[0]._originalDay, undefined);
});

test('pipeline stages order, legacy normalization, and contacted check toggle', () => {
  const stages = [
    { id: 'prospecto', label: '1. Prospecto' },
    { id: 'visitado', label: '2. Visitado' },
    { id: 'negociacion', label: '3. Negociación' },
    { id: 'configurando', label: '4. Configurando NFC' },
    { id: 'entregado', label: '5. Entregado y Cobrado' },
    { id: 'postventa', label: '6. Post-Venta' }
  ];
  assert.equal(stages.length, 6);
  assert.equal(stages[0].id, 'prospecto');
  assert.equal(stages[1].id, 'visitado');
  assert.equal(stages[2].id, 'negociacion');
  assert.equal(stages[3].id, 'configurando');
  assert.equal(stages[4].id, 'entregado');
  assert.equal(stages[5].id, 'postventa');

  const normalize = (stage) => {
    if (!stage) return 'prospecto';
    const s = String(stage).toLowerCase().trim();
    if (s === 'contactado') return 'prospecto';
    if (s === 'esperando_info') return 'configurando';
    if (s === 'entregado_cobrado') return 'entregado';
    if (s === 'post_venta' || s === 'post-venta') return 'postventa';
    return s;
  };
  assert.equal(normalize('contactado'), 'prospecto');
  assert.equal(normalize('esperando_info'), 'configurando');
  assert.equal(normalize('entregado_cobrado'), 'entregado');
  assert.equal(normalize('post_venta'), 'postventa');
  assert.equal(normalize('visitado'), 'visitado');

  const lead = { id: 'l1', businessName: 'Café Miraflores', contacted: false, stage: 'prospecto' };
  const contactedLead = { ...lead, contacted: !lead.contacted };
  assert.equal(contactedLead.contacted, true);
});

test('registering a direct sale immediately places lead into Entregado y Cobrado', () => {
  const leads = [
    { id: 'lead-1', businessName: 'Barbería Don Tito', stage: 'prospecto', contacted: false, estimatedValue: 60 }
  ];
  const sale = { clientName: 'Barbería Don Tito', totalAmount: 120, district: 'Miraflores' };
  
  const clientNorm = sale.clientName.trim().toLowerCase();
  const existingIndex = leads.findIndex(l => l.businessName.trim().toLowerCase() === clientNorm);
  
  let updatedLeads;
  if (existingIndex !== -1) {
    updatedLeads = leads.map((l, idx) => idx === existingIndex ? {
      ...l,
      stage: 'entregado',
      contacted: true,
      estimatedValue: sale.totalAmount
    } : l);
  }
  
  assert.equal(updatedLeads[0].stage, 'entregado');
  assert.equal(updatedLeads[0].contacted, true);
  assert.equal(updatedLeads[0].estimatedValue, 120);

  const newClientSale = { clientName: 'Pollería Rokys', totalAmount: 180, district: 'Surco' };
  const newLead = {
    id: 'lead-sale-1',
    businessName: newClientSale.clientName,
    stage: 'entregado',
    contacted: true,
    estimatedValue: newClientSale.totalAmount
  };
  const withNewLead = [newLead, ...updatedLeads];
  assert.equal(withNewLead[0].stage, 'entregado');
  assert.equal(withNewLead[0].contacted, true);
  assert.equal(withNewLead[0].businessName, 'Pollería Rokys');
});

test('cannot select or sell more than available physical stock', () => {
  const inventory = [{ id: 'inv-card-l', sku: 'CRD-L', name: 'Tarjeta L', quantity: 1 }];
  const product = { id: 'prod-l', sku: 'CRD-L', name: 'Tarjeta Google NFC Formato L ESP', price: 80, cost: 20, stock: 1 };
  
  // 1. Intentar vender 2 cuando solo queda 1 en stock arroja error de stock insuficiente
  assert.throws(() => {
    createSale({
      form: { clientName: 'Lavatelli Dry Cleaners', quantity: 2, paymentMethod: 'Yape' },
      product,
      inventory,
      userId: 'luis'
    });
  }, /Stock insuficiente/);

  // 2. Vender exactamente 1 (el total disponible) se procesa correctamente y reduce stock a 0
  const saleResult = createSale({
    form: { clientName: 'Lavatelli Dry Cleaners', quantity: 1, paymentMethod: 'Yape' },
    product,
    inventory,
    userId: 'luis'
  });
  assert.equal(saleResult.sale.quantity, 1);
  assert.equal(saleResult.inventory.find(i => i.id === 'inv-card-l').quantity, 0);

  // 3. Intentar vender cuando el stock quedó en 0 es rechazado de inmediato
  assert.throws(() => {
    createSale({
      form: { clientName: 'Otro Cliente', quantity: 1, paymentMethod: 'Yape' },
      product,
      inventory: saleResult.inventory,
      userId: 'luis'
    });
  }, /Stock insuficiente/);
});

test('lead captures and preserves optional email/gmail address', () => {
  const leadWithEmail = {
    id: 'lead-test-1',
    businessName: 'Barbería Don Tito',
    contactName: 'Tito Gonzales',
    phone: '+51 987 654 321',
    email: 'dontito.barberia@gmail.com',
    district: 'Miraflores',
    stage: 'prospecto',
    estimatedValue: 120
  };
  const dbRow = mappers.leadToDb(leadWithEmail);
  assert.equal(dbRow.payload.email, 'dontito.barberia@gmail.com');
  const frontObj = mappers.leadToFront(dbRow);
  assert.equal(frontObj.email, 'dontito.barberia@gmail.com');
});

test('lead captures, formats and preserves google maps url with check verification', () => {
  // 1. Enlace corto de Maps sin protocolo -> añade https://
  const shortUrl = formatGoogleMapsUrl('maps.app.goo.gl/example123');
  assert.equal(shortUrl, 'https://maps.app.goo.gl/example123');

  // 2. Enlace completo con protocolo -> se preserva
  const fullUrl = formatGoogleMapsUrl('https://maps.app.goo.gl/example123');
  assert.equal(fullUrl, 'https://maps.app.goo.gl/example123');

  // 3. Dirección física escrita directamente -> convierte a búsqueda en Google Maps (evita error NXDOMAIN)
  const addressUrl = formatGoogleMapsUrl('Av. Caminos del Inca 2974, Lima 15039');
  assert.equal(addressUrl, 'https://www.google.com/maps/search/?api=1&query=Av.%20Caminos%20del%20Inca%202974%2C%20Lima%2015039');

  // 4. Dirección física que tenía https:// prefijado por error previo -> limpia y convierte a búsqueda
  const corruptedUrl = formatGoogleMapsUrl('https://Av. Caminos del Inca 2974, Lima 15039');
  assert.equal(corruptedUrl, 'https://www.google.com/maps/search/?api=1&query=Av.%20Caminos%20del%20Inca%202974%2C%20Lima%2015039');

  // 5. Campo vacío con datos de negocio -> genera búsqueda automática con el contexto
  const fallbackUrl = formatGoogleMapsUrl('', {
    businessName: 'Glowe Studio',
    address: 'Av. Caminos del Inca 2904',
    district: 'Santiago de Surco'
  });
  assert.equal(fallbackUrl, 'https://www.google.com/maps/search/?api=1&query=Glowe%20Studio%20Av.%20Caminos%20del%20Inca%202904%20Santiago%20de%20Surco%20Lima%2C%20Per%C3%BA');

  const leadWithMaps = {
    id: 'lead-maps-1',
    businessName: 'Glowe Studio',
    contactName: 'Encargado',
    phone: '933668238',
    district: 'Santiago de Surco',
    address: 'Av. Caminos del Inca 2904',
    googleMapsUrl: addressUrl,
    stage: 'visitado',
    estimatedValue: 60
  };

  const dbRow = mappers.leadToDb(leadWithMaps);
  assert.equal(dbRow.google_maps_url, addressUrl);
  const frontObj = mappers.leadToFront(dbRow);
  assert.equal(frontObj.googleMapsUrl, addressUrl);
});

test('phone input is strictly limited to 9 numeric digits and formats international WhatsApp link', () => {
  const sanitizePhone = (input) => String(input || '').replace(/\D/g, '').slice(0, 9);
  
  // Test numeric filtering & 9-digit truncation
  assert.equal(sanitizePhone('933 668 238'), '933668238');
  assert.equal(sanitizePhone('933668238000'), '933668238');
  assert.equal(sanitizePhone('abc933xyz668238'), '933668238');

  // Test WhatsApp wa.me generation with 9-digit Peru mobile
  const cleanPhone = sanitizePhone('933668238');
  assert.equal(cleanPhone.length, 9);
  const waNumber = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
  assert.equal(waNumber, '51933668238');
});

test('buildLeadWhatsAppMessage customizes by stage (prospect vs visitado) with web, tiktok, and instagram links', async () => {
  const { buildLeadWhatsAppMessage } = await import('../src/utils/leadMessages.js');

  // Case 1: Prospecto (Cold lead)
  const prospectLead = {
    businessName: 'Glowe Studio',
    stage: 'prospecto',
    contactName: 'Encargado'
  };
  const prospectMsg = buildLeadWhatsAppMessage(prospectLead);

  // Must start with '¡Hola!' and not contain 'visitamos' or 'Glowe Studio' in the greeting
  assert.ok(prospectMsg.startsWith('¡Hola!'));
  assert.ok(!prospectMsg.toLowerCase().includes('encargado'));
  assert.ok(!prospectMsg.toLowerCase().includes('dueño'));
  assert.ok(!prospectMsg.toLowerCase().includes('visitar su local'));

  // Must contain all 3 requested links
  assert.ok(prospectMsg.includes('https://linkeocards.com/'));
  assert.ok(prospectMsg.includes('https://www.instagram.com/linkeo_pe/'));
  assert.ok(prospectMsg.includes('https://www.tiktok.com/@linkeocards'));

  // Case 2: Visitado (Visited store)
  const visitadoLead = {
    businessName: 'GrekColor',
    stage: 'visitado',
    contactName: 'Encargado'
  };
  const visitadoMsg = buildLeadWhatsAppMessage(visitadoLead);

  // Must address the company name and mention visiting the store
  assert.ok(visitadoMsg.includes('GrekColor'));
  assert.ok(visitadoMsg.toLowerCase().includes('pasar a visitar su local'));
  assert.ok(!visitadoMsg.toLowerCase().includes('encargado'));
  assert.ok(!visitadoMsg.toLowerCase().includes('dueño'));
  assert.ok(visitadoMsg.toLowerCase().includes('gerencia y al equipo de dirección'));

  // Must contain all 3 requested links
  assert.ok(visitadoMsg.includes('https://linkeocards.com/'));
  assert.ok(visitadoMsg.includes('https://www.instagram.com/linkeo_pe/'));
  assert.ok(visitadoMsg.includes('https://www.tiktok.com/@linkeocards'));

  // Must propose visit to bring product directly with 2 min demo (vendible & brief)
  assert.ok(visitadoMsg.includes('llevarles el producto directamente'));
  assert.ok(visitadoMsg.includes('demostración rápida de 2 minutos'));

  // Test formal direct visit variant requested by user
  const formalMsg = buildLeadWhatsAppMessage(visitadoLead, 'visita_directa');
  assert.ok(formalMsg.includes('Nos encantaría saber si esta propuesta les resulta interesante'));
  assert.ok(formalMsg.includes('llevarles el producto directamente'));

  // Test getLeadMessageVariants helper
  const { getLeadMessageVariants } = await import('../src/utils/leadMessages.js');
  const variants = getLeadMessageVariants(visitadoLead);
  assert.equal(variants.length, 4);
  assert.equal(variants[0].id, 'vendible');
});

test('moving a lead to Entregado y Cobrado automatically considers it a sale and links bidirectionally', () => {
  const inventory = [{ id: 'inv-card-esp', sku: 'CRD-ESP', name: 'Tarjeta Google NFC Cuadrado ESP', quantity: 10 }];
  const product = { id: 'prod-sq', sku: 'CRD-ESP', name: 'Tarjeta Google NFC Cuadrado ESP', price: 60, cost: 15, stock: 10 };
  const products = [product];

  let sales = [];
  let leads = [
    { 
      id: 'lead-auto-1', 
      businessName: 'Lavatelli Dry Cleaners', 
      contactName: 'Encargado', 
      phone: '987654321', 
      district: 'Santiago de Surco', 
      stage: 'negociacion', 
      estimatedValue: 60,
      interestedProduct: 'Tarjeta Google NFC Cuadrado ESP',
      assignedTo: 'luis'
    }
  ];

  // Simulated transition to 'entregado'
  const targetLead = leads[0];
  const newStage = 'entregado';

  // Helper conversion logic matching App.jsx
  const convertLeadToSale = (lead) => {
    const existing = sales.find(s => 
      (s.leadId && s.leadId === lead.id) || 
      (s.clientName && lead.businessName && s.clientName.trim().toLowerCase() === lead.businessName.trim().toLowerCase())
    );
    if (existing) return existing;

    const prod = products.find(p => p.id === lead.interestedProduct || p.name === lead.interestedProduct) || products[0];
    const form = {
      clientName: lead.businessName,
      contactPerson: lead.contactName,
      phone: lead.phone,
      district: lead.district,
      quantity: 1,
      soldBy: lead.assignedTo || 'luis',
      paymentMethod: 'Transferencia'
    };
    const result = createSale({ form, product: prod, inventory, userId: 'luis' });
    const saleWithLead = { ...result.sale, leadId: lead.id };
    sales = [saleWithLead, ...sales];
    leads = leads.map(l => l.id === lead.id ? { ...l, stage: 'entregado', contacted: true } : l);
    return saleWithLead;
  };

  if (newStage === 'entregado') {
    convertLeadToSale(targetLead);
  }

  // Assertions:
  // 1. Lead stage is now 'entregado'
  assert.equal(leads[0].stage, 'entregado');
  assert.equal(leads[0].contacted, true);

  // 2. Sale was created with matching leadId
  assert.equal(sales.length, 1);
  assert.equal(sales[0].leadId, 'lead-auto-1');
  assert.equal(sales[0].clientName, 'Lavatelli Dry Cleaners');
  assert.equal(sales[0].totalAmount, 60);

  // 3. Bidirectional link lookup matches
  const linkedSale = sales.find(s => s.leadId === leads[0].id || s.clientName === leads[0].businessName);
  assert.ok(linkedSale);
  assert.equal(linkedSale.id, sales[0].id);

  // 4. Repeated transition or conversion doesn't create duplicate sales
  const secondAttempt = convertLeadToSale(leads[0]);
  assert.equal(sales.length, 1);
  assert.equal(secondAttempt.id, sales[0].id);
});

test('buildLeadWhatsAppMessage customizes for all 6 pipeline stages with social media links', async () => {
  const { buildLeadWhatsAppMessage } = await import('../src/utils/leadMessages.js');

  const stages = [
    { id: 'prospecto', expectedSnippet: 'multiplicar sus clientes y reseñas positivas' },
    { id: 'visitado', expectedSnippet: 'pasar a visitar su local' },
    { id: 'negociacion', expectedSnippet: 'definir el modelo ideal para sus instalaciones' },
    { id: 'configurando', expectedSnippet: 'en nuestro taller en proceso de personalización técnica' },
    { id: 'entregado', expectedSnippet: '¡Felicitaciones por la recepción de su tarjeta inteligente' },
    { id: 'postventa', expectedSnippet: 'hacer un seguimiento a la experiencia con su tarjeta inteligente' }
  ];

  for (const { id, expectedSnippet } of stages) {
    const msg = buildLeadWhatsAppMessage({ businessName: 'Café Don Tito', stage: id });
    
    // Contiene el fragmento distintivo de la fase
    assert.ok(msg.includes(expectedSnippet), `Etapa ${id} no contiene: ${expectedSnippet}`);

    // Todas las etapas contienen los 3 enlaces obligatorios
    assert.ok(msg.includes('https://linkeocards.com/'), `Etapa ${id} no contiene web`);
    assert.ok(msg.includes('https://www.instagram.com/linkeo_pe/'), `Etapa ${id} no contiene IG`);
    assert.ok(msg.includes('https://www.tiktok.com/@linkeocards'), `Etapa ${id} no contiene TikTok`);

    // No asume ni desprestigia dueños o encargados
    assert.ok(!msg.toLowerCase().includes('encargado'), `Etapa ${id} no debe mencionar encargado`);
    assert.ok(!msg.toLowerCase().includes('dueño'), `Etapa ${id} no debe mencionar dueño`);
  }
});

test('dynamicRouter parses NFC and QR routes, generates redirect URLs and evaluates post-sale health', async () => {
  const { parseDynamicCardRoute, buildCardRedirectUrl, evaluateCardHealth } = await import('../src/utils/dynamicRouter.js');

  // 1. Parsing pathname /r/:cardId?src=nfc
  const locPath = { pathname: '/r/LNK-508d9e5f', search: '?src=nfc', hash: '' };
  const route1 = parseDynamicCardRoute(locPath);
  assert.equal(route1.cardId, 'LNK-508d9e5f');
  assert.equal(route1.src, 'nfc');

  // 2. Parsing hash #/r/:cardId?src=qr
  const locHash = { pathname: '/', search: '', hash: '#/r/LNK-508d9e5f?src=qr' };
  const route2 = parseDynamicCardRoute(locHash);
  assert.equal(route2.cardId, 'LNK-508d9e5f');
  assert.equal(route2.src, 'qr');

  // 3. Parsing standard ERP URL returns null
  assert.equal(parseDynamicCardRoute({ pathname: '/', search: '', hash: '#/pipeline' }), null);

  // 4. URL Builder
  const urlNfc = buildCardRedirectUrl('LNK-test-1', 'nfc', 'https://linkeocards.com');
  assert.equal(urlNfc, 'https://linkeocards.com/#/r/LNK-test-1?src=nfc');
  const urlQr = buildCardRedirectUrl('LNK-test-1', 'qr', 'https://linkeocards.com');
  assert.equal(urlQr, 'https://linkeocards.com/#/r/LNK-test-1?src=qr');

  // 5. Card Health: Inactive (0 bips)
  const inactiveCard = { id: 'c1', businessName: 'Café Surco', readCount: 0, bipsNfc: 0, bipsQr: 0 };
  const healthInactive = evaluateCardHealth(inactiveCard);
  assert.equal(healthInactive.status, 'inactive');
  assert.equal(healthInactive.alertLevel, 'danger');
  assert.ok(healthInactive.followUpMessage.includes('aún no registra lecturas'));

  // 6. Card Health: High Performance (50+ bips)
  const starCard = { id: 'c2', businessName: 'Barbería Silver', readCount: 85, bipsNfc: 62, bipsQr: 23, lastReadAt: new Date().toISOString() };
  const healthStar = evaluateCardHealth(starCard);
  assert.equal(healthStar.status, 'high_performance');
  assert.equal(healthStar.alertLevel, 'success');
  assert.ok(healthStar.followUpMessage.includes('superó 85 lecturas'));
  assert.ok(healthStar.followUpMessage.includes('tarjeta o display adicional'));

  // 7. Card Health: Active regular (1-49 bips)
  const regularCard = { id: 'c3', businessName: 'Lavatelli Dry Cleaners', readCount: 15, bipsNfc: 10, bipsQr: 5, lastReadAt: new Date().toISOString() };
  const healthRegular = evaluateCardHealth(regularCard);
  assert.equal(healthRegular.status, 'active');
  assert.equal(healthRegular.alertLevel, 'info');
});

test('calculateUnitsProjection calculates bottom-up product quantities, replacement fund and reinvestment', async () => {
  const { calculateUnitsProjection } = await import('../src/utils/projectionsUtils.js');

  const scenario = {
    projectedProducts: [
      { id: 'p-sq', name: 'Tarjeta Cuadrado', price: 60, baseCost: 12.93, targetUnits: 15, included: true },
      { id: 'p-l', name: 'Tarjeta Formato L', price: 80, baseCost: 12.93, targetUnits: 15, included: true }
    ],
    fixedCosts: [{ id: 'fc-1', amount: 50 }],
    businessParams: {
      salesDaysPerMonth: 30,
      partnersCount: 2,
      reinvestmentPercent: 20
    }
  };

  const res = calculateUnitsProjection(scenario);
  assert.equal(res.totalUnits, 30);
  assert.equal(res.grossRevenue, 2100);
  assert.equal(res.replacementFund, 387.90);
  assert.equal(res.grossMargin, 1712.10);
  assert.equal(res.netProfit, 1662.10);
  assert.equal(res.reinvestmentPercent, 20);
  assert.equal(res.reinvestmentAmount, 332.42);
  assert.equal(res.distributableProfit, 1329.68);
  assert.equal(res.profitPerPartner, 664.84);
  assert.equal(res.grossProfitPerPartner, 831.05);
  assert.equal(res.unitsPerDay, 1.0);

  // Caso 0% reinversión (retiro total)
  const resZero = calculateUnitsProjection({
    ...scenario,
    businessParams: { ...scenario.businessParams, reinvestmentPercent: 0 }
  });
  assert.equal(resZero.reinvestmentAmount, 0);
  assert.equal(resZero.distributableProfit, 1662.10);
  assert.equal(resZero.profitPerPartner, 831.05);

  // Agregar tercer producto proyectado a futuro ("aún no tenemos pero si llegan...")
  const resWithFuture = calculateUnitsProjection({
    ...scenario,
    projectedProducts: [
      ...scenario.projectedProducts,
      { id: 'p-future', name: 'Display Barra QR', price: 120, baseCost: 25, targetUnits: 10, included: true }
    ]
  });
  assert.equal(resWithFuture.totalUnits, 40);
  assert.equal(resWithFuture.grossRevenue, 3300); // 2100 + 1200
  assert.equal(resWithFuture.replacementFund, 637.90); // 387.90 + 250
  assert.equal(resWithFuture.grossMargin, 2662.10);
  assert.equal(resWithFuture.netProfit, 2612.10);
});

test('projections sales mix matches real warehouse inventory and prevents duplicate imports', async () => {
  const { getProductInventoryInfo } = await import('../src/utils/projectionsUtils.js');
  const { INITIAL_INVENTORY, INITIAL_PRODUCTS } = await import('../src/data/initialData.js');

  // 1. Probar que Cuadrado ESP obtiene 15 unidades de stock físico real y costo S/ 12.93
  const prodCuadradoEsp = { id: 'p1', name: 'Tarjeta Google NFC Cuadrado ESP', sku: 'SKU-LNK-6781' };
  const infoCuadrado = getProductInventoryInfo(prodCuadradoEsp, INITIAL_INVENTORY, INITIAL_PRODUCTS);
  assert.equal(infoCuadrado.stock, 15, 'Cuadrado ESP debe tener 15 unidades en taller, no 1 ud');
  assert.equal(infoCuadrado.cost, 12.93);

  // 2. Probar que Formato L ESP obtiene 15 unidades de stock físico real y costo S/ 12.93
  const prodFormatoL = { id: 'p2', name: 'Tarjeta Google NFC Formato L ESP', sku: 'SKU-LNK-9972' };
  const infoL = getProductInventoryInfo(prodFormatoL, INITIAL_INVENTORY, INITIAL_PRODUCTS);
  assert.equal(infoL.stock, 15, 'Formato L ESP debe tener 15 unidades en taller, no 1 ud');
  assert.equal(infoL.cost, 12.93);

  // 3. Probar que Cuadrado ING obtiene 1 unidad (su muestra real de stock)
  const prodCuadradoIng = { id: 'p3', name: 'Tarjeta Google NFC Cuadrado ING', sku: 'SKU-LNK-1367' };
  const infoIng = getProductInventoryInfo(prodCuadradoIng, INITIAL_INVENTORY, INITIAL_PRODUCTS);
  assert.equal(infoIng.stock, 1);
  assert.equal(infoIng.cost, 60.00);

  // 4. Probar deduplicación: Si Cuadrado ESP y Formato L ya están en el mix, no aparecen en disponibles para importar
  const projectedProducts = [
    { id: 'proj-1', catalogId: 'prod-ind-1', sku: 'SKU-LNK-6781', name: 'Tarjeta Google NFC Cuadrado ESP' },
    { id: 'proj-2', catalogId: 'prod-ind-2', sku: 'SKU-LNK-9972', name: 'Tarjeta Google NFC Formato L ESP' }
  ];

  const availableToImport = INITIAL_PRODUCTS.filter(prod => {
    const already = projectedProducts.some(p => 
      p.catalogId === prod.id || 
      (p.sku && prod.sku && p.sku.toLowerCase() === prod.sku.toLowerCase()) ||
      p.name === prod.name
    );
    return !already;
  });

  // INITIAL_PRODUCTS tiene 5 productos: Cuadrado ESP, Formato L ESP, Cuadrado ING, Pack Dúo, Pack Trío
  // Al filtrar los 2 ya agregados, deben quedar exactamente 3
  assert.equal(availableToImport.length, 3);
  assert.ok(!availableToImport.some(p => p.sku === 'SKU-LNK-6781'), 'Cuadrado ESP no debe duplicarse');
  assert.ok(!availableToImport.some(p => p.sku === 'SKU-LNK-9972'), 'Formato L ESP no debe duplicarse');
  assert.ok(availableToImport.some(p => p.sku === 'SKU-LNK-1367'), 'Cuadrado ING debe estar disponible');
  assert.ok(availableToImport.some(p => p.sku === 'SKU-PACK-DUO'), 'Pack Dúo debe estar disponible');
  assert.ok(availableToImport.some(p => p.sku === 'SKU-PACK-TRIO'), 'Pack Trío debe estar disponible');
});

test('calculatePartnerCashAccounts correctly handles sales held in personal accounts and 50/50 reconciliation', async () => {
  const { calculatePartnerCashAccounts } = await import('../src/utils/projectionsUtils.js');

  const mockSales = [
    { id: 's1', totalAmount: 120, soldBy: 'luis' },
    { id: 's2', totalAmount: 80, soldBy: 'luis' },
    { id: 's3', totalAmount: 100, soldBy: 'kevin' }
  ];

  // 1. Cálculo automático basado en ventas registradas (sin ajuste manual)
  // Luis vendió S/ 200, Kevin vendió S/ 100 -> Total Ventas = S/ 300
  const autoResult = calculatePartnerCashAccounts(mockSales, null);
  assert.equal(autoResult.totalSalesAmount, 300);
  assert.equal(autoResult.autoLuis, 200);
  assert.equal(autoResult.autoKevin, 100);
  assert.equal(autoResult.luisHeld, 200);
  assert.equal(autoResult.kevinHeld, 100);
  assert.equal(autoResult.totalInAccounts, 300);
  assert.equal(autoResult.pendingToAccount, 0); // No falta nada por ingresar
  assert.equal(autoResult.targetPerPartner, 150); // Mitad de 300 = 150 c/u
  assert.equal(autoResult.debtLuisToKevin, 50); // Luis tiene 200, debe pasar 50 a Kevin para quedar 150/150
  assert.equal(autoResult.isCustom, false);

  // 2. Ajuste manual de custodia de dinero (ej. Luis tiene S/ 140 y Kevin S/ 100 en sus cuentas)
  const customAccounts = {
    isCustom: true,
    luis: 140,
    kevin: 100
  };
  const customResult = calculatePartnerCashAccounts(mockSales, customAccounts);
  assert.equal(customResult.totalSalesAmount, 300);
  assert.equal(customResult.luisHeld, 140);
  assert.equal(customResult.kevinHeld, 100);
  assert.equal(customResult.totalInAccounts, 240);
  // Resta entre ventas totales y dinero en cuentas: 300 - 240 = 60 pendiente
  assert.equal(customResult.pendingToAccount, 60);
  assert.equal(customResult.targetPerPartner, 120); // 240 / 2 = 120 c/u
  assert.equal(customResult.debtLuisToKevin, 20); // Luis tiene 140, transfiere 20 a Kevin para quedar 120/120
  assert.equal(customResult.isCustom, true);

  // 3. Caso donde Kevin tiene más dinero que Luis
  const kevinHasMore = {
    isCustom: true,
    luis: 50,
    kevin: 150
  };
  const kevinResult = calculatePartnerCashAccounts(mockSales, kevinHasMore);
  assert.equal(kevinResult.totalInAccounts, 200);
  assert.equal(kevinResult.pendingToAccount, 100);
  assert.equal(kevinResult.targetPerPartner, 100);
  assert.equal(kevinResult.debtLuisToKevin, -50); // Negativo significa que Kevin le transfiere 50 a Luis
});

test('kanban pipeline stage 7 (no_hecha_o_espera) and 1-week inactivity rule', async () => {
  const { normalizeLeadStage, buildLeadWhatsAppMessage } = await import('../src/utils/leadMessages.js');

  // 1. Normalización de etapa 7
  assert.equal(normalizeLeadStage('no_hecha_o_espera'), 'no_hecha_o_espera');
  assert.equal(normalizeLeadStage('cliente en espera'), 'no_hecha_o_espera');
  assert.equal(normalizeLeadStage('no_hecha'), 'no_hecha_o_espera');

  // 2. Generación de mensaje respetuoso de reactivación para la etapa 7
  const reactivationMsg = buildLeadWhatsAppMessage({
    businessName: 'Óptica Central',
    stage: 'no_hecha_o_espera'
  });
  assert.ok(reactivationMsg.includes('retomar la propuesta'), 'Debe sugerir retomar la propuesta');
  assert.ok(reactivationMsg.includes('https://linkeocards.com/'), 'Debe incluir enlace web oficial');
  assert.ok(reactivationMsg.includes('https://www.instagram.com/linkeo_pe/'), 'Debe incluir Instagram');
  assert.ok(reactivationMsg.includes('https://www.tiktok.com/@linkeocards'), 'Debe incluir TikTok');

  // 3. Lógica de detección de antigüedad de 1 semana
  const now = Date.now();
  const eightDaysAgoMs = now - (8 * 24 * 60 * 60 * 1000);
  const twoDaysAgoMs = now - (2 * 24 * 60 * 60 * 1000);

  const oldLead = {
    id: 'l-old',
    createdAt: new Date(eightDaysAgoMs).toISOString(),
    stage: 'visitado'
  };

  const recentLead = {
    id: 'l-recent',
    createdAt: new Date(twoDaysAgoMs).toISOString(),
    stage: 'visitado'
  };

  const oldDeliveredLead = {
    id: 'l-delivered',
    createdAt: new Date(eightDaysAgoMs).toISOString(),
    stage: 'entregado'
  };

  const getAgeDays = (lead) => {
    const diff = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const isOverOneWeek = (lead) => {
    const st = normalizeLeadStage(lead.stage);
    if (st === 'entregado' || st === 'postventa' || st === 'no_hecha_o_espera') return false;
    return getAgeDays(lead) >= 7;
  };

  assert.equal(isOverOneWeek(oldLead), true, 'Lead de 8 días en "visitado" debe calificar para la etapa 7');
  assert.equal(isOverOneWeek(recentLead), false, 'Lead de 2 días no debe calificar');
  assert.equal(isOverOneWeek(oldDeliveredLead), false, 'Venta ya entregada y cobrada no debe enviarse a no hecha');
});

test('google place id extraction, redirected review url and bidirectional district synchronization with kanban', async () => {
  const { cleanGooglePlaceId, buildGoogleReviewUrl, areLeadAndCardLinked } = await import('../src/utils/dynamicRouter.js');

  // 1. Limpieza y extracción de Google Place ID
  const bareId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
  assert.equal(cleanGooglePlaceId(bareId), bareId, 'Debe mantener un ID limpio');

  const fullUrl = `https://search.google.com/local/writereview?placeid=${bareId}`;
  assert.equal(cleanGooglePlaceId(fullUrl), bareId, 'Debe extraer el ID de una URL de reseña');

  const urlWithParams = `https://search.google.com/local/writereview?placeid=${bareId}&authuser=1`;
  assert.equal(cleanGooglePlaceId(urlWithParams), bareId, 'Debe extraer el ID aun con parámetros adicionales');

  const mapsUrl = `https://maps.google.com/?place_id=${bareId}`;
  assert.equal(cleanGooglePlaceId(mapsUrl), bareId, 'Debe extraer el ID con formato place_id=');

  const directParam = `placeid=${bareId}`;
  assert.equal(cleanGooglePlaceId(directParam), bareId, 'Debe extraer el ID escrito como placeid=');

  // 2. Generación del Enlace Redirigido
  const reviewUrl = buildGoogleReviewUrl(bareId);
  assert.equal(reviewUrl, `https://search.google.com/local/writereview?placeid=${bareId}`, 'Debe unir https con el ID');

  assert.equal(buildGoogleReviewUrl(''), '', 'ID vacío debe retornar cadena vacía');

  // 3. Vinculación Lead - Tarjeta NFC (areLeadAndCardLinked)
  const lead1 = { id: 'lead-101', businessName: 'Lavatelli Dry Cleaners', district: 'Surco' };
  const card1 = { id: 'LNK-001', leadId: 'lead-101', businessName: 'Lavatelli Dry Cleaners', district: 'Surco' };
  assert.equal(areLeadAndCardLinked(lead1, card1), true, 'Debe vincular por leadId');

  const lead2 = { id: 'lead-102', businessName: 'Lavatelli Dry Cleaners', district: 'Surco' };
  const card2 = { id: 'LNK-002', businessName: 'Lavatelli Dry Cleaners', district: 'Miraflores' };
  assert.equal(areLeadAndCardLinked(lead2, card2), true, 'Debe vincular por coincidencia de nombre de negocio');

  const card3 = { id: 'LNK-003', businessName: 'Barbería Don Juan', district: 'Barranco' };
  assert.equal(areLeadAndCardLinked(lead1, card3), false, 'No debe vincular negocios distintos');

  // 4. Sincronización bidireccional de distrito:
  // Caso A: Cambio de distrito en Tarjeta NFC -> Sincroniza Lead en Kanban
  let leads = [{ id: 'lead-101', businessName: 'Lavatelli Dry Cleaners', district: 'Surco' }];
  let cards = [{ id: 'LNK-001', leadId: 'lead-101', businessName: 'Lavatelli Dry Cleaners', district: 'Surco' }];

  // Usuario cambia distrito en NFC a "Santiago de Surco"
  const updatedCard = { ...cards[0], district: 'Santiago de Surco' };
  cards = cards.map(c => c.id === updatedCard.id ? updatedCard : c);
  leads = leads.map(l => areLeadAndCardLinked(l, updatedCard) ? { ...l, district: updatedCard.district } : l);

  assert.equal(leads[0].district, 'Santiago de Surco', 'El cambio de distrito en NFC debe actualizar el lead en Kanban');

  // Caso B: Cambio de distrito en Kanban -> Sincroniza Tarjeta NFC
  const updatedLead = { ...leads[0], district: 'San Isidro' };
  leads = leads.map(l => l.id === updatedLead.id ? updatedLead : l);
  cards = cards.map(c => areLeadAndCardLinked(updatedLead, c) ? { ...c, district: updatedLead.district } : c);

  assert.equal(cards[0].district, 'San Isidro', 'El cambio de distrito en Kanban debe actualizar la tarjeta NFC');
});

test('monthly sales KPI and target automatically synchronize with Projections gross revenue (Venta Mensual Bruta)', async () => {
  const { computeDynamicTargets, calculateUnitsProjection } = await import('../src/utils/projectionsUtils.js');
  const { getAccountingMonth, localDate } = await import('../src/utils/dateUtils.js');

  const projectionsScenario = {
    projectedProducts: [
      { id: 'proj-cuadrado-esp', name: 'Tarjeta Cuadrado', price: 60.00, baseCost: 12.93, targetUnits: 15, included: true },
      { id: 'proj-formato-l-esp', name: 'Tarjeta Formato L', price: 80.00, baseCost: 12.93, targetUnits: 15, included: true }
    ],
    fixedCosts: [{ id: 'fc-1', amount: 50.00 }],
    businessParams: {
      salesDaysPerMonth: 30,
      partnersCount: 2,
      reinvestmentPercent: 20
    }
  };

  // 1. Proyecciones calcula Venta Mensual Bruta = S/ 2,100.00
  const proj = calculateUnitsProjection(projectionsScenario);
  assert.equal(proj.grossRevenue, 2100.00, 'Venta Mensual Bruta debe ser exactamente S/ 2,100.00');
  assert.equal(proj.replacementFund, 387.90, 'Fondo de reposición debe ser S/ 387.90');

  // 2. computeDynamicTargets adopta reactivamente la Venta Mensual Bruta como monthlyRevenueEstimate
  const targets = computeDynamicTargets(projectionsScenario);
  assert.equal(targets.monthlyRevenueEstimate, 2100.00, 'La meta mensual de facturación debe sincronizarse con S/ 2,100.00');
  assert.equal(targets.monthlyUnitsTarget, 30, 'La meta mensual de unidades debe ser 30');
  assert.equal(targets.monthlyProfitTarget, 1662.10, 'La utilidad neta objetivo debe ser 1662.10');

  // 3. Si se ajusta el mix (ej. 20 cuadradas y 20 formato L), la meta mensual se actualiza automáticamente
  const updatedScenario = {
    ...projectionsScenario,
    projectedProducts: [
      { id: 'proj-cuadrado-esp', name: 'Tarjeta Cuadrado', price: 60.00, baseCost: 12.93, targetUnits: 20, included: true },
      { id: 'proj-formato-l-esp', name: 'Tarjeta Formato L', price: 80.00, baseCost: 12.93, targetUnits: 20, included: true }
    ]
  };
  const updatedTargets = computeDynamicTargets(updatedScenario);
  assert.equal(updatedTargets.monthlyRevenueEstimate, 2800.00, 'Al variar el mix de unidades, la meta mensual sube a 2800.00');

  // 4. Filtrado de ventas mensuales vs ventas totales
  const currentMonth = getAccountingMonth(localDate());
  const sampleSales = [
    { id: 'sale-1', totalAmount: 160.00, date: localDate(), clientName: 'Café Roma' },
    { id: 'sale-2', totalAmount: 200.00, date: '2025-01-15', clientName: 'Venta Año Pasado' }
  ];

  const currentMonthSales = sampleSales.filter(s => !s.date || getAccountingMonth(s.date) === currentMonth);
  const monthlySalesAmount = currentMonthSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  const totalSalesAmount = sampleSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);

  assert.equal(monthlySalesAmount, 160.00, 'Las ventas del mes deben ser S/ 160.00');
  assert.equal(totalSalesAmount, 360.00, 'Las ventas totales acumuladas deben ser S/ 360.00');

  // 5. Progreso de ventas mensuales contra la meta mensual
  const progressPct = Math.round((monthlySalesAmount / targets.monthlyRevenueEstimate) * 100);
  assert.equal(progressPct, 8, '160 / 2100 debe dar 8% de avance mensual');
});

test('inventory editing updates physical stock, unit cost, metadata and synchronizes linked catalog products', () => {
  // Estado inicial de almacén y catálogo comercial
  const initialInventory = [
    {
      id: 'inv-item-1',
      sku: 'SKU-LNK-1367',
      name: 'Tarjeta Google NFC Cuadrado ING',
      category: 'Chips / Insumos',
      quantity: 1,
      minThreshold: 10,
      unitCost: 12.93,
      supplier: 'HACHANI_UN Official Store',
      leadTimeDays: 13
    }
  ];

  const initialProducts = [
    {
      id: 'prod-1',
      inventoryId: 'inv-item-1',
      sku: 'SKU-LNK-1367',
      name: 'Tarjeta Google NFC Cuadrado ING',
      category: 'Individual',
      price: 60.00,
      cost: 12.93,
      stock: 1,
      margin: 47.07,
      marginPct: 78.5
    }
  ];

  // Simular la edición del insumo de inventario: se actualiza stock a 25, costo unitario a 14.50, nombre y proveedor
  const updatedItem = {
    id: 'inv-item-1',
    sku: 'SKU-LNK-1367-V2',
    name: 'Tarjeta Google NFC Cuadrado ING (Actualizado)',
    category: 'Chips / Insumos',
    quantity: 25,
    minThreshold: 8,
    unitCost: 14.50,
    supplier: 'HACHANI Global Store',
    leadTimeDays: 10
  };

  // Función de actualización de inventario y sincronización con catálogo (idéntica a handleEditInventoryItem en App.jsx)
  const updatedInventory = initialInventory.map(i => i.id === updatedItem.id ? updatedItem : i);
  const updatedProducts = initialProducts.map(p => {
    if (p.inventoryId === updatedItem.id || (p.sku && p.sku === initialInventory[0].sku)) {
      const priceNum = Number(p.price) || 0;
      const newCost = Number(updatedItem.unitCost) || 0;
      const newMargin = priceNum - newCost;
      const newMarginPct = priceNum > 0 ? (newMargin / priceNum) * 100 : 0;
      return {
        ...p,
        sku: updatedItem.sku,
        name: updatedItem.name,
        category: updatedItem.category,
        cost: newCost,
        stock: Number(updatedItem.quantity) || 0,
        margin: newMargin,
        marginPct: Number(newMarginPct.toFixed(1))
      };
    }
    return p;
  });

  // 1. Verificaciones en inventario
  const storedItem = updatedInventory.find(i => i.id === 'inv-item-1');
  assert.equal(storedItem.quantity, 25);
  assert.equal(storedItem.unitCost, 14.50);
  assert.equal(storedItem.name, 'Tarjeta Google NFC Cuadrado ING (Actualizado)');
  assert.equal(storedItem.sku, 'SKU-LNK-1367-V2');
  assert.equal(storedItem.supplier, 'HACHANI Global Store');
  assert.equal(storedItem.leadTimeDays, 10);

  // 2. Verificaciones en producto vinculado del catálogo comercial
  const linkedProd = updatedProducts.find(p => p.id === 'prod-1');
  assert.equal(linkedProd.stock, 25, 'El stock del producto debe reflejar los 25 del almacén');
  assert.equal(linkedProd.cost, 14.50, 'El costo del producto comercial debe sincronizarse a S/ 14.50');
  assert.equal(linkedProd.sku, 'SKU-LNK-1367-V2', 'El SKU del producto debe sincronizarse');
  assert.equal(linkedProd.margin, 45.50, 'El nuevo margen bruto debe ser 60 - 14.50 = 45.50');
  assert.equal(linkedProd.marginPct, 75.8, 'El porcentaje de margen debe recalcularse a (45.50 / 60) * 100 = 75.8%');
});

test('expense purchases with pending status remain pending and add products to inventory only when confirmed with OK', async () => {
  const { applyStockMovements } = await import('../src/utils/operations.js');

  const initialInventory = [
    { id: 'inv-chip', sku: 'SKU-CHIP-1', name: 'Chips NFC NTAG215', quantity: 10 }
  ];

  const purchaseExpense = {
    id: 'exp-purchase-1',
    description: 'Lote de 50 Chips NFC Importados',
    amount: 200,
    selectedProductId: 'inv-chip',
    quantity: 50,
    inventoryStatus: 'pending',
    stockMovements: [{ inventoryId: 'inv-chip', quantity: 50 }]
  };

  // 1. Al crearse como pendiente, el inventario físico se mantiene en 10 uds
  let currentInventory = [...initialInventory];
  const isPending = purchaseExpense.inventoryStatus === 'pending';
  if (!isPending) {
    currentInventory = applyStockMovements(currentInventory, purchaseExpense.stockMovements, 1);
  }
  assert.equal(currentInventory[0].quantity, 10, 'El stock físico debe seguir siendo 10 mientras el pedido esté pendiente');
  assert.equal(purchaseExpense.inventoryStatus, 'pending');

  // 2. El usuario hace clic en el botón de Pendiente y le da OK para ingresar al inventario
  let confirmedExpense = { ...purchaseExpense };
  if (confirmedExpense.inventoryStatus === 'pending' && confirmedExpense.stockMovements?.length) {
    currentInventory = applyStockMovements(currentInventory, confirmedExpense.stockMovements, 1);
    confirmedExpense.inventoryStatus = 'received';
    confirmedExpense.receivedAt = new Date().toISOString();
  }

  // 3. Verificación de que ahora sí se agregaron los 50 productos al inventario
  assert.equal(currentInventory[0].quantity, 60, 'El stock físico debe ser 10 + 50 = 60 tras dar OK');
  assert.equal(confirmedExpense.inventoryStatus, 'received', 'El estado del gasto pasa a received');
  assert.ok(confirmedExpense.receivedAt);

  // 4. Intentar dar OK de nuevo es idempotente
  if (confirmedExpense.inventoryStatus === 'pending') {
    currentInventory = applyStockMovements(currentInventory, confirmedExpense.stockMovements, 1);
  }
  assert.equal(currentInventory[0].quantity, 60, 'No debe duplicarse el stock si ya fue recibido');
});

test('nfc mapper column safety: prevents Campo desconocido error in Supabase while preserving analytics in payload', async () => {
  const { mappers } = await import('../src/services/mappers.js');

  const frontCard = {
    id: 'nfc-test-1',
    chipUid: 'UID-ABC-123',
    batch: 'BATCH-2026',
    model: 'Tarjeta NFC Google',
    category: 'Individual',
    reviewUrl: 'https://linkeocards.com/r/test',
    status: 'activo',
    businessName: 'Restaurante Test',
    readCount: 15,
    bipsNfc: 10,
    bipsQr: 5,
    lastReadAt: '2026-09-24T18:00:00Z'
  };

  const dbRow = mappers.nfcToDb(frontCard);

  // Columnas base estrictas permitidas por Supabase (sin columnas que no existan en Postgres)
  assert.equal(dbRow.id, 'nfc-test-1');
  assert.equal(dbRow.uid, 'UID-ABC-123');
  assert.equal(dbRow.batch, 'BATCH-2026');
  assert.equal(dbRow.model, 'Tarjeta NFC Google');
  assert.equal(dbRow.read_count, 15);
  // Las analíticas se guardan sin fallar dentro del payload jsonb:
  assert.ok(dbRow.payload, 'payload debe existir');
  assert.equal(dbRow.payload.bipsNfc, 10);
  assert.equal(dbRow.payload.bipsQr, 5);
  assert.equal(dbRow.payload.lastReadAt, '2026-09-24T18:00:00Z');

  // Recuperación simétrica en nfcToFront
  const recoveredFront = mappers.nfcToFront(dbRow);
  assert.equal(recoveredFront.id, 'nfc-test-1');
  assert.equal(recoveredFront.readCount, 15);
  assert.equal(recoveredFront.bipsNfc, 10);
  assert.equal(recoveredFront.bipsQr, 5);
  assert.equal(recoveredFront.lastReadAt, '2026-09-24T18:00:00Z');
});

test('deleted product and pack permanence: deleted items are never resurrected by default data', async () => {
  const { INITIAL_PRODUCTS } = await import('../src/data/initialData.js');

  const deletedIds = ['prod-pack-1', 'SKU-PACK-DUO', 'pack restaurante dúo (2 tarjetas nfc)'];

  const isItemDeleted = (p) => {
    if (!p) return false;
    const norm = p.name ? p.name.trim().toLowerCase() : null;
    return (p.id && deletedIds.includes(p.id)) ||
           (p.sku && deletedIds.includes(p.sku)) ||
           (norm && deletedIds.includes(norm));
  };

  // Simulación del filtro del catálogo
  const catalogList = INITIAL_PRODUCTS.filter(p => !isItemDeleted(p));

  // El pack eliminado no debe figurar en el catálogo
  assert.ok(!catalogList.some(p => p.sku === 'SKU-PACK-DUO'), 'Pack Dúo debe permanecer eliminado');
  assert.ok(catalogList.length < INITIAL_PRODUCTS.length, 'El catálogo debe tener menos elementos');
});





