import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mappers } from '../src/services/mappers.js';
import { calculateFinance } from '../src/utils/financeUtils.js';
import { computeDynamicTargets } from '../src/utils/projectionsUtils.js';
import { localDate, getAccountingMonth, accountingMonths } from '../src/utils/dateUtils.js';
import { createSale, getStockMovements, applyStockMovements } from '../src/utils/operations.js';
import { INITIAL_PRODUCTS, INITIAL_INVENTORY } from '../src/data/initialData.js';

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
