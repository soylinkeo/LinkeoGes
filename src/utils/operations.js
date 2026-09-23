import { localDate } from './dateUtils.js';

export function getStockMovements(product, quantity, inventory) {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('La cantidad debe ser un entero mayor que cero.');
  const components = product.bundleItems?.length ? product.bundleItems : [{ ...product, quantity: 1 }];
  const totals = new Map();
  for (const component of components) {
    const item = inventory.find(row => row.id === component.inventoryId || row.id === component.id || (row.sku && row.sku === component.sku));
    if (!item) throw new Error(`Vincula ${component.name || product.name} a un insumo del almacén antes de vender.`);
    const count = Number(component.quantity ?? 1) * quantity;
    if (!Number.isInteger(count) || count <= 0) throw new Error('La cantidad del componente no es válida.');
    totals.set(item.id, (totals.get(item.id) || 0) + count);
  }
  const movements = [...totals].map(([inventoryId, quantity]) => ({ inventoryId, quantity }));
  applyStockMovements(inventory, movements, -1);
  return movements;
}

export function applyStockMovements(inventory, movements, direction) {
  for (const movement of movements) if (!inventory.some(row => row.id === movement.inventoryId)) throw new Error('El insumo vinculado ya no existe.');
  return inventory.map(row => {
    const delta = movements.filter(m => m.inventoryId === row.id).reduce((sum, m) => sum + m.quantity * direction, 0);
    const quantity = Number(row.quantity) + delta;
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error(`Stock insuficiente: ${row.name}.`);
    return delta ? { ...row, quantity } : row;
  });
}

export function createSale({ form, product, inventory, userId }) {
  if (!product) throw new Error('Selecciona un producto del catálogo.');
  const quantity = Number(form.quantity);
  const unitPrice = Number(form.isCustomPricing ? form.customUnitPrice || product.price : product.price);
  const unitCost = Number(form.isCustomPricing ? form.customUnitCost || product.cost : product.cost);
  if (![unitPrice, unitCost].every(value => Number.isFinite(value) && value >= 0)) throw new Error('Precio o costo no válido.');
  const stockMovements = getStockMovements(product, quantity, inventory);
  const id = `sale-${crypto.randomUUID()}`;
  const date = localDate();
  const cards = Array.from({ length: quantity }, () => ({
    id: `LNK-${crypto.randomUUID()}`, chipUid: '', model: product.name, productId: product.id,
    businessName: form.clientName, contactName: form.contactPerson, contactPhone: form.phone,
    district: form.district, placeId: form.googlePlaceId?.trim() || '',
    reviewUrl: form.googlePlaceId?.trim() ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(form.googlePlaceId.trim())}` : '',
    status: 'Pendiente de grabación', assignedDate: date, saleId: id, history: [],
  }));
  const cost = Math.round(unitCost * quantity * 100) / 100;
  const totalAmount = Math.round(unitPrice * quantity * 100) / 100;
  return {
    sale: { id, saleNumber: `VTA-${id.slice(5).toUpperCase()}`, date, clientName: form.clientName,
      contactPerson: form.contactPerson, phone: form.phone, district: form.district,
      productId: product.id, productName: product.name, quantity, unitPrice, cost, totalAmount,
      profit: Math.round((totalAmount - cost) * 100) / 100, paymentMethod: form.paymentMethod,
      soldBy: form.soldBy || userId, status: 'Cobrado / Por entregar', cardIds: cards.map(c => c.id), stockMovements },
    cards, inventory: applyStockMovements(inventory, stockMovements, -1),
  };
}
