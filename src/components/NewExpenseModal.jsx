import React, { useState } from 'react';
import { 
  Receipt, 
  Calendar, 
  Tag, 
  Package, 
  CreditCard, 
  Plus, 
  Minus, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Check, 
  Sparkles,
  User,
  ShoppingBag
} from 'lucide-react';
import { getAccountingMonth, localDate } from '../utils/dateUtils.js';

export const EXPENSE_PAYMENT_METHODS = [
  { id: 'Tarjeta', label: 'Tarjeta', icon: '💳', color: '#10b981' },
  { id: 'Transferencia', label: 'Transferencia', icon: '🏦', color: '#38bdf8' },
  { id: 'Yape', label: 'Yape', icon: '💜', color: '#8b5cf6' },
  { id: 'Plin', label: 'Plin', icon: '🔵', color: '#0066ff' },
  { id: 'Efectivo', label: 'Efectivo', icon: '💵', color: '#f59e0b' }
];

export const EXPENSE_CATEGORIES = [
  { id: 'Compra de mercadería', label: 'Compra de mercadería (Chips / Acrílicos)', icon: '📦', color: '#38bdf8' },
  { id: 'Publicidad', label: 'Publicidad y Pauta Digital', icon: '📢', color: '#ec4899' },
  { id: 'Movilidad', label: 'Movilidad / Visitas Comerciales', icon: '🚗', color: '#f59e0b' },
  { id: 'Teléfono/datos', label: 'Teléfono / Datos / Línea', icon: '📱', color: '#8b5cf6' },
  { id: 'Dominio/sistema', label: 'Dominio / Hosting / Software', icon: '🌐', color: '#06b6d4' },
  { id: 'Empaques y bolsas', label: 'Empaques, cajas y stickers', icon: '🛍️', color: '#10b981' },
  { id: 'Otro', label: 'Otro gasto operativo', icon: '🧾', color: '#94a3b8' }
];

export default function NewExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  expenseForm,
  setExpenseForm,
  products = [],
  inventory = [],
  currentUser,
  showToast,
  editingExpense = null,
  onReceiveExpenseStock = null
}) {
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  if (!isOpen) return null;

  // Productos del catálogo y artículos de inventario aptos para compra
  const catalogProducts = products.filter(p => p.category !== 'Pack' && p.type !== 'pack' && !p.bundleItems?.length);
  const inventoryItems = inventory.filter(i => !catalogProducts.some(p => p.name === i.name));

  const selectedId = expenseForm.selectedProductId || '';
  const currentProd = catalogProducts.find(p => p.id === selectedId || (selectedId && (p.sku === selectedId || p.inventoryId === selectedId))) 
    || inventoryItems.find(i => i.id === selectedId || (selectedId && i.sku === selectedId)) 
    || null;
  const isGeneralExpense = !selectedId;

  const defaultCost = currentProd 
    ? Number(currentProd.cost ?? currentProd.unitCost ?? 0) 
    : (Number(expenseForm.unitCost) || 0);
  const currentUnitCost = expenseForm.isCustomCost && expenseForm.unitCost !== ''
    ? Number(expenseForm.unitCost)
    : defaultCost;

  const qty = Number(expenseForm.quantity) || 1;
  const computedTotal = isGeneralExpense 
    ? (Number(expenseForm.amount) || 0).toFixed(2)
    : (currentUnitCost * qty).toFixed(2);

  // Filtrado de productos en picker
  const filteredCatalog = catalogProducts.filter(p => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
  });

  const filteredInventory = inventoryItems.filter(i => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (i.name || '').toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q);
  });

  const handleSelectProduct = (item) => {
    if (!item) {
      // Gasto general sin producto
      setExpenseForm(prev => ({
        ...prev,
        selectedProductId: '',
        unitCost: '',
        isCustomCost: false,
        inventoryStatus: null
      }));
      setIsProductPickerOpen(false);
      return;
    }

    const itemCost = Number(item.cost ?? item.unitCost ?? 0);
    const curQty = Number(expenseForm.quantity) || 1;
    const total = (itemCost * curQty).toFixed(2);

    setExpenseForm(prev => ({
      ...prev,
      selectedProductId: item.id,
      description: prev.description && prev.description !== 'Compra de mercadería' ? prev.description : item.name,
      category: 'Compra de mercadería',
      unitCost: itemCost.toString(),
      isCustomCost: false,
      amount: total,
      inventoryStatus: prev.inventoryStatus || 'pending'
    }));
    setIsProductPickerOpen(false);
  };

  const handleStepQuantity = (delta) => {
    const newQty = Math.max(1, qty + delta);
    const newAmount = !isGeneralExpense ? (currentUnitCost * newQty).toFixed(2) : expenseForm.amount;
    setExpenseForm(prev => ({
      ...prev,
      quantity: newQty,
      amount: newAmount
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isGeneralExpense) {
      expenseForm.amount = computedTotal;
    }
    if (onSubmit) {
      onSubmit(e);
    }
  };

  const isPendingMerchandise = editingExpense && editingExpense.inventoryStatus === 'pending';

  return (
    <div className="modal-overlay">
      <div className="modal-content sale-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        {/* Cabecera Ejecutiva */}
        <div className="sale-modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.25)' }}>
          <div className="sale-modal-header-left">
            <div className="sale-modal-icon-badge" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}>
              <Receipt size={22} />
            </div>
            <div>
              <h3 className="sale-modal-title">
                {editingExpense ? 'Modificar Registro de Gasto / Compra' : 'Registrar Nuevo Gasto Operativo'}
              </h3>
              <p className="sale-modal-subtitle">
                Reposición de mercadería física en almacén, flujo de egresos y balance 50/50 entre socios
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Banner de Acción Rápida si la mercadería está Pendiente */}
        {isPendingMerchandise && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(16, 185, 129, 0.12))',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 800, fontSize: '0.84rem' }}>
                <Clock size={16} />
                <span>Mercadería Pendiente de Ingreso a Almacén</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Al dar OK, se sumarán las <strong>{editingExpense.quantity || 1} unidades</strong> directamente al stock real.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-success btn-sm"
              style={{ fontWeight: 800, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px' }}
              onClick={() => {
                if (onReceiveExpenseStock) {
                  onReceiveExpenseStock(editingExpense.id);
                  onClose();
                }
              }}
            >
              <Check size={14} />
              <span>Dar OK e Ingresar Stock</span>
            </button>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="sale-modal-body">
          {/* SECCIÓN 1: Datos del Desembolso & Concepto */}
          <div className="sale-section-group">
            <div className="sale-section-title">
              <Calendar size={14} color="#38bdf8" />
              <span>1. Datos del Desembolso y Categoría</span>
            </div>

            <div className="sale-inputs-grid">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  Fecha del Desembolso: <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <div className="sale-input-wrapper">
                  <Calendar size={14} className="sale-input-icon" />
                  <input 
                    type="date" 
                    className="sale-custom-input"
                    value={expenseForm.date}
                    onChange={e => {
                      const newDate = e.target.value;
                      setExpenseForm({
                        ...expenseForm,
                        date: newDate,
                        month: getAccountingMonth(newDate)
                      });
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  Categoría del Gasto: <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select 
                  className="form-control"
                  style={{ fontSize: '0.82rem', height: '38px', borderRadius: '10px' }}
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  Concepto / Proveedor / Descripción: <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <div className="sale-input-wrapper">
                  <Tag size={14} className="sale-input-icon" />
                  <input 
                    type="text" 
                    className="sale-custom-input"
                    placeholder="Ej: Lote 100 Chips NTAG215 Temu, Pauta Meta Ads, Movilidad Surco..."
                    value={expenseForm.description}
                    onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Selección de Producto o Gasto General */}
          <div className="sale-section-group">
            <div className="sale-section-title">
              <Package size={14} color="#a855f7" />
              <span>2. Selección de Producto / Insumo de Almacén</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Producto o Insumo a Comprar / Reponer:</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Clic para cambiar o seleccionar</span>
                </label>

                {/* Tarjeta de Producto Activo */}
                <div 
                  className={`sale-active-product-card ${isProductPickerOpen ? 'active-open' : ''}`}
                  onClick={() => setIsProductPickerOpen(!isProductPickerOpen)}
                  title="Clic para desplegar el catálogo de productos disponibles"
                >
                  <div className="sale-product-card-left">
                    <div className="sale-product-icon-box" style={{ background: isGeneralExpense ? 'rgba(148, 163, 184, 0.15)' : 'rgba(0, 102, 255, 0.15)', borderColor: isGeneralExpense ? 'rgba(148, 163, 184, 0.3)' : 'rgba(0, 102, 255, 0.3)' }}>
                      {isGeneralExpense ? <Receipt size={18} color="#94a3b8" /> : <Package size={18} />}
                    </div>
                    <div>
                      <div className="sale-product-card-name">
                        {isGeneralExpense ? 'Gasto General Libre (Sin ingreso a almacén)' : currentProd?.name}
                      </div>
                      <div className="sale-product-card-meta">
                        {isGeneralExpense ? (
                          <span>Servicios, publicidad, movilidad, etc.</span>
                        ) : (
                          <>
                            <span>SKU: {currentProd?.sku || 'N/A'}</span>
                            <span>•</span>
                            <span>Costo ref: S/ {defaultCost.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sale-product-card-right">
                    {!isGeneralExpense && (
                      <span className="sale-stock-pill in" style={{ fontSize: '0.7rem' }}>
                        📦 En almacén: {Number(currentProd?.stock ?? currentProd?.quantity ?? 0)} uds
                      </span>
                    )}
                    <span className="sale-chevron" style={{ transform: isProductPickerOpen ? 'rotate(180deg)' : 'none' }}>
                      <ChevronDown size={16} />
                    </span>
                  </div>
                </div>

                {/* Dropdown Menu Flotante con Buscador */}
                {isProductPickerOpen && (
                  <div className="sale-product-dropdown-menu">
                    <div className="sale-product-search-box">
                      <input 
                        type="text" 
                        placeholder="Buscar producto o insumo por nombre o SKU..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="sale-product-list">
                      {/* Opción 1: Gasto general sin producto */}
                      <div 
                        className={`sale-product-item ${isGeneralExpense ? 'selected' : ''}`}
                        onClick={() => handleSelectProduct(null)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="sale-item-icon">🧾</span>
                          <div>
                            <div className="sale-item-name">Gasto General Libre</div>
                            <div className="sale-item-sub">Sin movimiento de stock en almacén</div>
                          </div>
                        </div>
                        {isGeneralExpense && <Check size={14} color="#0066ff" />}
                      </div>

                      {/* Productos del catálogo */}
                      {filteredCatalog.length > 0 && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '4px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                          Productos de Catálogo:
                        </div>
                      )}
                      {filteredCatalog.map(p => (
                        <div 
                          key={p.id}
                          className={`sale-product-item ${selectedId === p.id ? 'selected' : ''}`}
                          onClick={() => handleSelectProduct(p)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="sale-item-icon">📦</span>
                            <div>
                              <div className="sale-item-name">{p.name}</div>
                              <div className="sale-item-sub">Stock: {Number(p.stock ?? 0)} uds • Costo: S/ {Number(p.cost).toFixed(2)}</div>
                            </div>
                          </div>
                          {selectedId === p.id && <Check size={14} color="#0066ff" />}
                        </div>
                      ))}

                      {/* Insumos de almacén */}
                      {filteredInventory.length > 0 && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '4px 8px', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px' }}>
                          Insumos Físicos de Almacén:
                        </div>
                      )}
                      {filteredInventory.map(i => (
                        <div 
                          key={i.id}
                          className={`sale-product-item ${selectedId === i.id ? 'selected' : ''}`}
                          onClick={() => handleSelectProduct(i)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="sale-item-icon">🏷️</span>
                            <div>
                              <div className="sale-item-name">{i.name}</div>
                              <div className="sale-item-sub">Stock: {Number(i.quantity ?? 0)} uds • Costo: S/ {Number(i.unitCost).toFixed(2)}</div>
                            </div>
                          </div>
                          {selectedId === i.id && <Check size={14} color="#0066ff" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stepper de Cantidad si hay producto seleccionado */}
              {!isGeneralExpense && (
                <div className="sale-quantity-container">
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', margin: 0, fontWeight: 700 }}>
                      Cantidad de Unidades a Comprar / Reponer:
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      Se ingresarán al stock físico de almacén
                    </span>
                  </div>

                  <div className="sale-stepper-control">
                    <button 
                      type="button" 
                      className="sale-stepper-btn"
                      onClick={() => handleStepQuantity(-1)}
                      disabled={qty <= 1}
                      title="Disminuir cantidad"
                    >
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number" 
                      min="1" 
                      className="sale-stepper-input"
                      value={expenseForm.quantity}
                      onChange={e => {
                        const n = Math.max(1, parseInt(e.target.value, 10) || 1);
                        const newAmount = (currentUnitCost * n).toFixed(2);
                        setExpenseForm(prev => ({ ...prev, quantity: n, amount: newAmount }));
                      }}
                    />
                    <button 
                      type="button" 
                      className="sale-stepper-btn"
                      onClick={() => handleStepQuantity(1)}
                      title="Aumentar cantidad"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: Desglose Económico & Desembolso */}
          <div className="sale-financial-card">
            <div className="sale-financial-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={16} color="#f59e0b" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  3. Resumen Económico del Desembolso
                </span>
              </div>

              {!isGeneralExpense && (
                <button 
                  type="button" 
                  className={`sale-custom-pricing-toggle ${expenseForm.isCustomCost ? 'active' : ''}`}
                  onClick={() => {
                    const nextCustom = !expenseForm.isCustomCost;
                    setExpenseForm(prev => ({
                      ...prev,
                      isCustomCost: nextCustom,
                      unitCost: nextCustom ? defaultCost.toString() : ''
                    }));
                  }}
                >
                  <Edit3 size={12} />
                  <span>{expenseForm.isCustomCost ? 'Restablecer costo default' : 'Modificar costo unitario'}</span>
                </button>
              )}
            </div>

            {/* Input Opcional de Costo Personalizado */}
            {!isGeneralExpense && expenseForm.isCustomCost && (
              <div className="sale-pricing-custom-drawer">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: '3px' }}>
                    Costo Unitario de Compra Especial (S/):
                  </label>
                  <div className="sale-input-wrapper">
                    <span className="sale-phone-prefix">S/</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="sale-custom-input"
                      placeholder="0.00"
                      value={expenseForm.unitCost}
                      onChange={e => {
                        const val = e.target.value;
                        const num = Number(val) || 0;
                        setExpenseForm(prev => ({
                          ...prev,
                          unitCost: val,
                          amount: (num * qty).toFixed(2)
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cuadrícula o Input directo de Desembolso */}
            {!isGeneralExpense ? (
              <div className="sale-financial-grid">
                <div className="sale-kpi-tile">
                  <span className="sale-kpi-label">Costo Unitario</span>
                  <span className="sale-kpi-value text-main">S/ {currentUnitCost.toFixed(2)}</span>
                  <span className="sale-kpi-sub">Por unidad ingresada</span>
                </div>

                <div className="sale-kpi-tile">
                  <span className="sale-kpi-label">Cantidad Comprada</span>
                  <span className="sale-kpi-value text-muted">{qty} uds</span>
                  <span className="sale-kpi-sub">Para stock de almacén</span>
                </div>

                <div className="sale-kpi-tile highlight" style={{ borderColor: 'rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.08)' }}>
                  <span className="sale-kpi-label">Total a Pagar</span>
                  <span className="sale-kpi-value" style={{ color: '#f87171' }}>S/ {computedTotal}</span>
                  <span className="sale-kpi-sub profit-pill" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>Egreso operativo</span>
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  Monto Total del Desembolso (S/): <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <div className="sale-input-wrapper">
                  <span className="sale-phone-prefix">S/</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    className="sale-custom-input"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {/* Banner Destacado del Total */}
            <div className="sale-total-banner" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.08))', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>
                  Total a Desembolsar:
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  Salida registrada en flujo de caja
                </span>
              </div>
              <div className="sale-total-amount" style={{ color: '#f87171' }}>
                S/ {Number(expenseForm.amount || computedTotal || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Estado de Recepción & Método de Pago */}
          <div className="sale-section-group">
            <div className="sale-section-title">
              <CreditCard size={14} color="#10b981" />
              <span>4. Estado de Recepción y Método de Pago</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Pills de Estado de Recepción si es producto */}
              {!isGeneralExpense && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.76rem', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Estado de Recepción de la Mercadería:</span>
                    <span style={{ color: expenseForm.inventoryStatus === 'pending' ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                      {expenseForm.inventoryStatus === 'pending' ? '⏳ Mercadería Pendiente' : '✅ Ya Recibido en Almacén'}
                    </span>
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setExpenseForm({ ...expenseForm, inventoryStatus: 'pending' })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: expenseForm.inventoryStatus === 'pending' ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                        backgroundColor: expenseForm.inventoryStatus === 'pending' ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-input)',
                        color: expenseForm.inventoryStatus === 'pending' ? '#f59e0b' : 'var(--text-muted)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} />
                        <span>⏳ Pendiente (Por recibir)</span>
                      </div>
                      <div style={{ fontSize: '0.70rem', color: 'var(--text-subtle)', marginTop: '3px' }}>
                        Se agregará al inventario cuando le des OK
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpenseForm({ ...expenseForm, inventoryStatus: 'received' })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: expenseForm.inventoryStatus === 'received' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                        backgroundColor: expenseForm.inventoryStatus === 'received' ? 'rgba(16, 185, 129, 0.16)' : 'var(--bg-input)',
                        color: expenseForm.inventoryStatus === 'received' ? '#10b981' : 'var(--text-muted)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={14} />
                        <span>✓ Ya Recibido en Almacén</span>
                      </div>
                      <div style={{ fontSize: '0.70rem', color: 'var(--text-subtle)', marginTop: '3px' }}>
                        Sumar al stock disponible de inmediato
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Pills de Método de Pago */}
              <div>
                <label className="form-label" style={{ fontSize: '0.76rem', marginBottom: '6px' }}>
                  Método de Pago Empleado:
                </label>
                <div className="sale-payment-pills-grid">
                  {EXPENSE_PAYMENT_METHODS.map(m => {
                    const isSelected = expenseForm.paymentMethod === m.id;
                    return (
                      <button 
                        key={m.id}
                        type="button"
                        className={`sale-payment-pill ${isSelected ? 'selected' : ''}`}
                        onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: m.id })}
                      >
                        <span style={{ fontSize: '1rem' }}>{m.icon}</span>
                        <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 5: Socio Responsable & Cuadre 50/50 */}
          <div className="sale-section-group">
            <div className="sale-section-title">
              <User size={14} color="#0066ff" />
              <span>5. Socio que Pagó el Gasto & Balance 50/50</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className={`sale-partner-card ${expenseForm.paidBy === 'luis' ? 'selected' : ''}`}
                  onClick={() => setExpenseForm({ ...expenseForm, paidBy: 'luis' })}
                >
                  <span style={{ fontSize: '1.2rem' }}>👨‍💼</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Luis Romero</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Co-CEO Fundador</div>
                  </div>
                  {expenseForm.paidBy === 'luis' && <Check size={14} color="#0066ff" style={{ marginLeft: 'auto' }} />}
                </button>

                <button
                  type="button"
                  className={`sale-partner-card ${expenseForm.paidBy === 'kevin' ? 'selected' : ''}`}
                  onClick={() => setExpenseForm({ ...expenseForm, paidBy: 'kevin' })}
                >
                  <span style={{ fontSize: '1.2rem' }}>🚀</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Kevin Servat</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Co-CEO Fundador</div>
                  </div>
                  {expenseForm.paidBy === 'kevin' && <Check size={14} color="#0066ff" style={{ marginLeft: 'auto' }} />}
                </button>
              </div>

              {/* Mes Contable */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', margin: 0 }}>
                    Mes Contable:
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ✓ Sincronizado automáticamente
                  </span>
                </div>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ fontSize: '0.82rem', height: '36px', borderRadius: '10px' }}
                  value={expenseForm.month || getAccountingMonth(expenseForm.date)}
                  onChange={e => setExpenseForm({ ...expenseForm, month: e.target.value })}
                />
              </div>

              {/* Notas de Cuadre */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  Notas / Detalle de Cuadre / Comprobante:
                </label>
                <textarea 
                  className="form-control"
                  rows="2"
                  placeholder="Detalles de liquidación, número de factura, orden de compra o comprobante..."
                  value={expenseForm.notes || ''}
                  onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  style={{ fontSize: '0.8rem', borderRadius: '10px' }}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="sale-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>

            {isPendingMerchandise && onReceiveExpenseStock && (
              <button 
                type="button" 
                className="btn btn-success"
                style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  onReceiveExpenseStock(editingExpense.id);
                  onClose();
                }}
              >
                <Check size={15} />
                <span>Dar OK e Ingresar a Almacén</span>
              </button>
            )}

            <button type="submit" className="sale-submit-btn" style={{ background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)' }}>
              <Check size={16} />
              <span>{editingExpense ? 'Guardar Cambios del Gasto' : 'Guardar y Registrar Gasto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
