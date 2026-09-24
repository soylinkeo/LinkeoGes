import { localDate } from '../utils/dateUtils.js';
import { calculateFinance } from '../utils/financeUtils.js';
import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Plus, 
  Users, 
  Receipt, 
  ArrowRightLeft,
  Trash2,
  Edit3
} from 'lucide-react';
import { getAccountingMonth, ACCOUNTING_MONTHS } from '../utils/dateUtils';

export default function FinanceView({
  sales = [],
  expenses = [],
  products = [],
  inventory = [],
  onAddNewExpense,
  onEditExpense,
  onAddNewSale,
  onExportExcel,
  partnerBalance = {},
  onSettlePartnerDebt,
  targets = {},
  onRequestDelete,
  onAddNewProduct,
  onUpdateInventoryStock,
  showToast
}) {
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterPartner, setFilterPartner] = useState('all');
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Formulario nuevo gasto con producto vinculado y costo modificable
  const todayStr = localDate();
  const [expenseForm, setExpenseForm] = useState({
    date: todayStr,
    type: 'Gasto',
    category: 'Compra de mercadería',
    selectedProductId: '',
    description: '',
    quantity: 1,
    unitCost: '',
    isCustomCost: false,
    amount: '',
    paymentMethod: 'Tarjeta',
    paidBy: 'luis',
    month: getAccountingMonth(todayStr),
    notes: '',
    addToInventory: true
  });

  // Manejar selección de producto/insumo de almacén para cargar costo por default
  const handleProductChange = (productId) => {
    if (!productId) {
      setExpenseForm(prev => ({
        ...prev,
        selectedProductId: '',
        unitCost: '',
        isCustomCost: false
      }));
      return;
    }

    const prod = products.find(p => p.id === productId) || inventory.find(i => i.id === productId);
    if (prod) {
      const defaultCost = Number(prod.cost ?? prod.unitCost ?? 0);
      const qty = Number(expenseForm.quantity) || 1;
      const total = (defaultCost * qty).toFixed(2);

      setExpenseForm(prev => ({
        ...prev,
        selectedProductId: productId,
        description: prod.name,
        category: 'Compra de mercadería',
        unitCost: defaultCost.toString(),
        isCustomCost: false,
        amount: total
      }));
    }
  };

  // Formulario liquidación
  const [settleAmount, setSettleAmount] = useState(Math.abs(partnerBalance.debtLuisToKevin || 0).toFixed(2));
  const [settleNote, setSettleNote] = useState('Transferencia de cuadre vía Yape/BCP');

  // Cálculos
  const { totalSalesAmount, totalCost, totalGrossProfit, totalExpenses, inventoryPurchases, totalDisbursed, netProfit } = calculateFinance(sales, expenses);

  // Aportes de socios
  const paidByKevin = partnerBalance.paidByKevin || 0;
  const paidByLuis = partnerBalance.paidByLuis || 0;
  const debt = partnerBalance.debtLuisToKevin || 0;

  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    const today = localDate();
    setExpenseForm({
      date: today,
      type: 'Gasto',
      category: 'Compra de mercadería',
      selectedProductId: '',
      description: '',
      quantity: 1,
      unitCost: '',
      isCustomCost: false,
      amount: '',
      paymentMethod: 'Tarjeta',
      paidBy: 'luis',
      month: getAccountingMonth(today),
      notes: '',
      addToInventory: true
    });
    setIsNewExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({
      date: exp.date || localDate(),
      type: exp.type || 'Gasto',
      category: exp.category || 'Compra de mercadería',
      selectedProductId: exp.selectedProductId || '',
      description: exp.description || '',
      quantity: exp.quantity || 1,
      unitCost: exp.unitCost !== null && exp.unitCost !== undefined ? String(exp.unitCost) : '',
      isCustomCost: !!exp.isCustomCost,
      amount: exp.amount !== null && exp.amount !== undefined ? String(exp.amount) : '',
      paymentMethod: exp.paymentMethod || 'Tarjeta',
      paidBy: exp.paidBy || 'luis',
      month: exp.month || getAccountingMonth(exp.date || localDate()),
      notes: exp.notes || '',
      addToInventory: false
    });
    setIsNewExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    const today = localDate();
    setExpenseForm({
      date: today,
      type: 'Gasto',
      category: 'Compra de mercadería',
      selectedProductId: '',
      description: '',
      quantity: 1,
      unitCost: '',
      isCustomCost: false,
      amount: '',
      paymentMethod: 'Tarjeta',
      paidBy: 'luis',
      month: getAccountingMonth(today),
      notes: '',
      addToInventory: true
    });
    setEditingExpense(null);
    setIsNewExpenseModalOpen(false);
  };

  const handleCloseSettleModal = () => {
    setIsSettleModalOpen(false);
  };

  const handleCreateExpense = (e) => {
    e.preventDefault();
    const finalAmount = Number(expenseForm.amount) || 0;

    if (editingExpense) {
      const updatedExp = {
        ...editingExpense,
        date: expenseForm.date,
        type: expenseForm.type,
        category: expenseForm.category,
        description: expenseForm.description,
        amount: finalAmount,
        paymentMethod: expenseForm.paymentMethod,
        paidBy: expenseForm.paidBy,
        month: expenseForm.month || getAccountingMonth(expenseForm.date),
        notes: expenseForm.notes,
        selectedProductId: expenseForm.selectedProductId || null,
        unitCost: expenseForm.unitCost ? Number(expenseForm.unitCost) : null,
        quantity: Number(expenseForm.quantity) || 1,
        isCustomCost: expenseForm.isCustomCost
      };

      if (onEditExpense) {
        if (onEditExpense(updatedExp) === false) return;
      }
      if (showToast) {
        showToast(`✅ Gasto "${updatedExp.description || 'Gasto'}" actualizado exitosamente`, 'success');
      }
      handleCloseExpenseModal();
      return;
    }

    const newExp = {
      id: `exp-${Date.now()}`,
      date: expenseForm.date,
      type: expenseForm.type,
      category: expenseForm.category,
      description: expenseForm.description,
      amount: finalAmount,
      paymentMethod: expenseForm.paymentMethod,
      paidBy: expenseForm.paidBy,
      month: expenseForm.month || getAccountingMonth(expenseForm.date),
      notes: expenseForm.notes,
      selectedProductId: expenseForm.selectedProductId || null,
      unitCost: expenseForm.unitCost ? Number(expenseForm.unitCost) : null,
      quantity: Number(expenseForm.quantity) || 1,
      isCustomCost: expenseForm.isCustomCost
    };

    if (onAddNewExpense({ ...newExp, addToInventory: expenseForm.addToInventory }) === false) return;

    if (showToast) {
      showToast(`✅ Gasto de S/ ${finalAmount.toFixed(2)} registrado exitosamente`, 'success');
    }
    handleCloseExpenseModal();
  };

  const handleConfirmSettle = (e) => {
    e.preventDefault();
    const settleAmt = Number(settleAmount) || 0;
    const success = onSettlePartnerDebt({
      amount: settleAmt,
      note: settleNote,
      fromPartner: debt > 0 ? 'luis' : 'kevin',
      toPartner: debt > 0 ? 'kevin' : 'luis'
    });
    if (showToast) {
      showToast(`✅ Liquidación 50/50 por S/ ${settleAmt.toFixed(2)} registrada`, 'success');
    }
    handleCloseSettleModal();
  };

  // Filtrado de gastos
  const filteredExpenses = expenses.filter(e => {
    const matchesMonth = filterMonth === 'all' || e.month === filterMonth;
    const matchesPartner = filterPartner === 'all' || e.paidBy === filterPartner;
    return matchesMonth && matchesPartner;
  });

  return (
    <div className="finance-view">
      {targets.isFeasible === false && <p role="alert" className="badge badge-yellow">{targets.warning}</p>}
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: 'rgba(0, 102, 255, 0.12)', padding: '8px', borderRadius: 'var(--radius-md)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={24} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
              Finanzas, Gastos & Cuentas Claras (50/50)
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
            Control transparente de desembolsos, conciliación entre Luis Romero y Kevin Servat, y exportación limpia a Excel (.xlsx).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline-excel" onClick={onExportExcel}>
            <Download size={16} />
            <span>Exportar Todo a Excel (.xlsx)</span>
          </button>

          <button className="btn btn-primary" onClick={handleOpenNewExpense}>
            <Plus size={16} />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Destacada: Balance entre Socios (Cuentas Claras) */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div 
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: 'rgba(168, 85, 247, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#c084fc',
              flexShrink: 0
            }}
          >
            <Users size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-purple">Regla Societaria: 50% / 50%</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cuadre automático de compras</span>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0 6px 0' }}>
              {debt > 0 ? (
                <span>Luis Romero debe debitar <strong style={{ color: '#f59e0b' }}>S/ {debt.toFixed(2)}</strong> a Kevin Servat</span>
              ) : debt < 0 ? (
                <span>Kevin Servat debe debitar <strong style={{ color: '#f59e0b' }}>S/ {Math.abs(debt).toFixed(2)}</strong> a Luis Romero</span>
              ) : (
                <span style={{ color: '#10b981' }}>¡Cuentas perfectamente saldadas al 50/50!</span>
              )}
            </h3>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>🚀 <strong>Kevin Servat ha aportado:</strong> S/ {paidByKevin.toFixed(2)}</span>
              <span>👨‍💼 <strong>Luis Romero ha aportado:</strong> S/ {paidByLuis.toFixed(2)}</span>
              <span>⚖️ <strong>Cuota 50% por socio:</strong> S/ {(partnerBalance.halfExpense || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {Math.abs(debt) > 0.01 && (
          <button 
            className="btn btn-secondary" 
            style={{ borderColor: 'rgba(168, 85, 247, 0.4)' }}
            onClick={() => { setSettleAmount(Math.abs(debt).toFixed(2)); setIsSettleModalOpen(true); }}
          >
            <ArrowRightLeft size={16} />
            <span>Registrar Liquidación / Pago</span>
          </button>
        )}
      </div>

      {/* KPIs Financieros */}
      <div className="metrics-grid" style={{ marginBottom: '32px' }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Facturado en Ventas</span>
            <div className="kpi-icon-wrapper">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">S/ {totalSalesAmount.toFixed(2)}</div>
          <div className="kpi-subtext">Meta mensual estimada: S/ {targets.monthlyRevenueEstimate ?? 5100}</div>
        </div>

        <div className="kpi-card kpi-red">
          <div className="kpi-header">
            <span className="kpi-label">Gastos & Compras Reales</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="kpi-value">S/ {(totalDisbursed || 0).toFixed(2)}</div>
          <div className="kpi-subtext">{expenses.length} movimientos (S/ {(inventoryPurchases || 0).toFixed(2)} compras · S/ {totalExpenses.toFixed(2)} op)</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-header">
            <span className="kpi-label">Margen Bruto de Ventas</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value">S/ {totalGrossProfit.toFixed(2)}</div>
          <div className="kpi-subtext">Margen promedio: ~78% por producto</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Utilidad Neta Actual</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: netProfit >= 0 ? '#10b981' : '#f59e0b' }}>
            S/ {netProfit.toFixed(2)}
          </div>
          <div className="kpi-subtext">Meta neta mensual: S/ {targets.monthlyProfitTarget || 4000}</div>
        </div>
      </div>

      {/* Tabla de Movimientos de Gastos e Ingresos */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className="card-title">
              <Receipt size={18} color="var(--primary-600)" />
              <span>Registro de Ingresos y Gastos (Control Real)</span>
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '420px' }}>
            <select 
              className="form-control" 
              style={{ flex: '1 1 140px', minWidth: '130px', padding: '6px 10px', fontSize: '0.82rem' }}
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="all">Todos los Meses</option>
              {ACCOUNTING_MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select 
              className="form-control" 
              style={{ flex: '1 1 180px', minWidth: '150px', padding: '6px 10px', fontSize: '0.82rem' }}
              value={filterPartner}
              onChange={(e) => setFilterPartner(e.target.value)}
            >
              <option value="all">Todos los Socios</option>
              <option value="luis">Luis Romero (Co-CEO)</option>
              <option value="kevin">Kevin Servat (Co-CEO)</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Monto (S/)</th>
                <th>Método Pago</th>
                <th>Socio Responsable</th>
                <th>Mes</th>
                <th>Notas / Impacto en Caja</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => (
                <tr key={exp.id}>
                  <td>{exp.date}</td>
                  <td>
                    <span className={`badge ${exp.type === 'Ingreso' ? 'badge-green' : 'badge-red'}`}>
                      {exp.type}
                    </span>
                  </td>
                  <td>{exp.category}</td>
                  <td><strong>{exp.description}</strong></td>
                  <td style={{ fontWeight: 800, color: exp.type === 'Ingreso' ? '#10b981' : '#ef4444' }}>
                    {exp.type === 'Ingreso' ? '+' : '-'}S/ {Number(exp.amount).toFixed(2)}
                  </td>
                  <td><span className="badge badge-blue">{exp.paymentMethod}</span></td>
                  <td>
                    <span style={{ fontWeight: 600 }}>
                      {exp.paidBy === 'luis' ? '👨‍💼 Luis Romero' : '🚀 Kevin Servat'}
                    </span>
                  </td>
                  <td>{exp.month}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {exp.notes || '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <button 
                        className="btn-icon" 
                        style={{ width: '28px', height: '28px', color: 'var(--primary-600)', borderColor: 'rgba(0, 102, 255, 0.3)' }}
                        onClick={() => handleOpenEditExpense(exp)}
                        title="Editar gasto"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        className="btn-icon" 
                        style={{ width: '28px', height: '28px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        onClick={() => onRequestDelete && onRequestDelete(exp, 'Gasto')}
                        title="Eliminar gasto (con registro de auditoría)"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Crear / Editar Gasto */}
      {isNewExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingExpense ? 'Editar Registro de Gasto / Desembolso' : 'Registrar Nuevo Gasto Operativo'}
              </h3>
              <button className="close-btn" onClick={handleCloseExpenseModal}>✕</button>
            </div>

            <form onSubmit={handleCreateExpense}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha del Desembolso:</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={expenseForm.date}
                    onChange={(e) => {
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

                <div className="form-group">
                  <label className="form-label">Categoría:</label>
                  <select 
                    className="form-control"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  >
                    <option value="Compra de mercadería">Compra de mercadería (Chips / Acrílicos)</option>
                    <option value="Publicidad">Publicidad y Pauta Digital</option>
                    <option value="Movilidad">Movilidad / Visitas Comerciales</option>
                    <option value="Teléfono/datos">Teléfono / Datos / Línea</option>
                    <option value="Dominio/sistema">Dominio / Hosting / Software</option>
                    <option value="Empaques y bolsas">Empaques, cajas y stickers</option>
                    <option value="Otro">Otro gasto operativo</option>
                  </select>
                </div>
              </div>

              {/* Selector de Producto de Almacén para cargar costo por default */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    📦 Cargar Producto / Insumo de Almacén (Opcional):
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {products.length} productos en catálogo
                  </span>
                </div>
                <select 
                  className="form-control"
                  value={expenseForm.selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                >
                  <option value="">— Escribir gasto libre o seleccionar producto de Almacén —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      📦 {p.name} — Costo por default: S/ {Number(p.cost).toFixed(2)} | Venta: S/ {Number(p.price).toFixed(2)}
                    </option>
                  ))}
                  {inventory.filter(i => !products.some(p => p.name === i.name)).map(i => (
                    <option key={i.id} value={i.id}>
                      🏷️ {i.name} — Costo unitario: S/ {Number(i.unitCost).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción del Gasto:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Tarjeta Google NFC Cuadrado, Displays de Acrílico..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  required
                />
              </div>

              {/* Panel de Costo Unitario y Opción de Modificar Costo */}
              {expenseForm.selectedProductId ? (
                <div 
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(0, 102, 255, 0.06)',
                    border: '1px solid rgba(0, 102, 255, 0.22)',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🏷️ Costo por Defecto de Almacén: S/ {Number(expenseForm.unitCost || 0).toFixed(2)}
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => setExpenseForm(prev => ({ ...prev, isCustomCost: !prev.isCustomCost }))}
                    >
                      <Edit3 size={13} />
                      <span>{expenseForm.isCustomCost ? 'Restablecer costo por defecto' : 'Modificar costo'}</span>
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Cantidad de Unidades:</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="form-control"
                        value={expenseForm.quantity}
                        onChange={(e) => {
                          const qty = Math.max(1, parseInt(e.target.value) || 1);
                          const unit = Number(expenseForm.unitCost) || 0;
                          setExpenseForm({ ...expenseForm, quantity: qty, amount: (qty * unit).toFixed(2) });
                        }}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>
                        {expenseForm.isCustomCost ? 'Costo Unitario Modificado (S/):' : 'Costo Unitario Aplicado (S/):'}
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control"
                        value={expenseForm.unitCost}
                        readOnly={!expenseForm.isCustomCost}
                        style={{
                          backgroundColor: expenseForm.isCustomCost ? 'var(--bg-input)' : 'rgba(255, 255, 255, 0.04)',
                          borderColor: expenseForm.isCustomCost ? 'var(--primary-600)' : 'var(--border-subtle)',
                          fontWeight: 700
                        }}
                        onChange={(e) => {
                          const unit = e.target.value;
                          const qty = Number(expenseForm.quantity) || 1;
                          setExpenseForm({ ...expenseForm, unitCost: unit, amount: (Number(unit) * qty).toFixed(2) });
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Total del desembolso ({expenseForm.quantity} uds × S/ {Number(expenseForm.unitCost || 0).toFixed(2)}):
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#ef4444' }}>
                      S/ {expenseForm.amount}
                    </strong>
                  </div>

                  {expenseForm.isCustomCost && (
                    <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '6px' }}>
                      ✏️ Costo modificado exclusivamente para este registro de compra sin alterar el catálogo maestro.
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Monto del Desembolso (Soles S/):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">¿Quién pagó el gasto?:</label>
                  <select 
                    className="form-control"
                    value={expenseForm.paidBy}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                  >
                    <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                    <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Método de Pago:</label>
                  <select 
                    className="form-control"
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                  >
                    <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Transferencia BCP">Transferencia BCP</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
              </div>

              {/* Mes Contable Dinámico - Nunca vacío */}
              <div className="form-group">
                <label className="form-label">Mes Contable:</label>
                <select 
                  className="form-control"
                  value={expenseForm.month}
                  onChange={(e) => setExpenseForm({ ...expenseForm, month: e.target.value })}
                  required
                >
                  {ACCOUNTING_MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  ✓ Sincronizado automáticamente con la fecha de desembolso ({expenseForm.date}).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Notas / Instrucción de Cuadre:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  placeholder="Ej: Mitad debitable a fin de mes, factura adjunta..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseExpenseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExpense ? 'Guardar Cambios' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Liquidación entre Socios */}
      {isSettleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Liquidación de Balance 50/50</h3>
              <button className="close-btn" onClick={handleCloseSettleModal}>✕</button>
            </div>

            <form onSubmit={handleConfirmSettle}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Esta acción registra una transferencia para equilibrar las aportaciones entre Luis Romero y Kevin Servat.
              </p>

              <div className="form-group">
                <label className="form-label">Monto a Liquidar (S/):</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-control"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detalle o Comprobante:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseSettleModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Confirmar Liquidación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
