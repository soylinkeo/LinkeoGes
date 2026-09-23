import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Sparkles, 
  Tag, 
  TrendingUp, 
  Package, 
  Layers, 
  CheckCircle, 
  Percent, 
  Compass, 
  Trash2,
  Shuffle,
  RefreshCw
} from 'lucide-react';
import { generateRandomSku } from '../utils/skuUtils';

export default function ProductsCatalogView({
  products = [],
  onAddNewProduct,
  onRequestDelete
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  const [newProductForm, setNewProductForm] = useState({
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

  const handleOpenNewProductModal = () => {
    setNewProductForm(prev => ({
      ...prev,
      sku: generateRandomSku('LNK-PROD'),
      name: '',
      price: '',
      cost: 13.00,
      stock: 20,
      description: ''
    }));
    setIsNewProductModalOpen(true);
  };

  const filteredProducts = products.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const handleCreateProduct = (e) => {
    e.preventDefault();
    const priceNum = Number(newProductForm.price) || 0;
    const costNum = Number(newProductForm.cost) || 0;
    const marginNum = priceNum - costNum;
    const marginPct = priceNum > 0 ? (marginNum / priceNum) * 100 : 0;
    const stockNum = Math.max(0, parseInt(newProductForm.stock) || 0);
    const finalSku = (newProductForm.sku && newProductForm.sku.trim()) || generateRandomSku('LNK-PROD');

    const newProd = {
      id: `prod-${Date.now()}`,
      name: newProductForm.name,
      sku: finalSku,
      category: newProductForm.category,
      type: newProductForm.type,
      price: priceNum,
      cost: costNum,
      stock: stockNum,
      margin: marginNum,
      marginPct: Number(marginPct.toFixed(1)),
      badge: newProductForm.badge,
      description: newProductForm.description
    };

    onAddNewProduct(newProd);
    setIsNewProductModalOpen(false);
    setNewProductForm({
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
  };

  const individualCount = products.filter(p => p.category === 'Individual').length;
  const packsCount = products.filter(p => p.category === 'Pack').length;
  const innovationsCount = products.filter(p => p.category === 'Innovacion').length;

  return (
    <div className="products-catalog-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: 'rgba(0, 102, 255, 0.12)', padding: '8px', borderRadius: 'var(--radius-md)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={24} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
              Almacén & Catálogo Oficial de Productos (Precios y Costos por Defecto)
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0', maxWidth: '820px' }}>
            Registra aquí todos los tipos de productos e insumos de Linkeo (Tarjetas NFC, Displays, etc.) definiendo su <strong>Precio de Venta Oficial</strong> y su <strong>Costo Unitario por Defecto</strong>. Al registrar gastos o ventas, se cargarán automáticamente con la opción de modificarlos cuando lo necesites.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenNewProductModal}>
          <Plus size={16} />
          <span>Agregar Producto al Almacén</span>
        </button>
      </div>

      {/* Selector de Categorías Dinámico */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('all')}
        >
          Todos ({products.length})
        </button>
        <button 
          className={`btn btn-sm ${activeCategory === 'Individual' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('Individual')}
        >
          Modelos Individuales ({individualCount})
        </button>
        <button 
          className={`btn btn-sm ${activeCategory === 'Pack' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('Pack')}
        >
          Packs Promocionales ({packsCount})
        </button>
        <button 
          className={`btn btn-sm ${activeCategory === 'Innovacion' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('Innovacion')}
        >
          Próximas Innovaciones ({innovationsCount})
        </button>
      </div>

      {/* Grid de Productos o Estado Vacío */}
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'var(--bg-card)', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(0, 102, 255, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)', marginBottom: '16px' }}>
            <ShoppingBag size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
            No hay productos registrados en esta categoría
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 20px auto' }}>
            {activeCategory === 'all' 
              ? 'El catálogo se encuentra limpio o reiniciado. Puedes registrar nuevos modelos, tarjetas NFC o combos promocionales.'
              : `Actualmente no hay productos bajo la categoría "${activeCategory}". Puedes agregar uno nuevo con el botón inferior.`}
          </p>
          <button className="btn btn-primary" onClick={() => setIsNewProductModalOpen(true)}>
            <Plus size={16} />
            <span>+ Agregar Producto al Catálogo</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredProducts.map(prod => (
            <div 
              key={prod.id} 
              className="card"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                {/* Badges superiores y botón de eliminar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="code-mono">{prod.sku}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${prod.badge?.includes('👑') ? 'badge-yellow' : prod.badge?.includes('Ahorra') ? 'badge-red' : 'badge-blue'}`}>
                      {prod.badge}
                    </span>
                    <button 
                      className="btn-icon" 
                      style={{ width: '28px', height: '28px', color: '#ef4444' }}
                      onClick={() => onRequestDelete && onRequestDelete(prod, 'Producto')}
                      title="Eliminar producto de catálogo (Auditoría)"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Nombre y Tipo */}
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  {prod.name}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {prod.type}
                </div>

                {/* Pricing & Margen */}
                <div style={{ 
                  backgroundColor: 'var(--bg-input)', 
                  padding: '12px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Precio Oficial:</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)' }}>
                      S/ {Number(prod.price).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.78rem', paddingTop: '8px', borderTop: '1px dashed var(--border-subtle)' }}>
                    <div>
                      <span style={{ color: 'var(--text-subtle)' }}>Costo Insumo:</span>
                      <div style={{ fontWeight: 700, color: 'var(--google-red)' }}>S/ {Number(prod.cost).toFixed(2)}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-subtle)' }}>Ganancia:</span>
                      <div style={{ fontWeight: 700, color: 'var(--google-green)' }}>
                        S/ {Number(prod.margin).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-subtle)' }}>Stock Almacén:</span>
                      <div style={{ fontWeight: 800, color: (prod.stock ?? 0) > 0 ? '#10b981' : '#ef4444' }}>
                        {(prod.stock ?? 0) > 0 ? `${prod.stock} uds` : '0 (Agotado)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  {prod.description}
                </p>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  Catálogo Activo en Lima
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                  ✓ Google Reviews Ready
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banner de Innovación y Futuros Productos */}
      <div 
        style={{
          marginTop: '32px',
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px dashed rgba(0, 102, 255, 0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(0, 102, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
            <Compass size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>
              ¿Pensando en expandir Linkeo más allá de tarjetas Google?
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, maxWidth: '650px' }}>
              LinkeoGes está diseñado modularmente. Pueden incorporar fácilmente <strong>Menús Digitales QR</strong>,
              <strong>Tarjetas Personales Ejecutivas (vCard NFC)</strong>, <strong>Llaveros Inteligentes</strong> o
              <strong>Placas Metálicas</strong> manteniendo la misma base de datos y trazabilidad.
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setIsNewProductModalOpen(true)}>
          <Sparkles size={16} />
          <span>Registrar Nueva Línea</span>
        </button>
      </div>

      {/* MODAL: Nuevo Producto o Innovación */}
      {isNewProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewProductModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Producto / Insumo en Almacén</h3>
              <button className="close-btn" onClick={() => setIsNewProductModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label className="form-label">Nombre del Producto / Insumo:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Tarjeta Google NFC Cuadrado, Display Acrílico A6..."
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
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
                      onClick={() => setNewProductForm(prev => ({ ...prev, sku: generateRandomSku('LNK-PROD') }))}
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
                      placeholder="LNK-PROD-XXXX"
                      value={newProductForm.sku}
                      onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                      required
                    />
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => setNewProductForm(prev => ({ ...prev, sku: generateRandomSku('LNK-PROD') }))}
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
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                  >
                    <option value="Individual">Modelo Individual (Tarjeta NFC)</option>
                    <option value="Pack">Pack Promocional (Combos 2x / 3x)</option>
                    <option value="Innovacion">Nueva Innovación Tecnológica</option>
                    <option value="Suscripcion">Suscripción / Servicio Mensual</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Precio de Venta Oficial (S/):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control"
                    placeholder="Ej: 69.00"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '3px', display: 'block' }}>
                    Precio cargado por defecto en ventas
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Costo Unitario por Defecto (S/):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control"
                    placeholder="Ej: 13.00"
                    value={newProductForm.cost}
                    onChange={(e) => setNewProductForm({ ...newProductForm, cost: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '3px', display: 'block' }}>
                    Costo cargado por defecto en compras/gastos
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Stock Disponible en Almacén (Unidades):</label>
                <input 
                  type="number" 
                  min="0"
                  className="form-control"
                  placeholder="Ej: 20"
                  value={newProductForm.stock}
                  onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '3px', display: 'block' }}>
                  Cantidad disponible para vincular a chips NFC y vender inmediatamente
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Etiqueta Destacada (Badge):</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Innovación 2026, Más Vendido, Ahorra S/ 30..."
                  value={newProductForm.badge}
                  onChange={(e) => setNewProductForm({ ...newProductForm, badge: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción del Producto:</label>
                <textarea 
                  className="form-control"
                  rows="3"
                  placeholder="Beneficios para el cliente, materiales, propuesta de valor..."
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewProductModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Publicar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
