import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mappers } from '../src/services/mappers.js';
import { calculateFinance } from '../src/utils/financeUtils.js';
import { computeDynamicTargets } from '../src/utils/projectionsUtils.js';
import { localDate, getAccountingMonth, accountingMonths } from '../src/utils/dateUtils.js';
import { createSale, getStockMovements, applyStockMovements } from '../src/utils/operations.js';

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
