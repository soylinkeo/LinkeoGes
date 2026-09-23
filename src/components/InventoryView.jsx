import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Truck, 
  ExternalLink, 
  CheckCircle, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Package, 
  Layers, 
  Trash2, 
  Edit,
  Shuffle,
  RefreshCw,
  Sparkles,
  Search,
  ChevronDown,
  Check,
  X,
  Building2
} from 'lucide-react';
import { generateRandomSku } from '../utils/skuUtils';

// Función para parsear días de cadenas tipo "18 días", "3 - 5 días", etc.
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

// Helpers para parsear y formatear campos estructurados de proveedores
const parseLeadTimeFields = (leadTimeStr) => {
  if (!leadTimeStr) return { min: '3', max: '5' };
  const str = String(leadTimeStr).trim();
  const rangeMatch = str.match(/(\d+)\s*[-–a]\s*(\d+)/i);
  if (rangeMatch) {
    return { min: rangeMatch[1], max: rangeMatch[2] };
  }
  const singleMatch = str.match(/(\d+)/);
  if (singleMatch) {
    return { min: singleMatch[1], max: '' };
  }
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

  if (matchedUnit) {
    return { qty, unit: matchedUnit, customUnit: '' };
  }
  if (rest) {
    return { qty, unit: 'otro', customUnit: rest };
  }
  return { qty, unit: 'unidades', customUnit: '' };
};

export default function InventoryView({
  inventory = [],
  suppliers = [],
  onUpdateInventoryStock,
  onAddNewInventoryItem,
  onAddNewSupplier,
  onEditSupplier,
  onOpenNewExpense,
  onRequestDelete
}) {
  // Consolidar lista única de proveedores de la base de datos (Directorio + Histórico de Inventario)
  // Consolidar lista de proveedores de la base de datos (Directorio oficial + Histórico de Inventario)
  // Soporta múltiples insumos/categorías del mismo proveedor empresarial preservando su identidad única
  const dbSuppliersList = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. Proveedores oficiales registrados en el Directorio
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

    // 2. Proveedores registrados previamente en ítems de inventario que aún no estén en el directorio
    const directoryNames = new Set(suppliers.filter(s => s && s.name).map(s => s.name.trim().toLowerCase()));
    const seenInvSuppliers = new Set();

    inventory.forEach(inv => {
      if (inv && inv.supplier && inv.supplier.trim()) {
        const normName = inv.supplier.trim().toLowerCase();
        // Solo agregar de inventario si no existe ya en el Directorio oficial
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

  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
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

  // Estados para el Combobox de Proveedor con tracking de ID específico
  const [supplierComboboxOpen, setSupplierComboboxOpen] = useState(false);
  const [supplierFilterQuery, setSupplierFilterQuery] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const comboboxRef = useRef(null);

  // Cerrar menú al hacer clic fuera del combobox
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
        setSupplierComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado reactivo de proveedores
  const filteredSuppliers = useMemo(() => {
    const query = (supplierFilterQuery || '').trim().toLowerCase();
    if (!query) return dbSuppliersList;
    return dbSuppliersList.filter(s => 
      s.name.toLowerCase().includes(query) ||
      (s.itemSupplied && s.itemSupplied.toLowerCase().includes(query)) ||
      (s.reliability && s.reliability.toLowerCase().includes(query))
    );
  }, [dbSuppliersList, supplierFilterQuery]);

  // Proveedor verificado exacto en la base de datos (prioriza coincidencia por ID específico de insumo)
  const matchedSupplier = useMemo(() => {
    if (selectedSupplierId) {
      const byId = dbSuppliersList.find(s => s.id === selectedSupplierId);
      if (byId) return byId;
    }
    if (!newItemForm.supplier || !newItemForm.supplier.trim()) return null;
    return dbSuppliersList.find(s => s.name.toLowerCase() === newItemForm.supplier.trim().toLowerCase());
  }, [dbSuppliersList, newItemForm.supplier, selectedSupplierId]);

  const handleSelectSupplier = (sup) => {
    setSelectedSupplierId(sup.id);
    const leadDays = sup.leadTimeDays || parseSupplierDays(sup.leadTime) || 15;
    const parsedCost = parseCostFields(sup.unitCostAvg);
    const autoCost = parsedCost && !isNaN(parseFloat(parsedCost.value)) ? parseFloat(parsedCost.value) : null;

    setNewItemForm(prev => ({
      ...prev,
      supplier: sup.name,
      // Si el nombre del insumo no se ha definido, sugerir el producto suministrado por este proveedor
      name: !prev.name.trim() ? sup.itemSupplied : prev.name,
      unitCost: autoCost !== null && (!prev.unitCost || prev.unitCost === 4.00) ? autoCost : prev.unitCost,
      leadTimeDays: leadDays,
      reorderUrl: prev.reorderUrl || (sup.notes && sup.notes.startsWith('http') ? sup.notes : prev.reorderUrl)
    }));
    setSupplierFilterQuery(sup.name);
    setSupplierComboboxOpen(false);
  };

  const handleOpenNewItemModal = () => {
    const defaultSup = dbSuppliersList.length > 0 ? dbSuppliersList[0] : null;
    const defaultSupName = defaultSup ? defaultSup.name : '';
    const defaultLeadDays = defaultSup ? (defaultSup.leadTimeDays || 15) : 15;
    const defaultSupId = defaultSup ? defaultSup.id : null;

    setSelectedSupplierId(defaultSupId);
    setNewItemForm({
      sku: generateRandomSku('SKU-LNK'),
      name: '',
      category: 'Chips / Insumos',
      quantity: 50,
      minThreshold: 20,
      unitCost: 4.00,
      supplier: defaultSupName,
      leadTimeDays: defaultLeadDays,
      reorderUrl: '',
      notes: ''
    });
    setSupplierFilterQuery(defaultSupName);
    setSupplierComboboxOpen(false);
    setIsNewItemModalOpen(true);
  };

  // Estado para Crear / Editar Proveedores con formato numérico y tipado estricto
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
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

    // 1. Formatear Tiempo Estimado de Entrega (solo números contabilizables)
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

    // 2. Formatear Costo Unitario Promedio (con moneda garantizada y valor numérico)
    const costVal = parseFloat(supplierForm.unitCostValue);
    const formattedCost = !isNaN(costVal)
      ? `${supplierForm.costCurrency} ${costVal.toFixed(2)}`
      : `${supplierForm.costCurrency} 0.00`;

    // 3. Formatear Pedido Mínimo (cantidad numérica + tipo de unidad)
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
      if (onEditSupplier) {
        onEditSupplier({
          ...editingSupplier,
          ...supplierPayload
        });
      }
    } else {
      const newSup = {
        id: `sup-${Date.now()}`,
        ...supplierPayload
      };
      if (onAddNewSupplier) {
        onAddNewSupplier(newSup);
      }
      // Si el modal de nuevo ítem está abierto, vincular de inmediato este nuevo proveedor
      if (isNewItemModalOpen) {
        setNewItemForm(prev => ({
          ...prev,
          supplier: newSup.name,
          name: !prev.name.trim() ? newSup.itemSupplied : prev.name,
          leadTimeDays: avgDays
        }));
        setSelectedSupplierId(newSup.id);
        setSupplierFilterQuery(newSup.name);
      }
    }
    setIsSupplierModalOpen(false);
  };

  // Identificar items en stock crítico (< threshold)
  const lowStockItems = inventory.filter(i => i.quantity <= i.minThreshold);
  const totalStockUnits = inventory.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const totalStockValue = inventory.reduce((acc, i) => acc + ((Number(i.quantity) || 0) * (Number(i.unitCost) || 0)), 0);

  const handleAdjustStock = (itemId, delta) => {
    onUpdateInventoryStock(itemId, delta);
  };

  const handleCreateItem = (e) => {
    e.preventDefault();
    const finalSku = (newItemForm.sku && newItemForm.sku.trim()) || generateRandomSku('SKU-LNK');
    const item = {
      id: `inv-${Date.now()}`,
      sku: finalSku,
      name: newItemForm.name,
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
    setIsNewItemModalOpen(false);
    setNewItemForm({
      sku: generateRandomSku('SKU-LNK'),
      name: '',
      category: 'Chips / Insumos',
      quantity: 50,
      minThreshold: 20,
      unitCost: 4.00,
      supplier: 'AliExpress Official RFID Store',
      leadTimeDays: 18,
      reorderUrl: '',
      notes: ''
    });
  };

  return (
    <div className="inventory-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: 'rgba(0, 102, 255, 0.12)', padding: '8px', borderRadius: 'var(--radius-md)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={24} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
              Control de Inventario & Alertas de Proveedores
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
            Stock diferenciado de insumos vírgenes, acrílicos, empaques y tiempos de importación de AliExpress.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onOpenNewExpense}>
            <DollarSign size={16} />
            <span>Registrar Compra / Gasto</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenNewItemModal}>
            <Plus size={16} />
            <span>Agregar Insumo / SKU</span>
          </button>
        </div>
      </div>

      {/* Banner de Alerta Crítica si hay Stock Bajo */}
      {lowStockItems.length > 0 && (
        <div 
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AlertTriangle size={32} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                ⚠️ Alerta de Quiebre de Stock: {lowStockItems[0].name}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                Stock actual: <strong style={{ color: '#f59e0b' }}>{lowStockItems[0].quantity} unidades</strong> (Umbral mínimo de reposición: {lowStockItems[0].minThreshold} uds).
                Considerando los <strong>15 a 18 días hábiles</strong> de transporte desde China vía AliExpress, se debe emitir orden para evitar desabastecimiento.
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

      {/* Métricas de Inventario */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Unidades en Almacén</span>
            <div className="kpi-icon-wrapper">
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-value">{totalStockUnits} uds</div>
          <div className="kpi-subtext">Sumatoria de todos los SKUs físicos</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-header">
            <span className="kpi-label">Valor Total en Stock</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value">S/ {totalStockValue.toFixed(2)}</div>
          <div className="kpi-subtext">Valorizado a costo unitario de compra</div>
        </div>

        <div className="kpi-card kpi-yellow">
          <div className="kpi-header">
            <span className="kpi-label">Alertas Activas</span>
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

      {/* Tabla de Stock por Insumo */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Layers size={18} color="var(--primary-600)" />
            <span>Detalle de Insumos y Materiales</span>
          </h3>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre del Material</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Mínimo Alerta</th>
                <th>Costo Unit. (S/)</th>
                <th>Proveedor</th>
                <th>Días Envío</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Ajuste & Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const isLow = item.quantity <= item.minThreshold;
                return (
                  <tr key={item.id}>
                    <td><span className="code-mono">{item.sku}</span></td>
                    <td>
                      <strong style={{ fontSize: '0.9rem' }}>{item.name}</strong>
                      {item.notes && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-blue">{item.category}</span></td>
                    <td style={{ fontWeight: 800, fontSize: '1rem', color: isLow ? '#f59e0b' : 'var(--text-main)' }}>
                      {item.quantity} uds
                    </td>
                    <td>{item.minThreshold} uds</td>
                    <td>S/ {Number(item.unitCost).toFixed(2)}</td>
                    <td>{item.supplier}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                        <Clock size={12} /> {item.leadTimeDays} días
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isLow ? 'badge-yellow' : 'badge-green'}`}>
                        {isLow ? '⚠️ Stock Bajo' : '✓ Óptimo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button 
                          className="btn-icon" 
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => handleAdjustStock(item.id, -1)}
                          title="Restar 1 unidad (ej. por venta o prueba)"
                        >
                          <Minus size={13} />
                        </button>
                        <button 
                          className="btn-icon" 
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => handleAdjustStock(item.id, 1)}
                          title="Sumar 1 unidad"
                        >
                          <Plus size={13} />
                        </button>
                        <button 
                          className="btn-icon" 
                          style={{ width: '28px', height: '28px', color: '#ef4444', marginLeft: '4px' }}
                          onClick={() => onRequestDelete && onRequestDelete(item, 'Insumo')}
                          title="Eliminar insumo del inventario (con auditoría)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Directorio de Proveedores y Logística */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              <Truck size={18} color="var(--primary-600)" />
              <span>Directorio de Proveedores y Logística de Reabastecimiento</span>
            </h3>
            <span className="badge badge-blue">{suppliers.length} Proveedores Validados</span>
          </div>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleOpenAddSupplier}
            title="Registrar nuevo proveedor de insumos"
          >
            <Plus size={14} />
            <span>Agregar Proveedor</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
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
                    <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{sup.name}</h4>
                    <span style={{ fontSize: '0.8rem' }}>{sup.reliability}</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    📦 <strong>Suministra:</strong> {sup.itemSupplied}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                    <div>⏱️ <strong>Tiempo estimado:</strong> {sup.leadTime}</div>
                    <div>💰 <strong>Costo estimado:</strong> {sup.unitCostAvg}</div>
                    <div>📦 <strong>Pedido mínimo:</strong> {sup.minOrder}</div>
                    <div>📞 <strong>Contacto:</strong> {sup.contact}</div>
                  </div>

                  {sup.notes && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                      💡 {sup.notes}
                    </p>
                  )}
                </div>

                {/* Acciones de Edición y Eliminación Auditada */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 10px', fontSize: '0.76rem', gap: '4px' }}
                    onClick={() => handleOpenEditSupplier(sup)}
                    title="Editar información de proveedor"
                  >
                    <Edit size={12} />
                    <span>Editar</span>
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 10px', fontSize: '0.76rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', gap: '4px' }}
                    onClick={() => onRequestDelete && onRequestDelete(sup, 'Proveedor')}
                    title="Eliminar proveedor (Auditoría obligatoria)"
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

      {/* MODAL: Nuevo SKU / Insumo */}
      {isNewItemModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewItemModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Insumo o Producto a Inventario</h3>
              <button className="close-btn" onClick={() => setIsNewItemModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateItem}>
              <div className="form-group">
                <label className="form-label">Nombre del Insumo / Producto:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Displays de mesa en L acrílico cristal"
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
                      style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                      onClick={() => setNewItemForm(prev => ({ ...prev, sku: generateRandomSku('SKU-LNK') }))}
                      title="Generar otro código SKU aleatorio"
                    >
                      <Shuffle size={12} />
                      <span>🎲 Generar Aleatorio</span>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text" 
                      className="form-control code-mono"
                      placeholder="SKU-LNK-XXXX"
                      value={newItemForm.sku}
                      onChange={(e) => setNewItemForm({ ...newItemForm, sku: e.target.value })}
                      required
                    />
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => setNewItemForm(prev => ({ ...prev, sku: generateRandomSku('SKU-LNK') }))}
                      title="Regenerar SKU aleatorio"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                    ✓ Generado automáticamente de forma aleatoria. Puedes editarlo o pulsar el botón para otro código.
                  </span>
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
                  <label className="form-label">Cantidad Inicial (Stock):</label>
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

              {/* Proveedor Principal con Combobox Inteligente y Búsqueda en Base de Datos */}
              <div className="form-group" ref={comboboxRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Proveedor Principal:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-blue" style={{ fontSize: '0.68rem', padding: '1px 7px' }}>
                      {dbSuppliersList.length} en base de datos
                    </span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setSupplierForm(prev => ({
                          ...prev,
                          name: newItemForm.supplier || '',
                          itemSupplied: newItemForm.name || newItemForm.category || ''
                        }));
                        setIsSupplierModalOpen(true);
                      }}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--primary-600)', 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        cursor: 'pointer', 
                        padding: 0, 
                        textDecoration: 'underline' 
                      }}
                      title="Registrar un nuevo proveedor formal en el directorio"
                    >
                      + Registrar en Directorio
                    </button>
                  </div>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      color: 'var(--text-muted)', 
                      pointerEvents: 'none',
                      zIndex: 2
                    }} 
                  />
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ paddingLeft: '36px', paddingRight: '64px' }}
                    placeholder={dbSuppliersList.length > 0 ? "Buscar proveedor en base de datos o escribir..." : "Escribir nombre del proveedor..."}
                    value={newItemForm.supplier}
                    onFocus={() => {
                      setSupplierFilterQuery(newItemForm.supplier || '');
                      setSupplierComboboxOpen(true);
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewItemForm(prev => ({ ...prev, supplier: val }));
                      setSupplierFilterQuery(val);
                      setSelectedSupplierId(null);
                      setSupplierComboboxOpen(true);
                    }}
                    autoComplete="off"
                  />
                  <div style={{ position: 'absolute', right: '8px', display: 'flex', alignItems: 'center', gap: '2px', zIndex: 2 }}>
                    {newItemForm.supplier && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewItemForm(prev => ({ ...prev, supplier: '' }));
                          setSelectedSupplierId(null);
                          setSupplierFilterQuery('');
                          setSupplierComboboxOpen(true);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Limpiar campo"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierComboboxOpen(prev => {
                          const next = !prev;
                          if (next) {
                            setSupplierFilterQuery(newItemForm.supplier || '');
                          }
                          return next;
                        });
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Desplegar lista de proveedores"
                    >
                      <ChevronDown 
                        size={16} 
                        style={{ 
                          transform: supplierComboboxOpen ? 'rotate(180deg)' : 'none', 
                          transition: 'transform 0.2s ease' 
                        }} 
                      />
                    </button>
                  </div>
                </div>

                {/* Menú Desplegable Flotante del Combobox - 100% Sólido y Opaco */}
                {supplierComboboxOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      backgroundColor: '#0c1322',
                      backgroundImage: 'linear-gradient(180deg, #111a33 0%, #0c1322 100%)',
                      border: '1px solid #1e3a8a',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 20px 45px -5px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.12)',
                      zIndex: 1050,
                      maxHeight: '280px',
                      overflowY: 'auto',
                      padding: '6px',
                      opacity: 1
                    }}
                  >
                    {/* Encabezado del Dropdown */}
                    <div 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '8px 10px', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: '#0c1322',
                        marginBottom: '6px',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Proveedores en Base ({filteredSuppliers.length})
                        </span>
                        {supplierFilterQuery && filteredSuppliers.length < dbSuppliersList.length && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSupplierFilterQuery('');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#60a5fa',
                              fontSize: '0.70rem',
                              cursor: 'pointer',
                              padding: 0,
                              textDecoration: 'underline'
                            }}
                          >
                            Ver todos ({dbSuppliersList.length})
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSupplierComboboxOpen(false);
                          setSupplierForm(prev => ({
                            ...prev,
                            name: newItemForm.supplier || '',
                            itemSupplied: newItemForm.name || newItemForm.category || ''
                          }));
                          setIsSupplierModalOpen(true);
                        }}
                        style={{
                          background: 'rgba(0, 102, 255, 0.15)',
                          border: '1px solid rgba(0, 102, 255, 0.4)',
                          color: '#60a5fa',
                          borderRadius: '4px',
                          padding: '3px 9px',
                          fontSize: '0.70rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        + Registrar Nuevo
                      </button>
                    </div>

                    {/* Lista de Opciones */}
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map(sup => {
                        const isSelected = selectedSupplierId 
                          ? sup.id === selectedSupplierId 
                          : (matchedSupplier && matchedSupplier.id === sup.id);

                        return (
                          <div
                            key={sup.id}
                            onClick={() => handleSelectSupplier(sup)}
                            style={{
                              padding: '9px 12px',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'rgba(0, 102, 255, 0.28)' : '#101a2f',
                              border: isSelected ? '1px solid #0066ff' : '1px solid rgba(255, 255, 255, 0.08)',
                              boxShadow: isSelected ? '0 0 10px rgba(0, 102, 255, 0.2)' : 'none',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              marginBottom: '5px'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#182746';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#101a2f';
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '0.86rem', color: isSelected ? '#60a5fa' : 'var(--text-main)' }}>
                                  {sup.name}
                                </strong>
                                {sup.isRegistered ? (
                                  <span className="badge badge-blue" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                                    Directorio
                                  </span>
                                ) : (
                                  <span className="badge badge-purple" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                                    Inventario
                                  </span>
                                )}
                              </div>
                              {isSelected && <Check size={16} color="#60a5fa" />}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#38bdf8' }}>
                              <span>📦 <strong>Suministra:</strong> {sup.itemSupplied}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              <span>⏱️ {sup.leadTime}</span>
                              <span>{sup.reliability}</span>
                              {sup.unitCostAvg && <span>💰 {sup.unitCostAvg}</span>}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#101a2f', borderRadius: 'var(--radius-sm)' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem' }}>
                          No hay proveedor con "<strong>{supplierFilterQuery || newItemForm.supplier}</strong>" en la base.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSupplierComboboxOpen(false)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.74rem', padding: '4px 10px', margin: '0 auto' }}
                        >
                          ✓ Usar "{newItemForm.supplier}" de forma manual
                        </button>
                      </div>
                    )}

                    {/* Footer de Ayuda */}
                    <div 
                      style={{ 
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
                        padding: '8px 10px 4px 10px', 
                        marginTop: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        backgroundColor: '#0c1322',
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 2
                      }}
                    >
                      <span>💡 Selecciona un proveedor o escribe uno manual.</span>
                      <button
                        type="button"
                        onClick={() => setSupplierComboboxOpen(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#60a5fa',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.72rem'
                        }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}

                {/* Indicador de Estado del Proveedor Seleccionado */}
                {matchedSupplier ? (
                  <div 
                    style={{ 
                      marginTop: '6px', 
                      padding: '6px 10px', 
                      backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                      border: '1px solid rgba(16, 185, 129, 0.25)', 
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                      <CheckCircle size={13} />
                      <span>
                        <strong>Proveedor verificado en base:</strong> {matchedSupplier.name} ({matchedSupplier.itemSupplied}) • Reposición: {matchedSupplier.leadTime}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {matchedSupplier.reliability || 'Activo'}
                    </span>
                  </div>
                ) : newItemForm.supplier && newItemForm.supplier.trim() ? (
                  <div 
                    style={{ 
                      marginTop: '6px', 
                      padding: '6px 10px', 
                      backgroundColor: 'rgba(245, 158, 11, 0.08)', 
                      border: '1px solid rgba(245, 158, 11, 0.25)', 
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem'
                    }}
                  >
                    <span style={{ color: '#f59e0b' }}>
                      ℹ️ Proveedor manual no registrado aún en el directorio.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierForm(prev => ({
                          ...prev,
                          name: newItemForm.supplier,
                          itemSupplied: newItemForm.name || newItemForm.category || ''
                        }));
                        setIsSupplierModalOpen(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-600)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                        fontSize: '0.72rem'
                      }}
                    >
                      + Registrar en Directorio
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="form-group">
                <label className="form-label">Enlace de Recompra Rápida (URL):</label>
                <input 
                  type="url" 
                  className="form-control"
                  placeholder="https://aliexpress.com/..."
                  value={newItemForm.reorderUrl}
                  onChange={(e) => setNewItemForm({ ...newItemForm, reorderUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewItemModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar en Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear / Editar Proveedor */}
      {isSupplierModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSupplierModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
              </h3>
              <button className="close-btn" onClick={() => setIsSupplierModalOpen(false)}>✕</button>
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
                  <label className="form-label">Tiempo Estimado de Entrega:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="number" 
                        min="1"
                        step="1"
                        className="form-control"
                        placeholder="Mín (ej: 10)"
                        value={supplierForm.leadTimeMin}
                        onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeMin: e.target.value })}
                        required
                      />
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>a</span>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="number" 
                        min="1"
                        step="1"
                        className="form-control"
                        placeholder="Máx (ej: 15)"
                        value={supplierForm.leadTimeMax}
                        onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeMax: e.target.value })}
                      />
                    </div>
                    <span style={{ 
                      padding: '0 12px', 
                      height: '38px',
                      backgroundColor: 'var(--bg-input)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: 'var(--radius-sm)', 
                      color: 'var(--text-muted)', 
                      fontSize: '0.82rem', 
                      fontWeight: 600,
                      display: 'flex', 
                      alignItems: 'center' 
                    }}>
                      días
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                    ✓ Solo números: {supplierForm.leadTimeMin ? `${supplierForm.leadTimeMin}${supplierForm.leadTimeMax ? ` - ${supplierForm.leadTimeMax}` : ''} días` : 'Ingresa los días'}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Costo Unitario Promedio:</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <select 
                      className="form-control"
                      style={{ 
                        width: '100px', 
                        borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', 
                        borderRight: 'none',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-input)'
                      }}
                      value={supplierForm.costCurrency}
                      onChange={(e) => setSupplierForm({ ...supplierForm, costCurrency: e.target.value })}
                    >
                      <option value="S/">S/ (PEN)</option>
                      <option value="$">$ (USD)</option>
                    </select>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-control"
                      style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontWeight: 600 }}
                      placeholder="0.00"
                      value={supplierForm.unitCostValue}
                      onChange={(e) => setSupplierForm({ ...supplierForm, unitCostValue: e.target.value })}
                      required
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                    ✓ Restringido a moneda: {supplierForm.costCurrency} {Number(supplierForm.unitCostValue || 0).toFixed(2)} por unidad
                  </span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pedido Mínimo:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: '1 1 110px' }}>
                      <input 
                        type="number" 
                        min="1"
                        step="1"
                        className="form-control"
                        placeholder="Cantidad (ej: 15)"
                        value={supplierForm.minOrderQty}
                        onChange={(e) => setSupplierForm({ ...supplierForm, minOrderQty: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                      <select 
                        className="form-control"
                        value={supplierForm.minOrderUnit}
                        onChange={(e) => setSupplierForm({ ...supplierForm, minOrderUnit: e.target.value })}
                      >
                        <option value="unidades">📦 Unidades (uds)</option>
                        <option value="millares">🏢 Millares (1,000 uds)</option>
                        <option value="paquetes">🎁 Paquetes / Packs</option>
                        <option value="piezas">🧩 Piezas (pzs)</option>
                        <option value="cajas">📦 Cajas</option>
                        <option value="metros">📏 Metros (m)</option>
                        <option value="lotes">🏷️ Lotes</option>
                        <option value="otro">✍️ Otro tipo...</option>
                      </select>
                    </div>
                  </div>
                  {supplierForm.minOrderUnit === 'otro' && (
                    <input 
                      type="text"
                      className="form-control"
                      style={{ marginTop: '6px' }}
                      placeholder="Escribe el tipo de unidad (ej: rollos, sets, etc.)"
                      value={supplierForm.customMinOrderUnit}
                      onChange={(e) => setSupplierForm({ ...supplierForm, customMinOrderUnit: e.target.value })}
                      required
                    />
                  )}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                    ✓ Pedido mínimo: {supplierForm.minOrderQty || '0'} {supplierForm.minOrderUnit === 'otro' ? (supplierForm.customMinOrderUnit || '...') : supplierForm.minOrderUnit}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Calificación / Confiabilidad:</label>
                  <select 
                    className="form-control"
                    value={supplierForm.reliability}
                    onChange={(e) => setSupplierForm({ ...supplierForm, reliability: e.target.value })}
                  >
                    <option value="⭐⭐⭐⭐⭐ (Excelente)">⭐⭐⭐⭐⭐ (Excelente)</option>
                    <option value="⭐⭐⭐⭐ (Alta)">⭐⭐⭐⭐ (Alta)</option>
                    <option value="⭐⭐⭐ (Media)">⭐⭐⭐ (Media)</option>
                    <option value="⭐⭐ (Baja)">⭐⭐ (Baja)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contacto (Teléfono, WhatsApp, Correo o Chat):</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Sr. Víctor +51 981 234 567"
                  value={supplierForm.contact}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas Logísticas / Recomendaciones:</label>
                <textarea 
                  className="form-control"
                  rows={2}
                  placeholder="Ej: Pedir con anticipación para delivery a taller."
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSupplierModalOpen(false)}>
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
