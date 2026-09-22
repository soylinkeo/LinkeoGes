import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Plus, 
  Users, 
  CheckCircle, 
  Receipt, 
  CreditCard, 
  ArrowRightLeft,
  Calendar,
  Layers,
  Sparkles,
  Trash2
} from 'lucide-react';

export default function FinanceView({
  sales = [],
  expenses = [],
  onAddNewExpense,
  onAddNewSale,
  onExportExcel,
  partnerBalance = {},
  onSettlePartnerDebt,
  targets = {},
  onRequestDelete
}) {
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'sales' | 'balance'
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterPartner, setFilterPartner] = useState('all');
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Formulario nuevo gasto
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'Gasto',
    category: 'Compra de mercadería',
    description: '',
    amount: '',
    paymentMethod: 'Tarjeta',
    paidBy: 'luis',
    month: 'sep-2026',
    notes: ''
  });

  // Formulario liquidación
  const [settleAmount, setSettleAmount] = useState(Math.abs(partnerBalance.debtLuisToKevin || 0).toFixed(2));
  const [settleNote, setSettleNote] = useState('Transferencia de cuadre vía Yape/BCP');

  // Cálculos
  const totalSalesAmount = sales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  const totalCost = sales.reduce((acc, s) => acc + (Number(s.cost) || 0), 0);
  const totalGrossProfit = totalSalesAmount - totalCost;
  const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netProfit = totalGrossProfit - totalExpenses;

  // Aportes de socios
  const paidByKevin = expenses.filter(e => e.paidBy === 'kevin').reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const paidByLuis = expenses.filter(e => e.paidBy === 'luis').reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const debt = partnerBalance.debtLuisToKevin || 0;

  const handleCreateExpense = (e) => {
    e.preventDefault();
    const newExp = {
      id: `exp-${Date.now()}`,
      date: expenseForm.date,
      type: expenseForm.type,
      category: expenseForm.category,
      description: expenseForm.description,
      amount: Number(expenseForm.amount) || 0,
      paymentMethod: expenseForm.paymentMethod,
      paidBy: expenseForm.paidBy,
      month: expenseForm.month,
      notes: expenseForm.notes
    };

    onAddNewExpense(newExp);
    setIsNewExpenseModalOpen(false);
    setExpenseForm({
      date: new Date().toISOString().slice(0, 10),
      type: 'Gasto',
      category: 'Compra de mercadería',
      description: '',
      amount: '',
      paymentMethod: 'Tarjeta',
      paidBy: 'luis',
      month: 'sep-2026',
      notes: ''
    });
  };

  const handleConfirmSettle = (e) => {
    e.preventDefault();
    onSettlePartnerDebt({
      amount: Number(settleAmount) || 0,
      note: settleNote,
      fromPartner: debt > 0 ? 'luis' : 'kevin',
      toPartner: debt > 0 ? 'kevin' : 'luis'
    });
    setIsSettleModalOpen(false);
  };

  // Filtrado de gastos
  const filteredExpenses = expenses.filter(e => {
    const matchesMonth = filterMonth === 'all' || e.month === filterMonth;
    const matchesPartner = filterPartner === 'all' || e.paidBy === filterPartner;
    return matchesMonth && matchesPartner;
  });

  return (
    <div className="finance-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={24} color="var(--primary-600)" />
            <span>Finanzas, Gastos & Cuentas Claras (50/50)</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Control transparente de desembolsos, conciliación entre Luis Romero y Kevin Servat, y exportación limpia a Excel (.xlsx).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline-excel" onClick={onExportExcel}>
            <Download size={16} />
            <span>Exportar Todo a Excel (.xlsx)</span>
          </button>

          <button className="btn btn-primary" onClick={() => setIsNewExpenseModalOpen(true)}>
            <Plus size={16} />
            <span>+ Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Destacada: Balance entre Socios (Cuentas Claras) */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 26px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{ 
              width: '52px', 
              height: '52px', 
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
              <span>⚖️ <strong>Cuota 50% por socio:</strong> S/ {(totalExpenses / 2).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {Math.abs(debt) > 0.01 && (
          <button 
            className="btn btn-secondary" 
            style={{ borderColor: 'rgba(168, 85, 247, 0.4)' }}
            onClick={() => setIsSettleModalOpen(true)}
          >
            <ArrowRightLeft size={16} />
            <span>Registrar Liquidación / Pago</span>
          </button>
        )}
      </div>

      {/* KPIs Financieros */}
      <div className="metrics-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Facturado en Ventas</span>
            <div className="kpi-icon-wrapper">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">S/ {totalSalesAmount.toFixed(2)}</div>
          <div className="kpi-subtext">Meta mensual estimada: S/ {targets.monthlyRevenueEstimate || 5100}</div>
        </div>

        <div className="kpi-card kpi-red">
          <div className="kpi-header">
            <span className="kpi-label">Gastos & Compras Reales</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="kpi-value">S/ {totalExpenses.toFixed(2)}</div>
          <div className="kpi-subtext">{expenses.length} movimientos registrados</div>
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              className="form-control" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
              value={filterPartner}
              onChange={(e) => setFilterPartner(e.target.value)}
            >
              <option value="all">Todos los Socios</option>
              <option value="luis">Pagado por Luis Romero (Co-CEO)</option>
              <option value="kevin">Pagado por Kevin Servat (Co-CEO)</option>
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
                <th style={{ textAlign: 'center' }}>Acción</th>
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
                    <button 
                      className="btn-icon" 
                      style={{ width: '28px', height: '28px', color: '#ef4444' }}
                      onClick={() => onRequestDelete && onRequestDelete(exp, 'Gasto')}
                      title="Eliminar gasto (con registro de auditoría)"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Nuevo Gasto */}
      {isNewExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewExpenseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Gasto Operativo</h3>
              <button className="close-btn" onClick={() => setIsNewExpenseModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateExpense}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha del Desembolso:</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
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

              <div className="form-group">
                <label className="form-label">Descripción del Gasto:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Lote de 20 acrílicos en L de Acrílicos Perú"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Monto (Soles S/):</label>
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
              </div>

              <div className="form-row">
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

                <div className="form-group">
                  <label className="form-label">Mes Contable:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={expenseForm.month}
                    onChange={(e) => setExpenseForm({ ...expenseForm, month: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas / Instrucción de Cuadre:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  placeholder="Ej: Mitad debitable a fin de mes..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewExpenseModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Liquidación entre Socios */}
      {isSettleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSettleModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Liquidación de Balance 50/50</h3>
              <button className="close-btn" onClick={() => setIsSettleModalOpen(false)}>✕</button>
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
                <button type="button" className="btn btn-secondary" onClick={() => setIsSettleModalOpen(false)}>
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
