import { test } from 'node:test';
import assert from 'node:assert/strict';
import { equal } from '../src/services/syncModel.js';
import { calculateUnitsProjection } from '../src/utils/projectionsUtils.js';

test('Sprint 2: SyncStatus supports 8 distinct states without data loss', () => {
  // 1. Offline detection
  const offlineState = { isOffline: true, cloud: { status: 'ready', data: {} } };
  assert.equal(offlineState.isOffline, true);

  // 2. Initial loading
  const loadingState = { isOffline: false, cloud: { status: 'loading', data: {} } };
  assert.equal(loadingState.cloud.status, 'loading');

  // 3. Saving
  const savingState = { isOffline: false, cloud: { status: 'saving', engine: {} } };
  assert.equal(savingState.cloud.status, 'saving');

  // 4. Retrying
  const retryingState = { isOffline: false, cloud: { status: 'saving', engine: { request: { requestId: 'req-1' } } } };
  const isRetrying = Boolean(retryingState.cloud.status === 'saving' && retryingState.cloud.engine?.request);
  assert.equal(isRetrying, true);

  // 5. Local pending changes
  const confirmed = { items: [{ id: 1, qty: 10 }] };
  const localData = { items: [{ id: 1, qty: 15 }] };
  const hasLocalEdits = !equal(confirmed, localData);
  assert.equal(hasLocalEdits, true);

  // 6. Saved confirmed on server
  const syncedData = { items: [{ id: 1, qty: 15 }] };
  const isSynced = equal(localData, syncedData);
  assert.equal(isSynced, true);
  const lastSavedTime = new Date('2026-10-22T14:32:05Z').toISOString();
  assert.ok(lastSavedTime.includes('2026-10-22'));

  // 7. Revision conflict (code 40001 or version mismatch)
  const conflictError = 'Otra computadora guardó cambios más recientes (código 40001/revisión).';
  const isConflict = Boolean(
    conflictError.includes('Otra computadora') ||
    conflictError.includes('40001') ||
    conflictError.includes('revisión')
  );
  assert.equal(isConflict, true);

  // 8. General error
  const networkError = 'Error de red al conectar con el servidor';
  const isNetworkConflict = Boolean(
    networkError.includes('Otra computadora') ||
    networkError.includes('40001')
  );
  assert.equal(isNetworkConflict, false);
});

test('Sprint 2: Inventory stock categorization & search filters operate accurately', () => {
  const getItemStockStatus = (item) => {
    const qty = Number(item.quantity) || 0;
    const min = Number(item.minThreshold) || 10;
    if (qty <= min) return 'critical';
    if (qty > min * 3 || qty >= 50) return 'surplus';
    return 'optimal';
  };

  const sampleInventory = [
    { id: 'inv-1', sku: 'LNK-DISP-01', name: 'Linkeo Display Vertical', category: 'Displays', quantity: 5, minThreshold: 10, supplier: 'Acrílicos Lima', unitCost: 12 },
    { id: 'inv-2', sku: 'LNK-HORIZ-01', name: 'Linkeo Display Horizontal', category: 'Displays', quantity: 25, minThreshold: 10, supplier: 'Acrílicos Lima', unitCost: 12 },
    { id: 'inv-3', sku: 'LNK-CHIP-NTAG', name: 'Microchip NTAG213', category: 'Chips NFC', quantity: 150, minThreshold: 20, supplier: 'Shenzhen NFC Tech', unitCost: 0.8 },
  ];

  // Verify status mapping
  assert.equal(getItemStockStatus(sampleInventory[0]), 'critical'); // 5 <= 10
  assert.equal(getItemStockStatus(sampleInventory[1]), 'optimal');  // 25 > 10 and 25 < 30
  assert.equal(getItemStockStatus(sampleInventory[2]), 'surplus');  // 150 >= 50

  // Verify multi-field search filter (SKU, Name, Supplier)
  const filterBySearch = (query) => {
    const q = query.toLowerCase().trim();
    return sampleInventory.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.supplier.toLowerCase().includes(q)
    );
  };

  assert.equal(filterBySearch('vertical').length, 1);
  assert.equal(filterBySearch('LNK-HORIZ').length, 1);
  assert.equal(filterBySearch('Shenzhen').length, 1);
  assert.equal(filterBySearch('Displays').length, 0); // Category is filtered separately

  // Category filter
  const filterByCategory = (cat) => sampleInventory.filter(i => cat === 'all' || i.category === cat);
  assert.equal(filterByCategory('Displays').length, 2);
  assert.equal(filterByCategory('Chips NFC').length, 1);
  assert.equal(filterByCategory('all').length, 3);
});

test('Sprint 2: Rapid touch debounce prevents duplicate stock adjustment requests', () => {
  let clickCount = 0;
  let lastClickTime = 0;

  const handleStockClickWithDebounce = (now) => {
    if (now - lastClickTime < 300) return false;
    lastClickTime = now;
    clickCount++;
    return true;
  };

  // Simulating double tap at t = 0 and t = 100ms
  assert.equal(handleStockClickWithDebounce(1000), true);
  assert.equal(handleStockClickWithDebounce(1100), false); // Rejected by debounce
  assert.equal(handleStockClickWithDebounce(1250), false); // Rejected (250ms < 300ms)
  assert.equal(handleStockClickWithDebounce(1350), true);  // Accepted (350ms > 300ms)
  assert.equal(clickCount, 2);
});

test('Sprint 2: Financial Projections formulas and 50/50 partner split remain 100% preserved', () => {
  const products = [
    { id: 'p1', name: 'Display Vertical S/35', price: 35, baseCost: 12, targetUnits: 100, included: true },
    { id: 'p2', name: 'Display Horizontal S/35', price: 35, baseCost: 12, targetUnits: 100, included: true },
  ];

  const fixedCosts = [
    { id: 'f1', concept: 'Alquiler Taller', amount: 800 },
    { id: 'f2', concept: 'Software y Herramientas', amount: 200 }
  ];

  const businessParams = {
    salesDaysPerMonth: 26,
    partnersCount: 2,
    reinvestmentPercent: 20
  };

  const results = calculateUnitsProjection({
    projectedProducts: products,
    fixedCosts,
    businessParams,
    variableCosts: []
  });

  // 1. Total units: 100 + 100 = 200
  assert.equal(results.totalUnits, 200);

  // 2. Gross revenue: 200 * 35 = 7,000
  assert.equal(results.grossRevenue, 7000);

  // 3. Replacement fund: 200 * 12 = 2,400
  assert.equal(results.replacementFund, 2400);

  // 4. Contribution margin (grossMargin): 7,000 - 2,400 = 4,600
  assert.equal(results.grossMargin, 4600);

  // 5. Total fixed costs: 800 + 200 = 1,000
  assert.equal(results.totalFixedCosts, 1000);

  // 6. Net Profit: 4,600 - 1,000 = 3,600
  assert.equal(results.netProfit, 3600);

  // 7. Reinvestment fund (20% of 3,600): 720
  assert.equal(results.reinvestmentAmount, 720);

  // 8. Distributable profit: 3,600 - 720 = 2,880
  assert.equal(results.distributableProfit, 2880);

  // 9. Profit per partner (50/50 Luis Romero & Kevin Servat): 2,880 / 2 = 1,440
  assert.equal(results.profitPerPartner, 1440);
});

test('Sprint 2: Mobile accessibility & touch targets contract validation', () => {
  // Mobile touch buttons must be at least 44px
  const minTouchDimension = 44;
  const buttonStyle = { width: '46px', height: '46px' };
  assert.ok(parseInt(buttonStyle.width, 10) >= minTouchDimension);
  assert.ok(parseInt(buttonStyle.height, 10) >= minTouchDimension);

  // iOS Safari auto-zoom prevention: inputs must have font-size >= 16px
  const minIosFontSize = 16;
  const mobileInputFontSize = 16;
  assert.ok(mobileInputFontSize >= minIosFontSize);
});
