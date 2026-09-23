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
  const dbSuppliersList = useMemo(() => {
    const map = new Map();
    // 1. Proveedores oficiales registrados en el Directorio
    suppliers.forEach(s => {
      if (s && s.name && s.name.trim()) {
        const key = s.name.trim().toLowerCase();
        map.set(key, {
          id: s.id,
          name: s.name.trim(),
          itemSupplied: s.itemSupplied || s.category || 'Insumos varios',
          leadTime: s.leadTime || (s.leadTimeDays ? `${s.leadTimeDays} días` : 'Entrega estándar'),
          leadTimeDays: s.leadTimeDays || parseSupplierDays(s.leadTime) || 15,
          unitCostAvg: s.unitCostAvg || '',
          reliability: s.reliability || '⭐⭐⭐⭐⭐ (Excelente)',
          contact: s.contact || s.phone || '',
          notes: s.notes || '',
          isRegistered: true
        });
      }
    });

    // 2. Proveedores registrados previamente en ítems de inventario que aún no estén en el directorio
    inventory.forEach(inv => {
      if (inv && inv.supplier && inv.supplier.trim()) {
        const key = inv.supplier.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: `inv-sup-${key}`,
            name: inv.supplier.trim(),
            itemSupplied: inv.category || 'Material de inventario',
            leadTime: inv.leadTimeDays ? `${inv.leadTimeDays} días` : 'Entrega estándar',
            leadTimeDays: inv.leadTimeDays || 15,
            unitCostAvg: inv.unitCost ? `S/ ${Number(inv.unitCost).toFixed(2)}` : '',
            reliability: 'Histórico en Inventario',
            contact: '',
            notes: '',
            isRegistered: false
          });
        }
      }
    });

    return Array.from(map.values());
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

  // Estados para el Combobox de Proveedor
  const [supplierComboboxOpen, setSupplierComboboxOpen] = useState(false);
  const [supplierFilterQuery, setSupplierFilterQuery] = useState('');
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

  // Proveedor verificado exacto en la base de datos si ya coincide
  const matchedSupplier = useMemo(() => {
    if (!newItemForm.supplier || !newItemForm.supplier.trim()) return null;
    return dbSuppliersList.find(s => s.name.toLowerCase() === newItemForm.supplier.trim().toLowerCase());
  }, [dbSuppliersList, newItemForm.supplier]);

  const handleSelectSupplier = (sup) => {
    const leadDays = sup.leadTimeDays || parseSupplierDays(sup.leadTime) || 15;
    setNewItemForm(prev => ({
      ...prev,
      supplier: sup.name,
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

    setNewItemForm(prev => ({
      ...prev,
      sku: generateRandomSku('SKU-LNK'),
      name: '',
      quantity: 50,
      minThreshold: 20,
      unitCost: 4.00,
      supplier: defaultSupName,
      leadTimeDays: defaultLeadDays,
      reorderUrl: '',
      notes: ''
    }));
    setSupplierFilterQuery(defaultSupName);
    setSupplierComboboxOpen(false);
    setIsNewItemModalOpen(true);
  };

  // Estado para Crear / Editar Proveedores
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    itemSupplied: '',
    leadTime: '3 - 5 días',
    unitCostAvg: 'S/ 8.00',
    minOrder: '20 unidades',
    contact: '',
    reliability: '⭐⭐⭐⭐⭐ (Excelente)',
    notes: ''
  });

  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      itemSupplied: '',
      leadTime: '3 - 5 días',
      unitCostAvg: 'S/ 8.00',
      minOrder: '20 unidades',
      contact: '',
      reliability: '⭐⭐⭐⭐⭐ (Excelente)',
      notes: ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup) => {
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name || '',
      itemSupplied: sup.itemSupplied || '',
      leadTime: sup.leadTime || '',
      unitCostAvg: sup.unitCostAvg || '',
      minOrder: sup.minOrder || '',
      contact: sup.contact || '',
      reliability: sup.reliability || '⭐⭐⭐⭐⭐ (Excelente)',
      notes: sup.notes || ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e) => {
    e.preventDefault();
    if (editingSupplier) {
      if (onEditSupplier) {
        onEditSupplier({
          ...editingSupplier,
          ...supplierForm
        });
      }
    } else {
      const newSup = {
        id: `sup-${Date.now()}`,
        ...supplierForm
      };
      if (onAddNewSupplier) {
        onAddNewSupplier(newSup);
      }
      // Si el modal de nuevo ítem está abierto, vincular de inmediato este nuevo proveedor
      if (isNewItemModalOpen) {
        const leadDays = parseSupplierDays(newSup.leadTime) || 15;
        setNewItemForm(prev => ({
          ...prev,
          supplier: newSup.name,
          leadTimeDays: leadDays
        }));
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
                      onClick={() => setSupplierComboboxOpen(prev => !prev)}
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

                {/* Menú Desplegable Flotante del Combobox */}
                {supplierComboboxOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45), 0 4px 10px rgba(0, 0, 0, 0.25)',
                      zIndex: 100,
                      maxHeight: '270px',
                      overflowY: 'auto',
                      padding: '6px'
                    }}
                  >
                    {/* Encabezado del Dropdown */}
                    <div 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '6px 8px 8px 8px', 
                        borderBottom: '1px solid var(--border-subtle)',
                        marginBottom: '6px' 
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Proveedores en Base ({filteredSuppliers.length})
                      </span>
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
                          background: 'rgba(0, 102, 255, 0.12)',
                          border: '1px solid rgba(0, 102, 255, 0.3)',
                          color: 'var(--primary-600)',
                          borderRadius: '4px',
                          padding: '2px 8px',
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
                        const isSelected = newItemForm.supplier.trim().toLowerCase() === sup.name.trim().toLowerCase();
                        return (
                          <div
                            key={sup.id || sup.name}
                            onClick={() => handleSelectSupplier(sup)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'rgba(0, 102, 255, 0.15)' : 'transparent',
                              border: isSelected ? '1px solid rgba(0, 102, 255, 0.3)' : '1px solid transparent',
                              transition: 'background-color 0.15s',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '3px',
                              marginBottom: '3px'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '0.84rem', color: isSelected ? 'var(--primary-600)' : 'var(--text-main)' }}>
                                  {sup.name}
                                </strong>
                                {sup.isRegistered ? (
                                  <span className="badge badge-blue" style={{ fontSize: '0.66rem', padding: '1px 5px' }}>
                                    Directorio
                                  </span>
                                ) : (
                                  <span className="badge badge-purple" style={{ fontSize: '0.66rem', padding: '1px 5px' }}>
                                    Inventario
                                  </span>
                                )}
                              </div>
                              {isSelected && <Check size={14} color="var(--primary-600)" />}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              <span>📦 {sup.itemSupplied}</span>
                              <span>⏱️ {sup.leadTime}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '14px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.80rem' }}>
                          No hay proveedor con "<strong>{newItemForm.supplier}</strong>" en la base.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSupplierComboboxOpen(false)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.74rem', padding: '3px 8px', margin: '0 auto' }}
                        >
                          ✓ Usar "{newItemForm.supplier}" de forma manual
                        </button>
                      </div>
                    )}

                    {/* Footer de Ayuda */}
                    <div 
                      style={{ 
                        borderTop: '1px solid var(--border-subtle)', 
                        paddingTop: '6px', 
                        marginTop: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        padding: '4px 6px 2px 6px'
                      }}
                    >
                      <span>💡 Selecciona un proveedor o escribe uno manual.</span>
                      <button
                        type="button"
                        onClick={() => setSupplierComboboxOpen(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--primary-600)',
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
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej: 3 - 5 días"
                    value={supplierForm.leadTime}
                    onChange={(e) => setSupplierForm({ ...supplierForm, leadTime: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Costo Unitario Promedio:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej: S/ 8.00 - S/ 9.00"
                    value={supplierForm.unitCostAvg}
                    onChange={(e) => setSupplierForm({ ...supplierForm, unitCostAvg: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pedido Mínimo:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej: 20 unidades"
                    value={supplierForm.minOrder}
                    onChange={(e) => setSupplierForm({ ...supplierForm, minOrder: e.target.value })}
                  />
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
