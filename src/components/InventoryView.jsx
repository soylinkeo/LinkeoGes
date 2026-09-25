import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Truck, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Package, 
  Layers, 
  Trash2, 
  Edit, 
  Shuffle, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  Check, 
  X,
  ShoppingBag,
  Sparkles,
  Compass,
  Gift,
  Percent,
  Tag,
  TrendingUp,
  Info,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { generateRandomSku } from '../utils/skuUtils';

// Helper para parsear días de cadenas ("18 días", "3 - 5 días")
const parseSupplierDays = (leadTime) => {
  if (typeof leadTime === 'number' && !isNaN(leadTime)) return leadTime;
  if (!leadTime) return null;
  const str = String(leadTime).trim();
  const rangeMatch = str.match(/(\d+)\s*[-–a]\s*(\d+)/i);
  if (rangeMatch) {
    return Math.round((parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10)) / 2);
  }
  const singleMatch = str.match(/(\d+)/);
  return singleMatch ? parseInt(singleMatch[1], 10) : null;
};

const parseLeadTimeFields = (leadTimeStr) => {
  if (!leadTimeStr) return { min: '3', max: '5' };
  const str = String(leadTimeStr).trim();
  const rangeMatch = str.match(/(\d+)\s*[-–a]\s*(\d+)/i);
  if (rangeMatch) return { min: rangeMatch[1], max: rangeMatch[2] };
  const singleMatch = str.match(/(\d+)/);
  if (singleMatch) return { min: singleMatch[1], max: '' };
  return { min: '3', max: '5' };
};

const parseCostFields = (costStr) => {
  if (!costStr) return { currency: 'S/', value: '8.00' };
  const str = String(costStr).trim();
  const currency = str.includes('$') ? '$' : 'S/';
  const numMatch = str.match(/(\d+(?:\.\d+)?)/);
  return { currency, value: numMatch ? numMatch[1] : '8.00' };
};

const parseMinOrderFields = (minOrderStr) => {
  if (!minOrderStr) return { qty: '20', unit: 'unidades', customUnit: '' };
  const str = String(minOrderStr).trim();
  const numMatch = str.match(/^(\d+)/);
  const qty = numMatch ? numMatch[1] : '20';
  const rest = str.replace(/^\d+/, '').trim().toLowerCase();

  const standardUnits = ['unidades', 'millares', 'paquetes', 'piezas', 'cajas', 'metros', 'lotes'];
  const matchedUnit = standardUnits.find(u => rest.includes(u.slice(0, 4)));

  if (matchedUnit) return { qty, unit: matchedUnit, customUnit: '' };
  if (rest) return { qty, unit: 'otro', customUnit: rest };
  return { qty, unit: 'unidades', customUnit: '' };
};

export default function InventoryView({
  inventory = [],
  products = [],
  suppliers = [],
  expenses = [],
  onReceiveExpenseStock,
  onUpdateInventoryStock,
  onAddNewInventoryItem,
  onEditInventoryItem,
  onAddNewProduct,
  onEditProduct,
  onAddNewSupplier,
  onEditSupplier,
  onOpenNewExpense,
  onRequestDelete,
  initialSubTab = 'catalog',
  showToast
}) {
  // Subpestaña activa: 'catalog' (Catálogo & Packs) | 'stock' (Stock Físico & Insumos) | 'suppliers' (Proveedores)
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  const [showExplanation, setShowExplanation] = useState(() => typeof window !== 'undefined' ? window.innerWidth > 768 : true);

  // Compras de mercadería en estado pendiente de ingreso a almacén
  const pendingExpenses = useMemo(() => {
    return (expenses || []).filter(e => e.inventoryStatus === 'pending');
  }, [expenses]);

  // Filtros del Catálogo
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Modales
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPack, setEditingPack] = useState(null);

  // Helpers de reseteo limpio de formularios
  const handleClosePackModal = () => {
    setPackForm({
      name: '',
      sku: generateRandomSku('LNK-PACK'),
      badge: '🔥 Pack Dúo',
      promoPrice: '',
      bundleComponents: [],
      description: ''
    });
    setEditingPack(null);
    setIsPackModalOpen(false);
  };

  const handleCloseProductModal = () => {
    setNewProductForm({
      inventoryId: '',
      name: '',
      sku: generateRandomSku('LNK-PROD'),
      category: 'Individual',
      type: 'NFC Inteligente',
      price: '',
      cost: 13.00,
      stock: 20,
      badge: 'Nuevo Producto',
      description: ''
    });
    setEditingProduct(null);
    setIsNewProductModalOpen(false);
  };

  const handleCloseItemModal = () => {
    setNewItemForm({
      sku: generateRandomSku('SKU-LNK'),
      name: '',
      category: 'Chips / Insumos',
      quantity: 50,
      minThreshold: 20,
      unitCost: 4.00,
      supplier: '',
      leadTimeDays: 15,
      reorderUrl: '',
      notes: ''
    });
    setEditingItem(null);
    setSelectedSupplierId(null);
    setSupplierFilterQuery('');
    setSupplierComboboxOpen(false);
    setIsNewItemModalOpen(false);
  };

  const handleCloseSupplierModal = () => {
    setSupplierForm({
      name: '',
      itemSupplied: '',
      leadTimeMin: '3',
      leadTimeMax: '5',
      costCurrency: 'S/',
      unitCostValue: '8.00',
      minOrderQty: '20',
      minOrderUnit: 'unidades',
      customMinOrderUnit: '',
      contact: '',
      reliability: '⭐⭐⭐⭐⭐ (Excelente)',
      notes: ''
    });
    setEditingSupplier(null);
    setIsSupplierModalOpen(false);
  };

  const handleStockClick = (item, delta) => {
    if (onUpdateInventoryStock(item.id, delta) === false) return;
    const newQty = Math.max(0, (Number(item.quantity) || 0) + delta);
    if (showToast) {
      showToast(`Stock de "${item.name}": ${newQty} uds (${delta > 0 ? '+1' : '-1'})`, 'info', 1800);
    }
  };

  // -------------------------------------------------------------
  // PROVEEDORES CONSOLIDADOS
  // -------------------------------------------------------------
  const dbSuppliersList = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    suppliers.forEach((s, idx) => {
      if (s && s.name && s.name.trim()) {
        const supId = s.id || `sup-${s.name.trim().toLowerCase()}-${(s.itemSupplied || idx).toString().toLowerCase()}`;
        if (!seenIds.has(supId)) {
          seenIds.add(supId);
          list.push({
            id: supId,
            name: s.name.trim(),
            itemSupplied: s.itemSupplied || s.category || 'Insumos varios',
            leadTime: s.leadTime || (s.leadTimeDays ? `${s.leadTimeDays} días` : 'Entrega estándar'),
            leadTimeDays: s.leadTimeDays || parseSupplierDays(s.leadTime) || 15,
            unitCostAvg: s.unitCostAvg || '',
            reliability: s.reliability || '⭐⭐⭐⭐⭐ (Excelente)',
            contact: s.contact || s.phone || '',
            notes: s.notes || '',
            minOrder: s.minOrder || '',
            isRegistered: true
          });
        }
      }
    });

    const directoryNames = new Set(suppliers.filter(s => s && s.name).map(s => s.name.trim().toLowerCase()));
    const seenInvSuppliers = new Set();

    inventory.forEach(inv => {
      if (inv && inv.supplier && inv.supplier.trim()) {
        const normName = inv.supplier.trim().toLowerCase();
        if (!directoryNames.has(normName) && !seenInvSuppliers.has(normName)) {
          seenInvSuppliers.add(normName);
          list.push({
            id: `inv-sup-${normName}`,
            name: inv.supplier.trim(),
            itemSupplied: inv.category || 'Material de inventario',
            leadTime: inv.leadTimeDays ? `${inv.leadTimeDays} días` : 'Entrega estándar',
            leadTimeDays: inv.leadTimeDays || 15,
            unitCostAvg: inv.unitCost ? `S/ ${Number(inv.unitCost).toFixed(2)}` : '',
            reliability: 'Histórico en Inventario',
            contact: '',
            notes: '',
            minOrder: '',
            isRegistered: false
          });
        }
      }
    });

    return list;
  }, [suppliers, inventory]);

  // -------------------------------------------------------------
  // HELPER: PRECIO OFICIAL DE VENTA (PVP) DE UN INSUMO FÍSICO
  // -------------------------------------------------------------
  const getItemRetailPrice = (item) => {
    if (!item) return 60.00;
    const matched = products.find(p => 
      (!p.bundleItems || p.bundleItems.length === 0) && (
        (item.id && p.inventoryId === item.id) ||
        (item.sku && p.sku && p.sku.toLowerCase() === item.sku.toLowerCase()) ||
        (p.name && item.name && p.name.toLowerCase().trim() === item.name.toLowerCase().trim())
      )
    );
    if (matched && Number(matched.price) > 0) return Number(matched.price);
    const norm = (item.name || '').toLowerCase();
    const sku = (item.sku || '').toUpperCase();
    if (sku.includes('9972') || norm.includes('formato l') || norm.includes(' l esp') || norm.includes('display')) {
      return 80.00;
    }
    if (sku.includes('4951') || norm.includes('carnet') || norm.includes('vertical')) {
      return 40.00;
    }
    if (sku.includes('1367') || sku.includes('6781') || norm.includes('cuadrad') || norm.includes('horizontal')) {
      return 60.00;
    }
    if (item.salePrice && Number(item.salePrice) > 0) return Number(item.salePrice);
    const cost = Number(item.unitCost) || 0;
    return cost > 0 ? Number((cost * 2.5).toFixed(2)) : 60.00;
  };

  // -------------------------------------------------------------
  // FORMULARIO: PACK / PROMOCIÓN (UNIR PRODUCTOS)
  // -------------------------------------------------------------
  const [packForm, setPackForm] = useState({
    name: '',
    sku: generateRandomSku('LNK-PACK'),
    badge: 'Pack Promocional',
    promoPrice: '',
    bundleComponents: [], // [{ id, sku, name, unitCost, quantity }]
    description: ''
  });

  const handleOpenPackModal = () => {
    // Si hay insumos en inventario, pre-seleccionar 2 piezas para facilitar el armado
    let initialComponents = [];
    if (inventory.length >= 2) {
      initialComponents = [
        { id: inventory[0].id, sku: inventory[0].sku, name: inventory[0].name, unitCost: Number(inventory[0].unitCost) || 12.96, quantity: 1 },
        { id: inventory[1].id, sku: inventory[1].sku, name: inventory[1].name, unitCost: Number(inventory[1].unitCost) || 12.96, quantity: 1 }
      ];
    } else if (inventory.length === 1) {
      initialComponents = [
        { id: inventory[0].id, sku: inventory[0].sku, name: inventory[0].name, unitCost: Number(inventory[0].unitCost) || 12.96, quantity: 2 }
      ];
    }

    let regularSum = 0;
    initialComponents.forEach(c => {
      regularSum += getItemRetailPrice(c) * c.quantity;
    });
    const suggestedPrice = regularSum > 0 ? (Math.round((regularSum * 0.8) / 5) * 5).toFixed(2) : '80.00';

    setPackForm({
      name: '',
      sku: generateRandomSku('LNK-PACK'),
      badge: '🔥 Pack Dúo',
      promoPrice: suggestedPrice,
      bundleComponents: initialComponents,
      description: initialComponents.length > 0 
        ? `Incluye: ${initialComponents.map(c => `${c.quantity}x ${c.name}`).join(' + ')}.` 
        : ''
    });
    setIsPackModalOpen(true);
  };

  const handleApplyPackPreset = (presetType) => {
    const findItem = (query) => inventory.find(i => 
      (i.sku && i.sku.toLowerCase().includes(query.toLowerCase())) ||
      (i.name && i.name.toLowerCase().includes(query.toLowerCase()))
    ) || { id: `preset-${query}`, sku: `SKU-${query.toUpperCase()}`, name: query, unitCost: 12.96 };

    const horiz = findItem('cuadrado');
    const vert = findItem('carnet') || findItem('vertical') || inventory[1] || inventory[0];
    const disp = findItem('9972') || findItem(' l esp') || findItem('display') || inventory[2] || inventory[0];

    if (presetType === 'emprendedor') {
      setPackForm({
        name: 'Pack Emprendedor',
        sku: 'SKU-PACK-EMPRENDEDOR',
        badge: '🔥 Más Vendido',
        promoPrice: '80.00',
        bundleComponents: [
          { id: horiz.id, sku: horiz.sku, name: horiz.name, unitCost: Number(horiz.unitCost) || 12.96, quantity: 1 },
          { id: vert.id, sku: vert.sku, name: vert.name, unitCost: Number(vert.unitCost) || 12.96, quantity: 1 }
        ],
        description: 'Incluye: 1 Tarjeta Horizontal (PVP S/ 60) + 1 Tarjeta Vertical (PVP S/ 40). Ideal para empezar a captar reseñas.'
      });
    } else if (presetType === 'negocio') {
      setPackForm({
        name: 'Pack Negocio',
        sku: 'SKU-PACK-NEGOCIO',
        badge: 'Mostrador + Tarjeta',
        promoPrice: '100.00',
        bundleComponents: [
          { id: disp.id, sku: disp.sku, name: disp.name, unitCost: Number(disp.unitCost) || 12.96, quantity: 1 },
          { id: vert.id, sku: vert.sku, name: vert.name, unitCost: Number(vert.unitCost) || 12.96, quantity: 1 }
        ],
        description: 'Incluye: 1 Display de Mesa en L (PVP S/ 80) + 1 Tarjeta Vertical portátil (PVP S/ 40). Para caja y atención en mesa.'
      });
    } else if (presetType === 'duo_premium') {
      setPackForm({
        name: 'Pack Dúo Premium',
        sku: 'SKU-PACK-DUO-PREMIUM',
        badge: 'Mayor Presencia',
        promoPrice: '120.00',
        bundleComponents: [
          { id: disp.id, sku: disp.sku, name: disp.name, unitCost: Number(disp.unitCost) || 12.96, quantity: 1 },
          { id: horiz.id, sku: horiz.sku, name: horiz.name, unitCost: Number(horiz.unitCost) || 12.96, quantity: 1 }
        ],
        description: 'Incluye: 1 Display de Mesa en L (PVP S/ 80) + 1 Tarjeta Horizontal (PVP S/ 60). Mayor presencia en tu local.'
      });
    } else if (presetType === 'full') {
      setPackForm({
        name: 'Pack Full',
        sku: 'SKU-PACK-FULL',
        badge: '👑 Los 3 Modelos',
        promoPrice: '150.00',
        bundleComponents: [
          { id: disp.id, sku: disp.sku, name: disp.name, unitCost: Number(disp.unitCost) || 12.96, quantity: 1 },
          { id: horiz.id, sku: horiz.sku, name: horiz.name, unitCost: Number(horiz.unitCost) || 12.96, quantity: 1 },
          { id: vert.id, sku: vert.sku, name: vert.name, unitCost: Number(vert.unitCost) || 12.96, quantity: 1 }
        ],
        description: 'Incluye los 3 modelos oficiales: 1 Display de Mesa + 1 Tarjeta Horizontal + 1 Tarjeta Vertical.'
      });
    }
  };

  const handleAddComponentToPack = (invItem) => {
    setPackForm(prev => {
      const exists = prev.bundleComponents.find(c => c.id === invItem.id || c.sku === invItem.sku);
      let updated;
      if (exists) {
        updated = prev.bundleComponents.map(c => 
          (c.id === invItem.id || c.sku === invItem.sku) 
            ? { ...c, quantity: c.quantity + 1 } 
            : c
        );
      } else {
        updated = [
          ...prev.bundleComponents, 
          { 
            id: invItem.id, 
            sku: invItem.sku, 
            name: invItem.name, 
            unitCost: Number(invItem.unitCost) || 12.96, 
            quantity: 1 
          }
        ];
      }
      const desc = `Incluye: ${updated.map(c => `${c.quantity}x ${c.name}`).join(' + ')}.`;
      return { ...prev, bundleComponents: updated, description: desc };
    });
  };

  const handleUpdateComponentQty = (id, delta) => {
    setPackForm(prev => {
      const updated = prev.bundleComponents
        .map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
        .filter(c => c.quantity > 0);
      const desc = `Incluye: ${updated.map(c => `${c.quantity}x ${c.name}`).join(' + ')}.`;
      return { ...prev, bundleComponents: updated, description: desc };
    });
  };

  const handleRemoveComponent = (id) => {
    setPackForm(prev => {
      const updated = prev.bundleComponents.filter(c => c.id !== id);
      const desc = `Incluye: ${updated.map(c => `${c.quantity}x ${c.name}`).join(' + ')}.`;
      return { ...prev, bundleComponents: updated, description: desc };
    });
  };

  // Cálculos reactivos del Pack
  const packTotalCost = useMemo(() => {
    return packForm.bundleComponents.reduce((acc, c) => acc + (c.unitCost * c.quantity), 0);
  }, [packForm.bundleComponents]);

  // Precio regular por separado: suma real de precios de venta individuales (PVP) de cada insumo
  const packSuggestedRegularPrice = useMemo(() => {
    let regularSum = 0;
    packForm.bundleComponents.forEach(c => {
      regularSum += getItemRetailPrice(c) * (Number(c.quantity) || 1);
    });
    return Number(regularSum.toFixed(2));
  }, [packForm.bundleComponents, products]);

  const promoPriceNum = Number(packForm.promoPrice) || 0;
  const packSavings = Math.max(0, packSuggestedRegularPrice - promoPriceNum);
  const packDiscountPct = packSuggestedRegularPrice > 0 ? Math.round((packSavings / packSuggestedRegularPrice) * 100) : 0;
  const packProfit = promoPriceNum - packTotalCost;
  const packMarginPct = promoPriceNum > 0 ? Number(((packProfit / promoPriceNum) * 100).toFixed(1)) : 0;

  const handleSavePack = (e) => {
    e.preventDefault();
    if (packForm.bundleComponents.length === 0) {
      if (showToast) {
        showToast('⚠️ Agrega al menos 1 insumo al pack antes de guardarlo.', 'warning');
      } else {
        alert('⚠️ Por favor agrega al menos 1 insumo o producto al pack antes de guardarlo.');
      }
      return;
    }

    const finalSku = (packForm.sku && packForm.sku.trim()) || generateRandomSku('LNK-PACK');
    if (editingPack) {
      const updatedPack = {
        ...editingPack,
        name: packForm.name.trim(),
        sku: finalSku,
        category: 'Pack',
        type: 'Pack Promocional',
        price: promoPriceNum,
        cost: Number(packTotalCost.toFixed(2)),
        regularPrice: Number(packSuggestedRegularPrice.toFixed(2)),
        margin: Number(packProfit.toFixed(2)),
        marginPct: packMarginPct,
        badge: packForm.badge.trim() || 'Pack Promocional',
        description: packForm.description.trim(),
        bundleItems: packForm.bundleComponents
      };

      if (onEditProduct) {
        onEditProduct(updatedPack);
      }
      if (showToast) {
        showToast(`✓ Pack "${updatedPack.name}" actualizado correctamente`, 'success');
      }
      handleClosePackModal();
      return;
    }

    const newPack = {
      id: `prod-pack-${Date.now()}`,
      name: packForm.name.trim(),
      sku: finalSku,
      category: 'Pack',
      type: 'Pack Promocional',
      price: promoPriceNum,
      cost: Number(packTotalCost.toFixed(2)),
      regularPrice: Number(packSuggestedRegularPrice.toFixed(2)),
      stock: 25, // Unidades estimadas disponibles para armado
      margin: Number(packProfit.toFixed(2)),
      marginPct: packMarginPct,
      badge: packForm.badge.trim() || 'Pack Promocional',
      description: packForm.description.trim(),
      bundleItems: packForm.bundleComponents
    };

    onAddNewProduct(newPack);
    if (showToast) {
      showToast(`Pack "${newPack.name}" creado y publicado en el catálogo`, 'success');
    }
    handleClosePackModal();
  };

  const handleOpenEditProduct = (prod) => {
    const isPack = prod.type === 'pack' || (prod.bundleItems && prod.bundleItems.length > 0);
    if (isPack) {
      setEditingPack(prod);
      setPackForm({
        name: prod.name || '',
        sku: prod.sku || '',
        badge: prod.badge || '🔥 Pack Dúo',
        promoPrice: prod.price !== undefined ? prod.price : '',
        bundleComponents: (prod.bundleItems || []).map(bi => {
          const invMatch = inventory.find(i => i.id === bi.id || i.sku === bi.sku);
          return {
            id: bi.id || invMatch?.id || `comp-${Date.now()}`,
            name: bi.name,
            sku: bi.sku || invMatch?.sku || '',
            unitCost: invMatch ? Number(invMatch.unitCost || 0) : 12.93,
            quantity: bi.quantity || 1
          };
        }),
        description: prod.description || ''
      });
      setIsPackModalOpen(true);
    } else {
      setEditingProduct(prod);
      setNewProductForm({
        inventoryId: prod.inventoryId || '',
        name: prod.name || '',
        sku: prod.sku || '',
        category: prod.category || 'Individual',
        type: prod.type || 'NFC Inteligente',
        price: prod.price !== undefined ? prod.price : '',
        cost: prod.cost !== undefined ? prod.cost : 0,
        stock: prod.stock !== undefined ? prod.stock : 0,
        badge: prod.badge || '',
        description: prod.description || ''
      });
      setIsNewProductModalOpen(true);
    }
  };

  // -------------------------------------------------------------
  // FORMULARIO: PRODUCTO INDIVIDUAL
  // -------------------------------------------------------------
  // FORMULARIO: PRODUCTO INDIVIDUAL
  // -------------------------------------------------------------
  const [newProductForm, setNewProductForm] = useState({
    inventoryId: '',
    name: '',
    sku: '',
    category: 'Individual',
    type: 'NFC Inteligente',
    price: '',
    cost: 0,
    stock: 0,
    badge: 'Nuevo Producto',
    description: ''
  });

  const handleOpenNewProductModal = () => {
    // Buscar el primer insumo disponible que aún no esté publicado en catálogo o el primer insumo de inventario
    const availableItem = inventory.find(i => !products.some(p => p.sku === i.sku || p.inventoryId === i.id)) || (inventory.length > 0 ? inventory[0] : null);
    if (availableItem) {
      setNewProductForm({
        inventoryId: availableItem.id,
        name: availableItem.name,
        sku: availableItem.sku,
        category: 'Individual',
        type: availableItem.category || 'NFC Inteligente',
        price: (Number(availableItem.unitCost || 0) * 3).toFixed(2),
        cost: Number(availableItem.unitCost || 0),
        stock: availableItem.quantity ?? 0,
        badge: 'Nuevo Producto',
        description: `Producto fabricado con ${availableItem.name}. Configurado con chip NFC de alta fidelidad para Google Reviews y enlace directo.`
      });
    } else {
      setNewProductForm({
        inventoryId: '',
        name: '',
        sku: '',
        category: 'Individual',
        type: 'NFC Inteligente',
        price: '',
        cost: 0,
        stock: 0,
        badge: 'Nuevo Producto',
        description: ''
      });
    }
    setIsNewProductModalOpen(true);
  };

  const handleSelectInventoryItem = (invId) => {
    const item = inventory.find(i => i.id === invId);
    if (!item) {
      setNewProductForm(prev => ({
        ...prev,
        inventoryId: '',
        name: '',
        sku: '',
        cost: 0,
        stock: 0
      }));
      return;
    }
    const cost = Number(item.unitCost || 0);
    const suggestedPrice = cost > 0 ? (cost * 3).toFixed(2) : '';
    setNewProductForm(prev => ({
      ...prev,
      inventoryId: item.id,
      name: item.name,
      sku: item.sku,
      type: item.category || 'NFC Inteligente',
      cost: cost,
      stock: item.quantity ?? 0,
      price: prev.price && Number(prev.price) > 0 ? prev.price : suggestedPrice,
      description: `Producto fabricado con ${item.name}. Configurado con chip NFC de alta fidelidad para Google Reviews y enlace directo.`
    }));
  };

  // Publicar directamente desde un insumo físico de inventario al Catálogo
  const handlePublishInventoryToCatalog = (invItem) => {
    setNewProductForm({
      inventoryId: invItem.id,
      name: invItem.name,
      sku: invItem.sku,
      category: 'Individual',
      type: invItem.category || 'NFC Inteligente',
      price: (Number(invItem.unitCost || 0) * 3).toFixed(2),
      cost: Number(invItem.unitCost || 0),
      stock: invItem.quantity ?? 0,
      badge: 'Modelo Oficial',
      description: `Producto fabricado con ${invItem.name}. Configurado con chip NFC de alta fidelidad para Google Reviews y enlace directo.`
    });
    setIsNewProductModalOpen(true);
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProductForm.inventoryId && !editingProduct?.bundleItems?.length) {
      if (showToast) {
        showToast('⚠️ Debes seleccionar un insumo registrado en el inventario.', 'warning');
      } else {
        alert('⚠️ Debes seleccionar un insumo registrado en el inventario.');
      }
      return;
    }

    const selectedItem = inventory.find(i => i.id === newProductForm.inventoryId);
    const priceNum = Number(newProductForm.price) || 0;
    const costNum = selectedItem ? Number(selectedItem.unitCost || 0) : (Number(newProductForm.cost) || 0);
    const marginNum = priceNum - costNum;
    const marginPct = priceNum > 0 ? (marginNum / priceNum) * 100 : 0;
    const stockNum = selectedItem ? Number(selectedItem.quantity ?? 0) : (Math.max(0, parseInt(newProductForm.stock) || 0));
    const finalSku = selectedItem ? selectedItem.sku : ((newProductForm.sku && newProductForm.sku.trim()) || generateRandomSku('LNK-PROD'));

    if (editingProduct) {
      const updatedProd = {
        ...editingProduct,
        name: newProductForm.name.trim(),
        inventoryId: newProductForm.inventoryId || editingProduct.inventoryId,
        sku: finalSku,
        category: newProductForm.category,
        type: newProductForm.type,
        price: priceNum,
        cost: costNum,
        stock: stockNum,
        margin: marginNum,
        marginPct: Number(marginPct.toFixed(1)),
        badge: newProductForm.badge.trim(),
        description: newProductForm.description.trim()
      };

      if (onEditProduct) {
        onEditProduct(updatedProd);
      }
      if (showToast) {
        showToast(`✅ Producto "${updatedProd.name}" actualizado en el catálogo`, 'success');
      }
      handleCloseProductModal();
      return;
    }

    const newProd = {
      id: `prod-${Date.now()}`,
      name: newProductForm.name.trim(),
      inventoryId: newProductForm.inventoryId,
      sku: finalSku,
      category: newProductForm.category,
      type: newProductForm.type,
      price: priceNum,
      cost: costNum,
      stock: stockNum,
      margin: marginNum,
      marginPct: Number(marginPct.toFixed(1)),
      badge: newProductForm.badge.trim(),
      description: newProductForm.description.trim()
    };

    onAddNewProduct(newProd);
    if (showToast) {
      showToast(`✅ Producto "${newProd.name}" publicado en el catálogo oficial`, 'success');
    }
    handleCloseProductModal();
  };

  // -------------------------------------------------------------
  // FORMULARIO: NUEVO INSUMO / SKU EN INVENTARIO
  // -------------------------------------------------------------
  const [newItemForm, setNewItemForm] = useState({
    sku: generateRandomSku('SKU-LNK'),
    name: '',
    category: 'Chips / Insumos',
    quantity: 50,
    minThreshold: 20,
    unitCost: 4.00,
    supplier: '',
    leadTimeDays: 15,
    reorderUrl: '',
    notes: ''
  });

  const [supplierComboboxOpen, setSupplierComboboxOpen] = useState(false);
  const [supplierFilterQuery, setSupplierFilterQuery] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const comboboxRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
        setSupplierComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuppliers = useMemo(() => {
    const query = (supplierFilterQuery || '').trim().toLowerCase();
    if (!query) return dbSuppliersList;
    return dbSuppliersList.filter(s => 
      s.name.toLowerCase().includes(query) ||
      (s.itemSupplied && s.itemSupplied.toLowerCase().includes(query))
    );
  }, [dbSuppliersList, supplierFilterQuery]);

  const handleSelectSupplier = (sup) => {
    setSelectedSupplierId(sup.id);
    const leadDays = sup.leadTimeDays || parseSupplierDays(sup.leadTime) || 15;
    const parsedCost = parseCostFields(sup.unitCostAvg);
    const autoCost = parsedCost && !isNaN(parseFloat(parsedCost.value)) ? parseFloat(parsedCost.value) : null;

    setNewItemForm(prev => ({
      ...prev,
      supplier: sup.name,
      name: !prev.name.trim() ? sup.itemSupplied : prev.name,
      unitCost: autoCost !== null && (!prev.unitCost || prev.unitCost === 4.00) ? autoCost : prev.unitCost,
      leadTimeDays: leadDays,
      reorderUrl: prev.reorderUrl || (sup.notes && sup.notes.startsWith('http') ? sup.notes : prev.reorderUrl)
    }));
    setSupplierFilterQuery(sup.name);
    setSupplierComboboxOpen(false);
  };

  const handleOpenNewItemModal = () => {
    setEditingItem(null);
    const defaultSup = dbSuppliersList.length > 0 ? dbSuppliersList[0] : null;
    setSelectedSupplierId(defaultSup?.id || null);
    setNewItemForm({
      sku: generateRandomSku('SKU-LNK'),
      name: '',
      category: 'Chips / Insumos',
      quantity: 50,
      minThreshold: 20,
      unitCost: 4.00,
      supplier: defaultSup ? defaultSup.name : '',
      leadTimeDays: defaultSup ? defaultSup.leadTimeDays : 15,
      reorderUrl: '',
      notes: ''
    });
    setSupplierFilterQuery(defaultSup ? defaultSup.name : '');
    setSupplierComboboxOpen(false);
    setIsNewItemModalOpen(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    const matchedSup = dbSuppliersList.find(s => s.name.toLowerCase() === (item.supplier || '').toLowerCase());
    setSelectedSupplierId(matchedSup?.id || null);
    setNewItemForm({
      id: item.id,
      sku: item.sku || '',
      name: item.name || '',
      category: item.category || 'Chips / Insumos',
      quantity: item.quantity !== undefined ? item.quantity : 0,
      minThreshold: item.minThreshold !== undefined ? item.minThreshold : 10,
      unitCost: item.unitCost !== undefined ? item.unitCost : 0,
      supplier: item.supplier || '',
      leadTimeDays: item.leadTimeDays !== undefined ? item.leadTimeDays : 15,
      reorderUrl: item.reorderUrl || '',
      notes: item.notes || ''
    });
    setSupplierFilterQuery(item.supplier || '');
    setSupplierComboboxOpen(false);
    setIsNewItemModalOpen(true);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) {
      if (showToast) showToast('Ingresa un nombre para el insumo', 'warning');
      return;
    }

    const finalSku = (newItemForm.sku && newItemForm.sku.trim()) || generateRandomSku('SKU-LNK');
    
    if (editingItem) {
      const updatedItem = {
        ...editingItem,
        sku: finalSku,
        name: newItemForm.name.trim(),
        category: newItemForm.category,
        quantity: Math.max(0, parseInt(newItemForm.quantity, 10) || 0),
        minThreshold: Math.max(0, parseInt(newItemForm.minThreshold, 10) || 0),
        unitCost: Math.max(0, parseFloat(newItemForm.unitCost) || 0),
        supplier: newItemForm.supplier,
        leadTimeDays: Math.max(0, parseInt(newItemForm.leadTimeDays, 10) || 0),
        reorderUrl: newItemForm.reorderUrl || '',
        notes: newItemForm.notes || ''
      };

      if (onEditInventoryItem) {
        onEditInventoryItem(updatedItem);
      }
      if (showToast) {
        showToast(`✓ Insumo "${updatedItem.name}" actualizado correctamente`, 'success');
      }
    } else {
      const item = {
        id: `inv-${Date.now()}`,
        sku: finalSku,
        name: newItemForm.name.trim(),
        category: newItemForm.category,
        quantity: Number(newItemForm.quantity) || 0,
        minThreshold: Number(newItemForm.minThreshold) || 20,
        unitCost: Number(newItemForm.unitCost) || 0,
        supplier: newItemForm.supplier,
        leadTimeDays: Number(newItemForm.leadTimeDays) || 15,
        reorderUrl: newItemForm.reorderUrl,
        notes: newItemForm.notes
      };

      onAddNewInventoryItem(item);
      if (showToast) {
        showToast(`Insumo "${item.name}" guardado en inventario (${item.quantity} uds)`, 'success');
      }
    }
    handleCloseItemModal();
  };

  // -------------------------------------------------------------
  // FORMULARIO: PROVEEDOR
  // -------------------------------------------------------------
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    itemSupplied: '',
    leadTimeMin: '3',
    leadTimeMax: '5',
    costCurrency: 'S/',
    unitCostValue: '8.00',
    minOrderQty: '20',
    minOrderUnit: 'unidades',
    customMinOrderUnit: '',
    contact: '',
    reliability: '⭐⭐⭐⭐⭐ (Excelente)',
    notes: ''
  });

  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      itemSupplied: '',
      leadTimeMin: '3',
      leadTimeMax: '5',
      costCurrency: 'S/',
      unitCostValue: '8.00',
      minOrderQty: '20',
      minOrderUnit: 'unidades',
      customMinOrderUnit: '',
      contact: '',
      reliability: '⭐⭐⭐⭐⭐ (Excelente)',
      notes: ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup) => {
    setEditingSupplier(sup);
    const { min: lMin, max: lMax } = parseLeadTimeFields(sup.leadTime);
    const { currency: cCurr, value: cVal } = parseCostFields(sup.unitCostAvg);
    const { qty: mQty, unit: mUnit, customUnit: mCustom } = parseMinOrderFields(sup.minOrder);

    setSupplierForm({
      name: sup.name || '',
      itemSupplied: sup.itemSupplied || '',
      leadTimeMin: lMin || (sup.leadTimeDays ? String(sup.leadTimeDays) : '3'),
      leadTimeMax: lMax || '',
      costCurrency: cCurr,
      unitCostValue: cVal || '8.00',
      minOrderQty: mQty || (sup.minOrderQty ? String(sup.minOrderQty) : '20'),
      minOrderUnit: mUnit,
      customMinOrderUnit: mCustom,
      contact: sup.contact || '',
      reliability: sup.reliability || '⭐⭐⭐⭐⭐ (Excelente)',
      notes: sup.notes || ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e) => {
    e.preventDefault();
    const minDays = parseInt(supplierForm.leadTimeMin, 10);
    const maxDays = parseInt(supplierForm.leadTimeMax, 10);
    let formattedLeadTime = '3 - 5 días';
    let avgDays = 5;

    if (!isNaN(minDays) && !isNaN(maxDays)) {
      formattedLeadTime = `${minDays} - ${maxDays} días`;
      avgDays = Math.round((minDays + maxDays) / 2);
    } else if (!isNaN(minDays)) {
      formattedLeadTime = `${minDays} días`;
      avgDays = minDays;
    } else if (!isNaN(maxDays)) {
      formattedLeadTime = `${maxDays} días`;
      avgDays = maxDays;
    }

    const costVal = parseFloat(supplierForm.unitCostValue);
    const formattedCost = !isNaN(costVal)
      ? `${supplierForm.costCurrency} ${costVal.toFixed(2)}`
      : `${supplierForm.costCurrency} 0.00`;

    const orderQty = parseInt(supplierForm.minOrderQty, 10) || 1;
    const orderUnit = supplierForm.minOrderUnit === 'otro'
      ? (supplierForm.customMinOrderUnit.trim() || 'unidades')
      : supplierForm.minOrderUnit;
    const formattedMinOrder = `${orderQty} ${orderUnit}`;

    const supplierPayload = {
      name: supplierForm.name.trim(),
      itemSupplied: supplierForm.itemSupplied.trim(),
      leadTime: formattedLeadTime,
      leadTimeDays: avgDays,
      unitCostAvg: formattedCost,
      minOrder: formattedMinOrder,
      minOrderQty: orderQty,
      contact: supplierForm.contact.trim(),
      reliability: supplierForm.reliability,
      notes: supplierForm.notes.trim()
    };

    if (editingSupplier) {
      if (onEditSupplier) onEditSupplier({ ...editingSupplier, ...supplierPayload });
      if (showToast) showToast(`Proveedor "${supplierPayload.name}" actualizado exitosamente`, 'success');
    } else {
      const newSup = { id: `sup-${Date.now()}`, ...supplierPayload };
      if (onAddNewSupplier) onAddNewSupplier(newSup);
      if (showToast) showToast(`Proveedor "${supplierPayload.name}" registrado en el directorio`, 'success');
    }
    handleCloseSupplierModal();
  };

  // -------------------------------------------------------------
  // MÉTRICAS & ALERTAS DE STOCK FÍSICO (COMPRA VS VENTA VS MARGEN)
  // -------------------------------------------------------------
  const lowStockItems = inventory.filter(i => (Number(i.quantity) || 0) <= (Number(i.minThreshold) || 10));
  const totalStockUnits = inventory.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const totalStockCostValue = inventory.reduce((acc, i) => acc + ((Number(i.quantity) || 0) * (Number(i.unitCost) || 0)), 0);
  const totalStockRetailValue = inventory.reduce((acc, i) => acc + ((Number(i.quantity) || 0) * getItemRetailPrice(i)), 0);
  const totalPotentialProfit = Math.max(0, totalStockRetailValue - totalStockCostValue);
  const totalPotentialMarginPct = totalStockRetailValue > 0 ? Number(((totalPotentialProfit / totalStockRetailValue) * 100).toFixed(1)) : 0;
  const totalStockValue = totalStockCostValue;

  // Filtrado de Productos del Catálogo
  const filteredProducts = products.filter(p => {
    const isCategoryMatch = catalogCategory === 'all' || 
      (catalogCategory === 'Pack' && (p.category === 'Pack' || p.category === 'Packs Promocionales' || p.type === 'pack' || (p.bundleItems && p.bundleItems.length > 0))) ||
      (catalogCategory === 'Individual' && (p.category === 'Individual' || p.category === 'Modelos Individuales' || p.type === 'individual')) ||
      (catalogCategory === 'Innovacion' && (p.category === 'Innovacion' || p.category === 'Innovación'));
    const matchText = !catalogSearch.trim() || 
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (p.badge && p.badge.toLowerCase().includes(catalogSearch.toLowerCase()));
    return isCategoryMatch && matchText;
  });

  const individualCount = products.filter(p => p.category === 'Individual' || p.category === 'Modelos Individuales' || p.type === 'individual').length;
  const packsCount = products.filter(p => p.category === 'Pack' || p.category === 'Packs Promocionales' || p.type === 'pack' || (p.bundleItems && p.bundleItems.length > 0)).length;
  const innovationsCount = products.filter(p => p.category === 'Innovacion' || p.category === 'Innovación').length;

  return (
    <div className="inventory-view">
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: 'rgba(0, 102, 255, 0.12)', padding: '8px', borderRadius: 'var(--radius-md)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={24} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
              Almacén & Inventario Integral
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0', maxWidth: '820px' }}>
            Módulo unificado para gestionar el <strong>Catálogo Comercial (Packs y Precios de Venta)</strong>, el <strong>Stock Físico (Insumos y Piezas)</strong> y la <strong>Logística de Proveedores</strong> con descuento automático de piezas en cada venta.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onOpenNewExpense} title="Registrar gasto de compra de insumos">
            <DollarSign size={16} />
            <span>Registrar Compra / Gasto</span>
          </button>
          {activeSubTab === 'catalog' && (
            <>
              <button className="btn btn-primary" onClick={handleOpenPackModal}>
                <Gift size={16} />
                <span>+ Crear Pack / Promoción</span>
              </button>
              <button className="btn btn-secondary" onClick={handleOpenNewProductModal}>
                <Plus size={16} />
                <span>+ Producto Individual</span>
              </button>
            </>
          )}
          {activeSubTab === 'stock' && (
            <button className="btn btn-primary" onClick={handleOpenNewItemModal}>
              <Plus size={16} />
              <span>+ Agregar Insumo / SKU</span>
            </button>
          )}
          {activeSubTab === 'suppliers' && (
            <button className="btn btn-primary" onClick={handleOpenAddSupplier}>
              <Plus size={16} />
              <span>+ Agregar Proveedor</span>
            </button>
          )}
        </div>
      </div>

      {/* GUÍA DIDÁCTICA: DIFERENCIA ENTRE INVENTARIO Y ALMACÉN */}
      {showExplanation ? (
        <div 
          className="inventory-guide-banner"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.07) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(0, 102, 255, 0.22)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '20px',
            position: 'relative'
          }}
        >
          <button 
            onClick={() => setShowExplanation(false)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Ocultar explicación"
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ color: 'var(--primary-600)', marginTop: '2px' }}>
              <Info size={20} />
            </div>
            <div style={{ fontSize: '0.84rem', lineHeight: 1.5 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                💡 ¿Cuál es la diferencia entre Inventario y Almacén en LinkeoGes?
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '12px', marginTop: '8px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <strong style={{ color: 'var(--primary-600)' }}>📦 Stock Físico (Inventario):</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Son las piezas y materias primas en bodega (tarjetas vírgenes PVC, chips NTAG213, bases de acrílico en L, empaques). Controlas unidades reales, costos de importación de AliExpress y umbrales mínimos.
                  </p>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <strong style={{ color: '#10b981' }}>🛍️ Almacén Comercial (Catálogo & Packs):</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Es lo que ofreces al cliente final con precio oficial de venta (S/), ganancia y ofertas. Puedes <strong>unir múltiples insumos en un Pack</strong> (ej. 2 tarjetas + 1 base acrílica con 15% dcto). Al venderlo, el sistema descuenta automáticamente cada pieza del stock físico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-secondary btn-xs"
            onClick={() => setShowExplanation(true)}
            style={{ fontSize: '0.75rem', gap: '6px', color: 'var(--text-muted)' }}
            title="Ver explicación de Stock Físico vs Catálogo Comercial"
          >
            <Info size={13} />
            <span>💡 Ver guía: Inventario vs Almacén</span>
          </button>
        </div>
      )}

      {/* SUBTABS DE NAVEGACIÓN */}
      <div className="subtabs-bar">
        <button 
          className={`subtab-btn ${activeSubTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('catalog')}
        >
          <ShoppingBag size={18} />
          <span>
            <span className="hide-on-mobile">Catálogo Comercial & Packs Promocionales</span>
            <span className="show-on-mobile">Catálogo & Packs</span>
            {` (${products.length})`}
          </span>
        </button>

        <button 
          className={`subtab-btn ${activeSubTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('stock')}
        >
          <Boxes size={18} />
          <span>
            <span className="hide-on-mobile">Stock Físico & Insumos</span>
            <span className="show-on-mobile">Stock Físico</span>
            {` (${inventory.length})`}
          </span>
          {lowStockItems.length > 0 && (
            <span className="badge badge-yellow" style={{ fontSize: '0.68rem', padding: '1px 6px', marginLeft: '2px' }}>
              ⚠️ {lowStockItems.length}
            </span>
          )}
        </button>

        <button 
          className={`subtab-btn ${activeSubTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('suppliers')}
        >
          <Truck size={18} />
          <span>
            <span className="hide-on-mobile">Proveedores & Logística</span>
            <span className="show-on-mobile">Proveedores</span>
            {` (${suppliers.length})`}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: CATÁLOGO COMERCIAL & PACKS PROMOCIONALES                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'catalog' && (
        <div className="catalog-subtab">
          {/* Barra de Filtros y Búsqueda */}
          <div className="catalog-filters-bar">
            <div className="catalog-pills-row">
              <button 
                className={`btn btn-sm ${catalogCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCatalogCategory('all')}
              >
                Todos ({products.length})
              </button>
              <button 
                className={`btn btn-sm ${catalogCategory === 'Pack' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCatalogCategory('Pack')}
              >
                <span className="hide-on-mobile">🎁 Packs Promocionales ({packsCount})</span>
                <span className="show-on-mobile">🎁 Packs ({packsCount})</span>
              </button>
              <button 
                className={`btn btn-sm ${catalogCategory === 'Individual' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCatalogCategory('Individual')}
              >
                <span className="hide-on-mobile">Modelos Individuales ({individualCount})</span>
                <span className="show-on-mobile">Individuales ({individualCount})</span>
              </button>
              <button 
                className={`btn btn-sm ${catalogCategory === 'Innovacion' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCatalogCategory('Innovacion')}
              >
                <span className="hide-on-mobile">Próximas Innovaciones ({innovationsCount})</span>
                <span className="show-on-mobile">Innovaciones ({innovationsCount})</span>
              </button>
            </div>

            <div className="catalog-search-wrapper">
              <Search size={15} className="catalog-search-icon" />
              <input 
                type="text" 
                className="form-control"
                placeholder="Buscar por nombre, SKU..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Grid de Productos y Packs */}
          {filteredProducts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'var(--bg-card)', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(0, 102, 255, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)', marginBottom: '16px' }}>
                <ShoppingBag size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
                No hay productos en esta categoría
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 20px auto' }}>
                {catalogCategory === 'Pack'
                  ? 'Aún no has creado ningún combo o promoción. Puedes unir varios insumos (ej. 2 tarjetas + 1 base acrílica) con un descuento atractivo para tus clientes.'
                  : 'No se encontraron productos coincidentes con los filtros seleccionados.'}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={handleOpenPackModal}>
                  <Gift size={16} />
                  <span>+ Crear Pack / Promoción</span>
                </button>
                <button className="btn btn-secondary" onClick={handleOpenNewProductModal}>
                  <Plus size={16} />
                  <span>+ Producto Individual</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
              {filteredProducts.map(prod => {
                const isPack = prod.category === 'Pack' || (prod.bundleItems && prod.bundleItems.length > 0);
                const hasDiscount = prod.regularPrice && prod.regularPrice > prod.price;

                return (
                  <div 
                    key={prod.id} 
                    className="card"
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      position: 'relative',
                      border: isPack ? '1px solid rgba(0, 102, 255, 0.35)' : '1px solid var(--border-color)',
                      boxShadow: isPack ? '0 4px 20px rgba(0, 102, 255, 0.08)' : 'none'
                    }}
                  >
                    <div>
                      {/* Badges superiores y botón de eliminar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span className="code-mono" style={{ fontSize: '0.78rem' }}>{prod.sku}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`badge ${
                            prod.badge?.includes('🔥') || prod.badge?.includes('Dúo') || prod.badge?.includes('Pack') ? 'badge-blue' :
                            prod.badge?.includes('👑') || prod.badge?.includes('Vendido') ? 'badge-yellow' :
                            prod.badge?.includes('Ahorra') || prod.badge?.includes('2x1') ? 'badge-red' : 'badge-green'
                          }`}>
                            {prod.badge || (isPack ? 'Pack Especial' : 'Catálogo')}
                          </span>
                          <button 
                            className="btn-icon" 
                            style={{ width: '28px', height: '28px', color: 'var(--primary-400)' }}
                            onClick={() => handleOpenEditProduct(prod)}
                            title="Editar producto o pack del catálogo"
                          >
                            <Edit size={13} />
                          </button>
                          <button 
                            className="btn-icon" 
                            style={{ width: '28px', height: '28px', color: '#ef4444' }}
                            onClick={() => onRequestDelete && onRequestDelete(prod, 'Producto')}
                            title="Eliminar producto del catálogo (Auditoría)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Nombre y Tipo */}
                      <h3 
                        style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px 0', lineHeight: 1.3, cursor: 'pointer' }}
                        onClick={() => handleOpenEditProduct(prod)}
                        title="Haz clic para editar este producto"
                      >
                        {prod.name}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: isPack ? 'var(--primary-600)' : 'var(--text-muted)', fontWeight: 600, marginBottom: '12px' }}>
                        {isPack ? '🎁 Pack Combinado (Auto-descuenta componentes)' : (prod.type || 'Modelo Individual')}
                      </div>

                      {/* Si es Pack: Mostrar Lista de Componentes Vinculados */}
                      {isPack && prod.bundleItems && prod.bundleItems.length > 0 && (
                        <div style={{ 
                          backgroundColor: 'var(--bg-input)', 
                          padding: '10px 12px', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px dashed rgba(0, 102, 255, 0.3)',
                          marginBottom: '14px'
                        }}>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                            📦 Componentes incluidos en este Pack:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {prod.bundleItems.map((bi, idx) => (
                              <span key={idx} className="bundle-component-tag">
                                <strong>{bi.quantity}x</strong> {bi.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pricing & Margen */}
                      <div style={{ 
                        backgroundColor: 'var(--bg-input)', 
                        padding: '12px', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {isPack ? 'Precio Promoción:' : 'Precio Oficial:'}
                          </span>
                          <div style={{ textAlign: 'right' }}>
                            {hasDiscount && (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', textDecoration: 'line-through', marginRight: '8px' }}>
                                S/ {Number(prod.regularPrice).toFixed(2)}
                              </span>
                            )}
                            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)' }}>
                              S/ {Number(prod.price).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.78rem', paddingTop: '8px', borderTop: '1px dashed var(--border-subtle)' }}>
                          <div>
                            <span style={{ color: 'var(--text-subtle)' }}>Costo Total:</span>
                            <div style={{ fontWeight: 700, color: 'var(--google-red)' }}>S/ {Number(prod.cost).toFixed(2)}</div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-subtle)' }}>Ganancia:</span>
                            <div style={{ fontWeight: 700, color: 'var(--google-green)' }}>
                              S/ {Number(prod.margin).toFixed(2)} ({prod.marginPct}%)
                            </div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-subtle)' }}>Disponibilidad:</span>
                            <div style={{ fontWeight: 800, color: '#10b981' }}>
                              {isPack ? 'Ensamblado Inmediato' : `${inventory.find(i => i.id === prod.inventoryId || i.sku === prod.sku)?.quantity ?? 0} uds`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                        {prod.description}
                      </p>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                        ✓ Listo para facturación & ventas
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                        ✓ Google Reviews Ready
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Banner de Innovación */}
          <div 
            style={{
              marginTop: '32px',
              background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)',
              border: '1px dashed rgba(0, 102, 255, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(0, 102, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
                <Compass size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  ¿Deseas lanzar una nueva línea o promoción especial?
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, maxWidth: '650px' }}>
                  Puedes diseñar promociones para restaurantes o eventos uniendo varias tarjetas con displays de acrílico. LinkeoGes sincroniza todo automáticamente con Supabase.
                </p>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleOpenPackModal}>
              <Sparkles size={16} />
              <span>Crear Nuevo Pack Promocional</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: STOCK FÍSICO & INSUMOS                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'stock' && (
        <div className="stock-subtab">
          {/* Banner de Compras con Mercadería Pendiente por Recibir */}
          {pendingExpenses.length > 0 && (
            <div 
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={22} color="#f59e0b" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    ⏳ Mercadería Pendiente por Recibir ({pendingExpenses.length} pedido{pendingExpenses.length > 1 ? 's' : ''})
                  </h3>
                </div>
                <span style={{ fontSize: '0.76rem', color: '#f59e0b', fontWeight: 600 }}>
                  Da OK cuando recibas el pedido para sumarlo al stock físico
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingExpenses.map(exp => {
                  const units = exp.quantity || exp.stockMovements?.[0]?.quantity || 1;
                  return (
                    <div 
                      key={exp.id}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          📦 {exp.description}
                        </strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
                          <span>🔢 Cantidad: <strong style={{ color: '#10b981' }}>+{units} unidades</strong></span>
                          <span>💰 Desembolso: <strong>S/ {Number(exp.amount).toFixed(2)}</strong></span>
                          <span>📅 {exp.date}</span>
                          <span>Pagado por: {exp.paidBy === 'luis' ? 'Luis Romero' : 'Kevin Servat'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{
                          backgroundColor: '#10b981',
                          borderColor: '#10b981',
                          fontSize: '0.78rem',
                          padding: '6px 14px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => {
                          if (onReceiveExpenseStock) {
                            onReceiveExpenseStock(exp.id);
                          }
                        }}
                      >
                        <Check size={14} />
                        <span>✓ Dar OK e Ingresar a Inventario</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Banner de Alerta Crítica si hay Stock Bajo */}
          {lowStockItems.length > 0 && (
            <div 
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <AlertTriangle size={30} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '3px' }}>
                    ⚠️ Alerta de Quiebre de Stock: {lowStockItems[0].name}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                    Stock actual: <strong style={{ color: '#f59e0b' }}>{lowStockItems[0].quantity} unidades</strong> (Mínimo de seguridad: {lowStockItems[0].minThreshold} uds).
                    Considerando tiempos de importación de <strong>{lowStockItems[0].leadTimeDays || 15} días</strong>, se recomienda reordenar pronto.
                  </p>
                </div>
              </div>

              <a 
                href={lowStockItems[0].reorderUrl || 'https://es.aliexpress.com/wholesale?SearchText=ntag215+nfc+card'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <Truck size={16} />
                <span>Reordenar en AliExpress</span>
              </a>
            </div>
          )}

          {/* KPIs de Stock Físico: Compra vs Venta vs Ganancia */}
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', marginBottom: '22px' }}>
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Unidades Físicas</span>
                <div className="kpi-icon-wrapper">
                  <Package size={18} />
                </div>
              </div>
              <div className="kpi-value">{totalStockUnits} uds</div>
              <div className="kpi-subtext">Sumatoria de insumos reales en bodega</div>
            </div>

            <div className="kpi-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <div className="kpi-header">
                <span className="kpi-label" style={{ color: '#f59e0b', fontWeight: 700 }}>Valor Total (Costo Compra)</span>
                <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: '#f59e0b' }}>S/ {totalStockCostValue.toFixed(2)}</div>
              <div className="kpi-subtext">Capital invertido en compras a proveedores</div>
            </div>

            <div className="kpi-card" style={{ borderColor: 'rgba(0, 102, 255, 0.4)' }}>
              <div className="kpi-header">
                <span className="kpi-label" style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Valor Total (Precio Venta)</span>
                <div className="kpi-icon-wrapper" style={{ background: 'rgba(0, 102, 255, 0.12)', color: 'var(--primary-600)' }}>
                  <Tag size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: 'var(--primary-400)' }}>S/ {totalStockRetailValue.toFixed(2)}</div>
              <div className="kpi-subtext">Valor comercial proyectado si se vende todo</div>
            </div>

            <div className="kpi-card kpi-green">
              <div className="kpi-header">
                <span className="kpi-label" style={{ color: '#10b981', fontWeight: 700 }}>Ganancia Bruta Potencial</span>
                <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="kpi-value">S/ {totalPotentialProfit.toFixed(2)}</div>
              <div className="kpi-subtext">Margen proyectado: <strong>+{totalPotentialMarginPct}%</strong> (Venta - Compra)</div>
            </div>

            <div className="kpi-card kpi-yellow">
              <div className="kpi-header">
                <span className="kpi-label">Alertas de Reposición</span>
                <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: lowStockItems.length > 0 ? '#f59e0b' : '#10b981' }}>
                {lowStockItems.length} {lowStockItems.length === 1 ? 'insumo' : 'insumos'}
              </div>
              <div className="kpi-subtext">Por debajo o cerca del umbral mínimo</div>
            </div>
          </div>

          {/* Tabla de Detalle de Insumos */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                <Layers size={18} color="var(--primary-600)" />
                <span>Detalle de Insumos, Materias Primas y Piezas Físicas</span>
              </h3>
              <button className="btn btn-primary btn-sm" onClick={handleOpenNewItemModal}>
                <Plus size={14} />
                <span>Agregar Insumo / SKU</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Nombre del Material</th>
                    <th>Categoría</th>
                    <th>Stock Actual</th>
                    <th style={{ textAlign: 'right' }}>Costo Compra (S/)</th>
                    <th style={{ textAlign: 'right' }}>Precio Venta (S/)</th>
                    <th style={{ textAlign: 'right' }}>Margen / Ganancia</th>
                    <th>Proveedor</th>
                    <th>Días Envío</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center' }}>Acciones & Catálogo</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No hay insumos registrados en el inventario. Pulsa "Agregar Insumo / SKU" para comenzar.
                      </td>
                    </tr>
                  ) : (
                    inventory.map(item => {
                      const isLow = (Number(item.quantity) || 0) <= (Number(item.minThreshold) || 10);
                      const unitCost = Number(item.unitCost) || 0;
                      const retailPrice = getItemRetailPrice(item);
                      const unitProfit = Math.max(0, retailPrice - unitCost);
                      const unitMarginPct = retailPrice > 0 ? Number(((unitProfit / retailPrice) * 100).toFixed(1)) : 0;
                      return (
                        <tr key={item.id}>
                          <td>
                            <span 
                              className="code-mono"
                              style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                              onClick={() => handleOpenEditItem(item)}
                              title="Haz clic para editar este insumo"
                            >
                              {item.sku}
                            </span>
                          </td>
                          <td>
                            <strong 
                              style={{ fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-main)' }}
                              onClick={() => handleOpenEditItem(item)}
                              title="Haz clic para editar este insumo"
                            >
                              {item.name}
                            </strong>
                            {item.notes && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {item.notes}
                              </div>
                            )}
                          </td>
                          <td><span className="badge badge-blue">{item.category}</span></td>
                          <td style={{ fontWeight: 800, fontSize: '1rem', color: isLow ? '#f59e0b' : 'var(--text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span 
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleOpenEditItem(item)}
                                title="Haz clic para editar el stock"
                              >
                                {item.quantity} uds
                              </span>
                              <div style={{ display: 'inline-flex', gap: '3px' }}>
                                <button 
                                  className="btn-icon" 
                                  style={{ width: '22px', height: '22px' }}
                                  onClick={() => handleStockClick(item, -1)}
                                  title="Restar 1 unidad"
                                >
                                  <Minus size={11} />
                                </button>
                                <button 
                                  className="btn-icon" 
                                  style={{ width: '22px', height: '22px' }}
                                  onClick={() => handleStockClick(item, 1)}
                                  title="Sumar 1 unidad"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: '#f59e0b' }}>
                              S/ {unitCost.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                              Costo Compra
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: 'var(--primary-400)' }}>
                              S/ {retailPrice.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                              PVP Venta
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: '#10b981' }}>
                              +S/ {unitProfit.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#10b981' }}>
                              ({unitMarginPct}%)
                            </div>
                          </td>
                          <td>{item.supplier}</td>
                          <td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                              <Clock size={12} /> {item.leadTimeDays || 15} días
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${isLow ? 'badge-yellow' : 'badge-green'}`}>
                              {isLow ? '⚠️ Stock Bajo' : '✓ Óptimo'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {products.some(p => p.sku === item.sku || p.inventoryId === item.id || p.name?.toLowerCase() === item.name?.toLowerCase()) ? (
                                <span 
                                  className="badge badge-green" 
                                  style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title="Este insumo ya está activo y sincronizado en el Catálogo Comercial"
                                >
                                  <Check size={12} /> En Catálogo
                                </span>
                              ) : (
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                                  onClick={() => handlePublishInventoryToCatalog(item)}
                                  title="Publicar este insumo como producto oficial en el Catálogo Comercial"
                                >
                                  <ShoppingBag size={12} />
                                  <span>Publicar en Catálogo</span>
                                </button>
                              )}
                              <button 
                                className="btn-icon" 
                                style={{ width: '26px', height: '26px', color: 'var(--primary-400)' }}
                                onClick={() => handleOpenEditItem(item)}
                                title="Editar insumo / producto de inventario"
                              >
                                <Edit size={13} />
                              </button>
                              <button 
                                className="btn-icon" 
                                style={{ width: '26px', height: '26px', color: '#ef4444' }}
                                onClick={() => onRequestDelete && onRequestDelete(item, 'Insumo')}
                                title="Eliminar insumo (Auditoría)"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: PROVEEDORES & LOGÍSTICA                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'suppliers' && (
        <div className="suppliers-subtab">
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 className="card-title" style={{ margin: 0 }}>
                  <Truck size={18} color="var(--primary-600)" />
                  <span>Directorio de Proveedores y Logística de Reabastecimiento</span>
                </h3>
                <span className="badge badge-blue">{suppliers.length} Proveedores Validados</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAddSupplier}>
                <Plus size={14} />
                <span>Agregar Proveedor</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
              {suppliers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
                  <Truck size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>No hay proveedores registrados</h4>
                  <p style={{ fontSize: '0.84rem', margin: '0 auto 16px auto', maxWidth: '420px' }}>
                    Registra proveedores locales o internacionales para llevar el control de insumos, costos, tiempos de entrega y contacto.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleOpenAddSupplier}>
                    <Plus size={14} /> Agregar Proveedor
                  </button>
                </div>
              ) : (
                suppliers.map(sup => (
                  <div 
                    key={sup.id}
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{sup.name}</h4>
                        <span style={{ fontSize: '0.8rem' }}>{sup.reliability}</span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        📦 <strong>Suministra:</strong> {sup.itemSupplied}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                        <div>⏱️ <strong>Tiempo estimado:</strong> {sup.leadTime}</div>
                        <div>💰 <strong>Costo estimado:</strong> {sup.unitCostAvg}</div>
                        <div>📦 <strong>Pedido mínimo:</strong> {sup.minOrder}</div>
                        <div>📞 <strong>Contacto:</strong> {sup.contact || 'No especificado'}</div>
                      </div>

                      {sup.notes && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                          💡 {sup.notes}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.76rem', gap: '4px' }}
                        onClick={() => handleOpenEditSupplier(sup)}
                      >
                        <Edit size={12} />
                        <span>Editar</span>
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.76rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', gap: '4px' }}
                        onClick={() => onRequestDelete && onRequestDelete(sup, 'Proveedor')}
                      >
                        <Trash2 size={12} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREADOR DE PACKS Y PROMOCIONES (UNIR PRODUCTOS)                  */}
      {/* ========================================================================= */}
      {isPackModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gift size={22} color="var(--primary-600)" />
                <h3 className="modal-title">
                  {editingPack ? 'Editar Pack Promocional' : 'Armar Pack Promocional o Combo Comercial'}
                </h3>
              </div>
              <button className="close-btn" onClick={handleClosePackModal}>✕</button>
            </div>

            <form onSubmit={handleSavePack}>
              <div className="form-group">
                <label className="form-label">Nombre del Pack o Promoción:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Pack Dúo Restaurante (2 Tarjetas Google NFC + 1 Base Acrílica)"
                  value={packForm.name}
                  onChange={(e) => setPackForm({ ...packForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Código SKU del Pack:</label>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '3px 8px', gap: '4px' }}
                      onClick={() => setPackForm(prev => ({ ...prev, sku: generateRandomSku('LNK-PACK') }))}
                    >
                      <Shuffle size={12} /> 🎲 Aleatorio
                    </button>
                  </div>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    value={packForm.sku}
                    onChange={(e) => setPackForm({ ...packForm, sku: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Insignia / Badge Promocional:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej: 🔥 Pack Dúo, Ahorra S/ 20, 2x1..."
                    value={packForm.badge}
                    onChange={(e) => setPackForm({ ...packForm, badge: e.target.value })}
                  />
                  {/* Chips de badges rápidos */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {['🔥 Pack Dúo', '⭐ Más Vendido', '🎁 2x1 Especial', '💰 Ahorra S/ 20', '🚀 Pack Corporativo'].map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setPackForm({ ...packForm, badge: b })}
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid var(--border-color)',
                          background: packForm.badge === b ? 'var(--primary-600)' : 'var(--bg-input)',
                          color: packForm.badge === b ? '#ffffff' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SELECCIÓN DE COMPONENTES DEL PACK */}
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📦 Componentes e Insumos Físicos que Integran este Pack:</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                    {packForm.bundleComponents.length} insumos seleccionados
                  </span>
                </label>

                {/* Combos Rápidos Oficiales de la Web */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>Combos Web Oficiales:</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleApplyPackPreset('emprendedor')} style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                    🔥 Pack Emprendedor (S/ 80)
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleApplyPackPreset('negocio')} style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                    🏢 Pack Negocio (S/ 100)
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleApplyPackPreset('duo_premium')} style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                    ⭐ Pack Dúo Premium (S/ 120)
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleApplyPackPreset('full')} style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                    👑 Pack Full (S/ 150)
                  </button>
                </div>

                {/* Lista de Insumos disponibles para agregar rápido */}
                <div style={{ 
                  backgroundColor: 'var(--bg-input)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '10px',
                  maxHeight: '130px',
                  overflowY: 'auto',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Haz clic en cualquier insumo de tu almacén para añadirlo al pack:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {inventory.map(inv => {
                      const retailP = getItemRetailPrice(inv);
                      return (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => handleAddComponentToPack(inv)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '5px 10px',
                            fontSize: '0.76rem',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                          }}
                          title={`Costo Compra: S/ ${Number(inv.unitCost || 0).toFixed(2)} | PVP Venta: S/ ${retailP.toFixed(2)} | Stock: ${inv.quantity} uds`}
                        >
                          <Plus size={12} color="var(--primary-600)" />
                          <strong>{inv.name}</strong>
                          <span style={{ color: '#f59e0b', fontSize: '0.68rem', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                            Compra: S/ {Number(inv.unitCost || 0).toFixed(2)}
                          </span>
                          <span style={{ color: 'var(--primary-400)', fontSize: '0.68rem', background: 'rgba(0, 102, 255, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                            PVP: S/ {retailP.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tabla de componentes seleccionados */}
                {packForm.bundleComponents.length > 0 ? (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Insumo / Pieza</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Cantidad</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Costo Compra</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>PVP Venta</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Subtotal Compra</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Subtotal Venta</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Quitar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {packForm.bundleComponents.map(c => {
                          const cRetail = getItemRetailPrice(c);
                          const subCost = c.unitCost * c.quantity;
                          const subRetail = cRetail * c.quantity;
                          return (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '8px 12px' }}>
                                <strong>{c.name}</strong>
                                <div className="code-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.sku}</div>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateComponentQty(c.id, -1)}
                                    className="btn-icon"
                                    style={{ width: '22px', height: '22px' }}
                                  >
                                    <Minus size={11} />
                                  </button>
                                  <span style={{ fontWeight: 800, minWidth: '20px' }}>{c.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateComponentQty(c.id, 1)}
                                    className="btn-icon"
                                    style={{ width: '22px', height: '22px' }}
                                  >
                                    <Plus size={11} />
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#f59e0b' }}>
                                S/ {c.unitCost.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--primary-400)' }}>
                                S/ {cRetail.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>
                                S/ {subCost.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-400)' }}>
                                S/ {subRetail.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveComponent(c.id)}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)', borderRadius: 'var(--radius-md)', fontSize: '0.84rem' }}>
                    ⚠️ Haz clic en al menos 1 insumo arriba o selecciona uno de los combos rápidos para armar este pack.
                  </div>
                )}
              </div>

              {/* CÁLCULO FINANCIERO REACTIVO EN VIVO */}
              <div className="promo-calc-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} color="var(--primary-600)" />
                    Estructura de Precios y Ganancia del Pack
                  </strong>
                  <span className={`badge ${packProfit >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.72rem' }}>
                    Margen Estimado: {packMarginPct}%
                  </span>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700 }}>
                      📉 Costo Insumos (Compra):
                    </label>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>
                      S/ {packTotalCost.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      Lo que cuesta comprar las piezas
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--primary-400)', fontWeight: 700 }}>
                      🏷️ Suma por Separado (Venta):
                    </label>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                      S/ {packSuggestedRegularPrice.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      Si el cliente compra suelto
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 700 }}>
                      🛍️ Precio Promoción (Venta Web):
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      className="form-control"
                      style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', borderColor: packProfit < 0 ? '#ef4444' : 'var(--primary-500)' }}
                      value={packForm.promoPrice}
                      onChange={(e) => setPackForm({ ...packForm, promoPrice: e.target.value })}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      Precio final para el cliente
                    </span>
                  </div>
                </div>

                {/* Resumen de Ahorro y Ganancia */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '0.82rem', color: packSavings > 0 ? 'var(--google-green)' : 'var(--text-muted)', fontWeight: 700 }}>
                    🎉 Ahorro al cliente: S/ {packSavings.toFixed(2)} ({packDiscountPct}% OFF)
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 800 }}>
                    💰 Ganancia Neta por Pack: <span style={{ color: packProfit >= 0 ? '#10b981' : '#ef4444' }}>S/ {packProfit.toFixed(2)}</span>
                  </div>
                </div>

                {/* Alertas didácticas financieras */}
                {packProfit < 0 && (
                  <div style={{ 
                    padding: '10px 14px', 
                    backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                    border: '1px solid #ef4444', 
                    borderRadius: 'var(--radius-md)', 
                    color: '#ef4444', 
                    fontSize: '0.8rem', 
                    marginTop: '10px',
                    lineHeight: 1.4
                  }}>
                    🚨 <strong>¡Alerta de Pérdida Crítica!</strong> El precio de venta que ingresaste (S/ {promoPriceNum.toFixed(2)}) es menor que el costo de adquisición de los insumos (S/ {packTotalCost.toFixed(2)}). Perderías <strong>S/ {Math.abs(packProfit).toFixed(2)}</strong> por cada pack vendido. Aumenta el precio a más de S/ {packTotalCost.toFixed(2)}.
                  </div>
                )}

                {promoPriceNum >= packSuggestedRegularPrice && packSuggestedRegularPrice > 0 && (
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: 'rgba(245, 158, 11, 0.12)', 
                    border: '1px solid rgba(245, 158, 11, 0.4)', 
                    borderRadius: 'var(--radius-md)', 
                    color: '#f59e0b', 
                    fontSize: '0.78rem', 
                    marginTop: '10px'
                  }}>
                    ℹ️ <strong>Nota comercial:</strong> El precio del pack (S/ {promoPriceNum.toFixed(2)}) es igual o mayor al precio si se compran las piezas por separado (S/ {packSuggestedRegularPrice.toFixed(2)}). Para que sea una oferta atractiva, fija un precio menor (ej. S/ {(packSuggestedRegularPrice * 0.8).toFixed(2)}).
                  </div>
                )}

                {packProfit > 0 && packSavings > 0 && (
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                    border: '1px solid rgba(16, 185, 129, 0.3)', 
                    borderRadius: 'var(--radius-md)', 
                    color: '#10b981', 
                    fontSize: '0.78rem', 
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    <span>✓ <strong>Rentabilidad asegurada:</strong> Tu margen neto es del <strong>{packMarginPct}%</strong>.</span>
                    <span>El cliente ahorra <strong>{packDiscountPct}%</strong>.</span>
                  </div>
                )}
              </div>

              {/* DESCRIPCIÓN COMERCIAL */}
              <div className="form-group" style={{ marginTop: '14px' }}>
                <label className="form-label">Descripción Comercial & Beneficios:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  value={packForm.description}
                  onChange={(e) => setPackForm({ ...packForm, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleClosePackModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Gift size={15} />
                  <span>{editingPack ? 'Guardar Cambios' : 'Publicar Pack Promocional'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NUEVO PRODUCTO INDIVIDUAL                                        */}
      {/* ========================================================================= */}
      {isNewProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Editar Producto del Catálogo Oficial' : 'Registrar Producto en Catálogo Oficial'}
              </h3>
              <button className="close-btn" onClick={handleCloseProductModal}>✕</button>
            </div>

            <form onSubmit={handleCreateProduct}>
              {/* Selector de Insumo Físico de Inventario */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>
                    📦 Insumo Registrado en Inventario (Obligatorio):
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {inventory.length} insumos en almacén
                  </span>
                </label>
                {inventory.length === 0 ? (
                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.84rem', marginBottom: '10px' }}>
                    ⚠️ No hay insumos físicos registrados en almacén. Primero debes agregar el insumo en la pestaña &quot;Insumos Físicos &amp; Stock&quot; o registrar una compra a proveedores.
                  </div>
                ) : (
                  <select 
                    className="form-control"
                    value={newProductForm.inventoryId}
                    onChange={(e) => handleSelectInventoryItem(e.target.value)}
                    required
                    style={{ borderColor: 'var(--primary-500)', fontWeight: 600 }}
                  >
                    <option value="">-- Selecciona el insumo registrado en almacén --</option>
                    {inventory.map(item => {
                      const alreadyInCatalog = products.some(p => p.sku === item.sku || p.inventoryId === item.id);
                      return (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.sku}) — Stock: {item.quantity} uds | Costo: S/ {Number(item.unitCost || 0).toFixed(2)}{alreadyInCatalog ? ' [Ya en catálogo]' : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
                <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>
                  El producto de venta quedará vinculado directamente a este insumo para descontar stock real en cada venta.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre Comercial del Producto:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Tarjeta Google NFC Cuadrado ESP..."
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Código SKU (Vinculado a Almacén):</label>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    value={newProductForm.sku}
                    readOnly
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', color: 'var(--primary-400)', fontWeight: 700 }}
                    title="El SKU se hereda del insumo físico registrado en almacén"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoría Comercial:</label>
                  <select 
                    className="form-control"
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                  >
                    <option value="Individual">Modelo Individual (Tarjeta NFC)</option>
                    <option value="Pack">Pack Promocional</option>
                    <option value="Innovacion">Nueva Innovación Tecnológica</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Precio de Venta Oficial (S/):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="form-control"
                    placeholder="Ej: 69.00"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Costo Real de Insumo (S/):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control"
                    value={newProductForm.cost}
                    readOnly
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }}
                    title="Costo unitario registrado en almacén para este insumo"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Stock Físico Disponible (Uds):</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={newProductForm.stock}
                    readOnly
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', fontWeight: 700 }}
                    title="Unidades físicas disponibles en almacén"
                  />
                  <small style={{ fontSize: '0.72rem', color: newProductForm.stock <= 5 ? '#ef4444' : '#10b981', marginTop: '2px', display: 'block' }}>
                    {newProductForm.stock <= 5 ? '⚠️ Stock bajo en almacén' : '✓ Stock óptimo en almacén'}
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Etiqueta Destacada (Badge):</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej: Más Vendido, Top 2026..."
                    value={newProductForm.badge}
                    onChange={(e) => setNewProductForm({ ...newProductForm, badge: e.target.value })}
                  />
                </div>
              </div>

              {/* Cálculo dinámico de margen */}
              {Number(newProductForm.price) > 0 && (
                <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '0.82rem' }}>
                  <span>Margen Bruto estimado:</span>
                  <strong style={{ color: Number(newProductForm.price) >= Number(newProductForm.cost) ? '#10b981' : '#ef4444' }}>
                    S/ {(Number(newProductForm.price) - Number(newProductForm.cost)).toFixed(2)} ({Number(newProductForm.price) > 0 ? (((Number(newProductForm.price) - Number(newProductForm.cost)) / Number(newProductForm.price)) * 100).toFixed(1) : 0}%)
                  </strong>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Descripción del Producto:</label>
                <textarea 
                  className="form-control"
                  rows="3"
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseProductModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={inventory.length === 0 || (!newProductForm.inventoryId && !editingProduct?.bundleItems?.length)}>
                  {editingProduct ? 'Guardar Cambios' : 'Publicar en Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AGREGAR INSUMO / SKU A INVENTARIO                                 */}
      {/* ========================================================================= */}
      {isNewItemModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Editar Insumo / Producto de Inventario' : 'Agregar Insumo Físico a Inventario'}
              </h3>
              <button className="close-btn" onClick={handleCloseItemModal}>✕</button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="form-group">
                <label className="form-label">Nombre del Insumo / Material:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Base de Acrílico Cristal en L para Displays"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Código SKU:</label>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '3px 8px', gap: '4px' }}
                      onClick={() => setNewItemForm(prev => ({ ...prev, sku: generateRandomSku('SKU-LNK') }))}
                    >
                      <Shuffle size={12} /> 🎲 Aleatorio
                    </button>
                  </div>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    value={newItemForm.sku}
                    onChange={(e) => setNewItemForm({ ...newItemForm, sku: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoría:</label>
                  <select 
                    className="form-control"
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                  >
                    <option value="Chips / Insumos">Chips NFC / Insumos</option>
                    <option value="Displays">Displays de Mesa Acrílico</option>
                    <option value="Tarjetas Base">Tarjetas PVC Base</option>
                    <option value="Empaque">Empaque y Sobres</option>
                    <option value="Marketing">Stickers y Material POP</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cantidad Inicial (Stock Físico):</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={newItemForm.quantity}
                    onChange={(e) => setNewItemForm({ ...newItemForm, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Umbral de Alerta Mínima:</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={newItemForm.minThreshold}
                    onChange={(e) => setNewItemForm({ ...newItemForm, minThreshold: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Costo Unitario de Compra (S/):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control"
                    value={newItemForm.unitCost}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unitCost: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tiempo de Reposición (Días):</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={newItemForm.leadTimeDays}
                    onChange={(e) => setNewItemForm({ ...newItemForm, leadTimeDays: e.target.value })}
                  />
                </div>
              </div>

              {/* Combobox de Proveedor */}
              <div className="form-group" ref={comboboxRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Proveedor Principal:</label>
                  <span className="badge badge-blue" style={{ fontSize: '0.68rem', padding: '1px 7px' }}>
                    {dbSuppliersList.length} en base de datos
                  </span>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 2 }} />
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ paddingLeft: '36px', paddingRight: '40px' }}
                    placeholder="Buscar o escribir nombre del proveedor..."
                    value={newItemForm.supplier}
                    onFocus={() => {
                      setSupplierFilterQuery(newItemForm.supplier || '');
                      setSupplierComboboxOpen(true);
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewItemForm(prev => ({ ...prev, supplier: val }));
                      setSupplierFilterQuery(val);
                      setSupplierComboboxOpen(true);
                    }}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setSupplierComboboxOpen(prev => !prev)}
                    style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {supplierComboboxOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    backgroundColor: 'var(--bg-card-solid)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    marginTop: '4px',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}>
                    {filteredSuppliers.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSupplier(s)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid var(--border-subtle)',
                          fontSize: '0.82rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-input)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div>
                          <strong>{s.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.itemSupplied}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary-600)' }}>{s.leadTime}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseItemModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Guardar Cambios' : 'Guardar en Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CREAR / EDITAR PROVEEDOR                                         */}
      {/* ========================================================================= */}
      {isSupplierModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
              </h3>
              <button className="close-btn" onClick={handleCloseSupplierModal}>✕</button>
            </div>

            <form onSubmit={handleSaveSupplier}>
              <div className="form-group">
                <label className="form-label">Nombre del Proveedor / Empresa:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Acrílicos y Diseños Perú (Lima)"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Material / Insumo Suministrado:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Displays de Mesa en L acrílico cristal 2mm"
                  value={supplierForm.itemSupplied}
                  onChange={(e) => setSupplierForm({ ...supplierForm, itemSupplied: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tiempo de Entrega (Días):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="number" 
                      min="1"
                      className="form-control"
                      placeholder="Mín (ej: 3)"
                      value={supplierForm.leadTimeMin}
                      onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeMin: e.target.value })}
                      required
                    />
                    <span style={{ color: 'var(--text-muted)' }}>a</span>
                    <input 
                      type="number" 
                      min="1"
                      className="form-control"
                      placeholder="Máx (ej: 5)"
                      value={supplierForm.leadTimeMax}
                      onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeMax: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Costo Unitario Promedio:</label>
                  <div style={{ display: 'flex' }}>
                    <select 
                      className="form-control"
                      style={{ width: '85px', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' }}
                      value={supplierForm.costCurrency}
                      onChange={(e) => setSupplierForm({ ...supplierForm, costCurrency: e.target.value })}
                    >
                      <option value="S/">S/</option>
                      <option value="$">$</option>
                    </select>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-control"
                      style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}
                      value={supplierForm.unitCostValue}
                      onChange={(e) => setSupplierForm({ ...supplierForm, unitCostValue: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pedido Mínimo:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="number" 
                      min="1"
                      className="form-control"
                      style={{ width: '100px' }}
                      value={supplierForm.minOrderQty}
                      onChange={(e) => setSupplierForm({ ...supplierForm, minOrderQty: e.target.value })}
                      required
                    />
                    <select 
                      className="form-control"
                      value={supplierForm.minOrderUnit}
                      onChange={(e) => setSupplierForm({ ...supplierForm, minOrderUnit: e.target.value })}
                    >
                      <option value="unidades">Unidades (uds)</option>
                      <option value="millares">Millares</option>
                      <option value="paquetes">Paquetes</option>
                      <option value="piezas">Piezas</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confiabilidad:</label>
                  <select 
                    className="form-control"
                    value={supplierForm.reliability}
                    onChange={(e) => setSupplierForm({ ...supplierForm, reliability: e.target.value })}
                  >
                    <option value="⭐⭐⭐⭐⭐ (Excelente)">⭐⭐⭐⭐⭐ (Excelente)</option>
                    <option value="⭐⭐⭐⭐ (Alta)">⭐⭐⭐⭐ (Alta)</option>
                    <option value="⭐⭐⭐ (Media)">⭐⭐⭐ (Media)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contacto (WhatsApp / Teléfono / Correo):</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: +51 981 234 567 (Atención taller)"
                  value={supplierForm.contact}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas Logísticas:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseSupplierModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
