import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Store, 
  MapPin, 
  CreditCard, 
  Package, 
  Plus, 
  Minus, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Phone, 
  User, 
  DollarSign, 
  Check, 
  RotateCcw,
  Tag
} from 'lucide-react';
import DistrictCombobox from './DistrictCombobox.jsx';
import { INITIAL_PRODUCTS } from '../data/initialData.js';

export const PAYMENT_METHODS = [
  { id: 'Yape', label: 'Yape', icon: '💜', color: '#8b5cf6' },
  { id: 'Plin', label: 'Plin', icon: '🔵', color: '#0066ff' },
  { id: 'Transferencia', label: 'Transferencia', icon: '🏦', color: '#38bdf8' },
  { id: 'Tarjeta', label: 'Tarjeta', icon: '💳', color: '#10b981' },
  { id: 'Efectivo', label: 'Efectivo', icon: '💵', color: '#f59e0b' },
  { id: 'Efectivo contraentrega', label: 'Contraentrega', icon: '📦', color: '#ec4899' }
];

export default function NewSaleModal({
  isOpen,
  onClose,
  onSubmit,
  newSaleForm,
  setNewSaleForm,
  products = [],
  districts = [],
  currentUser,
  showToast
}) {
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  if (!isOpen) return null;

  const catalogList = products && products.length > 0 ? products : INITIAL_PRODUCTS;
  const selectedProdId = newSaleForm.productId || (catalogList[0]?.id || '');
  const currentProd = catalogList.find(p => p.id === selectedProdId) || catalogList[0];
  const availableStock = Number(currentProd?.stock ?? 0);
  const isOutOfStock = availableStock <= 0;

  const defaultPrice = currentProd ? Number(currentProd.price || 0) : 0;
  const defaultCost = currentProd ? Number(currentProd.cost || 0) : 0;

  const currentUnitPrice = newSaleForm.isCustomPricing && newSaleForm.customUnitPrice !== '' 
    ? Number(newSaleForm.customUnitPrice) 
    : defaultPrice;

  const currentUnitCost = newSaleForm.isCustomPricing && newSaleForm.customUnitCost !== '' 
    ? Number(newSaleForm.customUnitCost) 
    : defaultCost;

  const qty = Number(newSaleForm.quantity) || 1;
  const currentTotal = (currentUnitPrice * qty).toFixed(2);
  const currentProfit = ((currentUnitPrice - currentUnitCost) * qty).toFixed(2);
  const marginPercent = currentUnitPrice > 0 
    ? (((currentUnitPrice - currentUnitCost) / currentUnitPrice) * 100).toFixed(1) 
    : '0.0';

  // Filtrado de productos en catálogo
  const filteredProducts = catalogList.filter(p => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
  });

  const handleSelectProduct = (prod) => {
    const pStock = Number(prod?.stock ?? 0);
    const curQty = parseInt(newSaleForm.quantity, 10) || 1;
    const clampedQty = pStock > 0 ? Math.min(Math.max(1, curQty), pStock) : 1;

    setNewSaleForm(prev => ({
      ...prev,
      productId: prod.id,
      quantity: clampedQty,
      // Si no hay custom pricing, mantenemos limpio
      customUnitPrice: prev.isCustomPricing ? (prod.price || 0).toString() : '',
      customUnitCost: prev.isCustomPricing ? (prod.cost || 0).toString() : ''
    }));

    setIsProductPickerOpen(false);
    setProductSearch('');
  };

  const handleStepQuantity = (delta) => {
    const cur = parseInt(newSaleForm.quantity, 10) || 1;
    const next = cur + delta;
    if (next < 1) return;
    if (availableStock > 0 && next > availableStock) {
      if (showToast) {
        showToast(`Stock insuficiente: solo quedan ${availableStock} unidades en almacén.`, 'warning');
      }
      return;
    }
    setNewSaleForm(prev => ({ ...prev, quantity: next }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content sale-modal-card" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header Elegante */}
        <div className="sale-modal-header">
          <div className="sale-modal-icon-badge">
            <ShoppingBag size={22} color="#0066ff" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 className="sale-modal-title">Registrar Nueva Venta | LinkeoGes</h3>
            <p className="sale-modal-subtitle">
              Conexión directa con almacén físico, trazabilidad chip NFC y facturación oficial
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '6px' }}>
          
          {/* SECCIÓN 1: Cliente & Ubicación */}
          <div className="sale-section-group">
            <div className="sale-section-title">
              <Store size={14} color="#38bdf8" />
              <span>1. Datos del Cliente / Negocio</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  Nombre del Negocio o Razón Comercial: <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <div className="sale-input-wrapper">
                  <Store size={15} className="sale-input-icon" />
                  <input 
                    type="text" 
                    className="sale-custom-input"
                    placeholder="Ej: Barbería Don Tito, Pollería Roky's, Dental San Isidro..."
                    value={newSaleForm.clientName}
                    onChange={e => setNewSaleForm({ ...newSaleForm, clientName: e.target.value })}
                    required 
                  />
                </div>
              </div>

              <div className="form-row" style={{ margin: 0, gap: '10px' }}>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                    Distrito de Lima (Sincronizado): <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <DistrictCombobox 
                    value={newSaleForm.district}
                    onChange={dist => setNewSaleForm({ ...newSaleForm, district: dist })}
                    districts={districts}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', margin: 0 }}>
                      WhatsApp de Contacto:
                    </label>
                    <span style={{ fontSize: '0.7rem', color: newSaleForm.phone?.length === 9 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                      {newSaleForm.phone?.length || 0}/9 dígitos
                    </span>
                  </div>
                  <div className="sale-input-wrapper">
                    <span className="sale-phone-prefix">+51</span>
                    <input 
                      type="tel" 
                      className="sale-custom-input"
                      placeholder="987654321" 
                      maxLength={9}
                      value={newSaleForm.phone} 
                      onChange={e => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setNewSaleForm({ ...newSaleForm, phone: clean });
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Producto & Cantidad (El corazón rediseñado de la venta) */}
          <div className="sale-section-group">
            <div className="sale-section-title">
              <Package size={14} color="#a855f7" />
              <span>2. Selección de Producto y Existencias en Almacén</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Selector Visual de Producto (Reemplaza al select robótico nativo) */}
              <div style={{ position: 'relative' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Producto o Pack Solicitado: <span style={{ color: '#f43f5e' }}>*</span></span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Clic para cambiar producto</span>
                </label>

                {/* Tarjeta de Producto Activo */}
                <div 
                  className={`sale-active-product-card ${isProductPickerOpen ? 'active-open' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                  onClick={() => setIsProductPickerOpen(!isProductPickerOpen)}
                  title="Clic para desplegar el catálogo de productos disponibles"
                >
                  <div className="sale-product-card-left">
                    <div className="sale-product-icon-box">
                      {currentProd?.sku?.includes('PACK') ? <Package size={18} /> : <CreditCard size={18} />}
                    </div>
                    <div>
                      <div className="sale-product-card-name">
                        {currentProd?.name || 'Selecciona un producto'}
                      </div>
                      <div className="sale-product-card-meta">
                        <span>SKU: {currentProd?.sku || 'NFC-STD'}</span>
                        <span>•</span>
                        <span>Oficial Linkeo</span>
                      </div>
                    </div>
                  </div>

                  <div className="sale-product-card-right">
                    <div className="sale-product-card-price">
                      S/ {defaultPrice.toFixed(2)}
                    </div>
                    {isOutOfStock ? (
                      <span className="sale-stock-pill out">
                        ❌ Sin stock
                      </span>
                    ) : availableStock === 1 ? (
                      <span className="sale-stock-pill warning">
                        ⚠️ Solo 1 disponible
                      </span>
                    ) : (
                      <span className="sale-stock-pill in">
                        🟢 {availableStock} en stock
                      </span>
                    )}
                    <ChevronDown size={16} className={`sale-chevron ${isProductPickerOpen ? 'rotate' : ''}`} />
                  </div>
                </div>

                {/* Dropdown Flotante con Catálogo Estilizado */}
                {isProductPickerOpen && (
                  <div className="sale-product-dropdown-menu">
                    <div className="sale-product-search-box">
                      <input 
                        type="text" 
                        placeholder="Buscar producto o pack por nombre..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="sale-product-list">
                      {filteredProducts.map(p => {
                        const pStock = Number(p.stock ?? 0);
                        const isSelected = p.id === selectedProdId;
                        const noStock = pStock <= 0;

                        return (
                          <div 
                            key={p.id}
                            className={`sale-product-item ${isSelected ? 'selected' : ''} ${noStock ? 'disabled-item' : ''}`}
                            onClick={() => handleSelectProduct(p)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="sale-item-icon">
                                {p.sku?.includes('PACK') ? '📦' : '💳'}
                              </div>
                              <div>
                                <div className="sale-item-name">{p.name}</div>
                                <div className="sale-item-sub">
                                  Costo Insumo: S/ {Number(p.cost || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="sale-item-price">
                                S/ {Number(p.price || 0).toFixed(2)}
                              </span>
                              {noStock ? (
                                <span className="sale-stock-pill out">Agotado</span>
                              ) : pStock === 1 ? (
                                <span className="sale-stock-pill warning">1 disponible</span>
                              ) : (
                                <span className="sale-stock-pill in">{pStock} uds</span>
                              )}
                              {isSelected && <Check size={14} color="#0066ff" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Fila de Cantidad con Stepper Táctil */}
              <div className="sale-quantity-container">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                    Cantidad de Unidades:
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Descuenta unidades del inventario físico en tiempo real
                  </div>
                </div>

                <div className="sale-stepper-box">
                  <button 
                    type="button" 
                    className="sale-stepper-btn"
                    onClick={() => handleStepQuantity(-1)}
                    disabled={qty <= 1 || isOutOfStock}
                    title="Disminuir cantidad"
                  >
                    <Minus size={14} />
                  </button>
                  <input 
                    type="number"
                    min="1"
                    max={Math.max(1, availableStock)}
                    value={newSaleForm.quantity}
                    disabled={isOutOfStock}
                    className="sale-stepper-input"
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setNewSaleForm({ ...newSaleForm, quantity: '' });
                        return;
                      }
                      let n = parseInt(raw, 10);
                      if (isNaN(n)) return;
                      if (availableStock > 0 && n > availableStock) {
                        n = availableStock;
                      } else if (n < 1) {
                        n = 1;
                      }
                      setNewSaleForm({ ...newSaleForm, quantity: n });
                    }}
                    onBlur={() => {
                      const num = parseInt(newSaleForm.quantity, 10);
                      if (isNaN(num) || num < 1) {
                        setNewSaleForm(prev => ({ ...prev, quantity: 1 }));
                      } else if (availableStock > 0 && num > availableStock) {
                        setNewSaleForm(prev => ({ ...prev, quantity: availableStock }));
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    className="sale-stepper-btn"
                    onClick={() => handleStepQuantity(1)}
                    disabled={qty >= availableStock || isOutOfStock}
                    title="Aumentar cantidad"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Advertencia si no hay stock */}
              {isOutOfStock && (
                <div className="sale-out-alert">
                  <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Stock en cero:</strong> No quedan existencias físicas en almacén de este producto. Selecciona otro o ingresa stock en el módulo de Inventario.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: Desglose Económico y Rentabilidad (No más inputs robóticos "60" y "12.96") */}
          <div className="sale-financial-card">
            <div className="sale-financial-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={16} color="#10b981" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  3. Resumen Económico & Margen de Rentabilidad
                </span>
              </div>

              <button 
                type="button" 
                className={`sale-custom-pricing-toggle ${newSaleForm.isCustomPricing ? 'active' : ''}`}
                onClick={() => {
                  setNewSaleForm(prev => ({
                    ...prev,
                    isCustomPricing: !prev.isCustomPricing,
                    customUnitPrice: !prev.isCustomPricing ? defaultPrice.toString() : '',
                    customUnitCost: !prev.isCustomPricing ? defaultCost.toString() : ''
                  }));
                }}
              >
                <Edit3 size={12} />
                <span>{newSaleForm.isCustomPricing ? 'Restablecer precios oficiales' : 'Modificar precio / costo'}</span>
              </button>
            </div>

            {/* Inputs Opcionales de Precios Modificados */}
            {newSaleForm.isCustomPricing && (
              <div className="sale-pricing-custom-drawer">
                <div className="form-row" style={{ margin: 0, gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: '3px' }}>
                      Precio de Venta Especial (S/):
                    </label>
                    <div className="sale-input-wrapper">
                      <span className="sale-phone-prefix">S/</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="sale-custom-input"
                        value={newSaleForm.customUnitPrice}
                        onChange={e => setNewSaleForm({ ...newSaleForm, customUnitPrice: e.target.value })}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: '3px' }}>
                      Costo Unitario Real Insumo (S/):
                    </label>
                    <div className="sale-input-wrapper">
                      <span className="sale-phone-prefix">S/</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="sale-custom-input"
                        value={newSaleForm.customUnitCost}
                        onChange={e => setNewSaleForm({ ...newSaleForm, customUnitCost: e.target.value })}
                        required 
                      />
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '6px' }}>
                  💡 Este ajuste aplica exclusivamente a esta venta. El catálogo oficial maestro de Linkeo no se modifica.
                </div>
              </div>
            )}

            {/* Cuadrícula de 3 Métricas Clave */}
            <div className="sale-financial-grid">
              <div className="sale-kpi-tile">
                <span className="sale-kpi-label">Precio Unitario</span>
                <span className="sale-kpi-value text-main">S/ {currentUnitPrice.toFixed(2)}</span>
                <span className="sale-kpi-sub">Por tarjeta / pack</span>
              </div>

              <div className="sale-kpi-tile">
                <span className="sale-kpi-label">Costo Insumo</span>
                <span className="sale-kpi-value text-muted">S/ {currentUnitCost.toFixed(2)}</span>
                <span className="sale-kpi-sub">Costo de reposición</span>
              </div>

              <div className="sale-kpi-tile highlight">
                <span className="sale-kpi-label">Margen Bruto</span>
                <span className="sale-kpi-value text-profit">+S/ {currentProfit}</span>
                <span className="sale-kpi-sub profit-pill">{marginPercent}% de margen</span>
              </div>
            </div>

            {/* Barra Destacada de Total a Cobrar */}
            <div className="sale-total-banner">
              <div>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>
                  Total a Cobrar al Cliente ({qty} {qty === 1 ? 'unidad' : 'unidades'}):
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  Ingreso directo al flujo de caja
                </span>
              </div>
              <div className="sale-total-amount">
                S/ {currentTotal}
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Método de Pago (Pills Táctiles Visuales) */}
          <div className="sale-section-group">
            <div className="sale-section-title">
              <CreditCard size={14} color="#10b981" />
              <span>4. Método de Pago</span>
            </div>

            <div className="sale-payment-pills-grid">
              {PAYMENT_METHODS.map(m => {
                const isSelected = newSaleForm.paymentMethod === m.id;
                return (
                  <button 
                    key={m.id}
                    type="button"
                    className={`sale-payment-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => setNewSaleForm({ ...newSaleForm, paymentMethod: m.id })}
                  >
                    <span style={{ fontSize: '1rem' }}>{m.icon}</span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 5: Socio Responsable y Google Place ID */}
          <div className="sale-section-group">
            <div className="sale-section-title">
              <User size={14} color="#0066ff" />
              <span>5. Vendedor Responsable & Trazabilidad NFC</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Partner selector pills */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className={`sale-partner-card ${newSaleForm.soldBy === 'luis' ? 'selected' : ''}`}
                  onClick={() => setNewSaleForm({ ...newSaleForm, soldBy: 'luis' })}
                >
                  <span style={{ fontSize: '1.2rem' }}>👨‍💼</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Luis Romero</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Co-CEO Fundador</div>
                  </div>
                  {newSaleForm.soldBy === 'luis' && <Check size={14} color="#0066ff" style={{ marginLeft: 'auto' }} />}
                </button>

                <button
                  type="button"
                  className={`sale-partner-card ${newSaleForm.soldBy === 'kevin' ? 'selected' : ''}`}
                  onClick={() => setNewSaleForm({ ...newSaleForm, soldBy: 'kevin' })}
                >
                  <span style={{ fontSize: '1.2rem' }}>🚀</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Kevin Servat</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Co-CEO Fundador</div>
                  </div>
                  {newSaleForm.soldBy === 'kevin' && <Check size={14} color="#0066ff" style={{ marginLeft: 'auto' }} />}
                </button>
              </div>

              {/* Google Place ID */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', margin: 0 }}>
                    Google Place ID (Opcional):
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                    ⭐ Reseñas directas 5 estrellas
                  </span>
                </div>
                <div className="sale-input-wrapper">
                  <Tag size={14} className="sale-input-icon" />
                  <input 
                    type="text" 
                    className="sale-custom-input code-mono"
                    placeholder="Ej: ChIJN1t_tDeuEmsRUsoyG83frY4"
                    value={newSaleForm.googlePlaceId}
                    onChange={e => setNewSaleForm({ ...newSaleForm, googlePlaceId: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer de Acciones con Botón Principal Destacado */}
          <div className="sale-modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              Cancelar
            </button>

            <button 
              type="submit" 
              className="sale-submit-btn"
              disabled={isOutOfStock}
              title={isOutOfStock ? "No se puede registrar: producto sin existencias en almacén" : ""}
            >
              <Sparkles size={16} />
              <span>Confirmar Venta & Grabar Chip (S/ {currentTotal})</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
