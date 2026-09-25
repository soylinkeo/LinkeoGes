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
  Edit3,
  Clock,
  Check
} from 'lucide-react';
import { getAccountingMonth, ACCOUNTING_MONTHS } from '../utils/dateUtils';
import NewExpenseModal from './NewExpenseModal.jsx';

export default function FinanceView({
  sales = [],
  expenses = [],
  products = [],
  inventory = [],
  onAddNewExpense,
  onEditExpense,
  onReceiveExpenseStock,
  onAddNewSale,
  onExportExcel,
  partnerBalance = {},
  onSettlePartnerDebt,
  targets = {},
  onRequestDelete,
  onAddNewProduct,
  onUpdateInventoryStock,
  showToast,
  currentUser
}) {
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterPartner, setFilterPartner] = useState('all');
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [expenseToReceive, setExpenseToReceive] = useState(null);

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
    inventoryStatus: 'pending',
    addToInventory: true
  });

  // Manejar selección de producto/insumo de almacén para cargar costo por default
  const handleProductChange = (productId) => {
    if (!productId) {
      setExpenseForm(prev => ({
        ...prev,
        selectedProductId: '',
        unitCost: '',
        isCustomCost: false,
        inventoryStatus: 'pending'
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
        amount: total,
        inventoryStatus: 'pending'
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
      inventoryStatus: 'pending',
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
      inventoryStatus: exp.inventoryStatus || (exp.selectedProductId ? 'received' : 'none'),
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
      inventoryStatus: 'pending',
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
        isCustomCost: expenseForm.isCustomCost,
        inventoryStatus: expenseForm.inventoryStatus
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
      isCustomCost: expenseForm.isCustomCost,
      inventoryStatus: expenseForm.selectedProductId ? (expenseForm.inventoryStatus || 'pending') : null
    };

    if (onAddNewExpense({ ...newExp, addToInventory: expenseForm.addToInventory }) === false) return;

    if (showToast) {
      showToast(`✅ Gasto de S/ ${finalAmount.toFixed(2)} registrado exitosamente${expenseForm.selectedProductId && expenseForm.inventoryStatus === 'pending' ? ' (Estado: ⏳ Pendiente de ingreso a almacén)' : ''}`, 'success');
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
                <th>Estado Inventario</th>
                <th>Notas / Impacto en Caja</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => {
                const isPurchase = Boolean(exp.selectedProductId || exp.stockMovements?.length);
                const isPending = isPurchase && exp.inventoryStatus === 'pending';
                const isReceived = isPurchase && exp.inventoryStatus !== 'pending';
                const unitsQty = exp.quantity || exp.stockMovements?.[0]?.quantity || 1;

                return (
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
                    <td>
                      {isPending ? (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.16)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.45)',
                            borderRadius: 'var(--radius-full)',
                            padding: '3px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          onClick={() => setExpenseToReceive(exp)}
                          title="Haz clic para dar OK e ingresar estos productos al inventario físico"
                        >
                          <Clock size={12} />
                          <span>⏳ Pendiente (Dar OK)</span>
                        </button>
                      ) : isReceived ? (
                        <span 
                          className="badge badge-green" 
                          style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Mercadería ya ingresada al inventario físico"
                        >
                          <Check size={12} /> Ingresado ({unitsQty} uds)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {exp.notes || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {isPending && (
                          <button 
                            className="btn-icon" 
                            style={{ width: '28px', height: '28px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.35)' }}
                            onClick={() => setExpenseToReceive(exp)}
                            title="Dar OK e ingresar productos al inventario"
                          >
                            <Check size={13} />
                          </button>
                        )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Crear / Editar Gasto */}
      <NewExpenseModal
        isOpen={isNewExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        onSubmit={handleCreateExpense}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        products={products}
        inventory={inventory}
        currentUser={currentUser}
        showToast={showToast}
        editingExpense={editingExpense}
        onReceiveExpenseStock={onReceiveExpenseStock}
      />



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
      {/* MODAL: Confirmar Recepción de Mercadería (Dar OK e ingresar al inventario) */}
      {expenseToReceive && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '490px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#f59e0b" />
                <h3 className="modal-title">Confirmar Ingreso a Inventario</h3>
              </div>
              <button className="close-btn" onClick={() => setExpenseToReceive(null)}>✕</button>
            </div>

            <div style={{ padding: '8px 0' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '14px', lineHeight: 1.4 }}>
                Esta compra está en estado <strong>⏳ Pendiente</strong>. ¿Confirmas la recepción física del pedido para ingresarlo a almacén?
              </p>

              <div style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                  📦 {expenseToReceive.description}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>🔢 <strong>Cantidad a ingresar:</strong></span>
                    <strong style={{ color: '#10b981', fontSize: '0.9rem' }}>
                      +{expenseToReceive.quantity || expenseToReceive.stockMovements?.[0]?.quantity || 1} unidades
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>💰 <strong>Costo unitario:</strong></span>
                    <span>S/ {Number(expenseToReceive.unitCost || (expenseToReceive.amount / (expenseToReceive.quantity || 1)) || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>💵 <strong>Desembolso total:</strong></span>
                    <span>S/ {Number(expenseToReceive.amount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>📅 <strong>Fecha del desembolso:</strong></span>
                    <span>{expenseToReceive.date} ({expenseToReceive.paidBy === 'luis' ? 'Luis Romero' : 'Kevin Servat'})</span>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                marginBottom: '18px',
                fontSize: '0.78rem',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Check size={16} color="#10b981" />
                <span>
                  Al dar <strong>OK</strong>, los productos se sumarán inmediatamente al inventario real y estarán listos para la venta.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setExpenseToReceive(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 700 }}
                  onClick={() => {
                    if (onReceiveExpenseStock) {
                      onReceiveExpenseStock(expenseToReceive.id);
                    }
                    setExpenseToReceive(null);
                  }}
                >
                  <Check size={15} />
                  <span>✓ Dar OK e Ingresar a Inventario</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
