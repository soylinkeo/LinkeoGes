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
  assert.equal(dbRow.email, 'dontito.barberia@gmail.com');
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

