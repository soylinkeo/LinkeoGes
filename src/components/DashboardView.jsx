import { calculateFinance } from '../utils/financeUtils.js';
import { calculatePartnerCashAccounts, calculateUnitsProjection } from '../utils/projectionsUtils.js';
import { getAccountingMonth, localDate, ACCOUNTING_MONTHS } from '../utils/dateUtils.js';
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Users, 
  CheckCircle2, 
  QrCode, 
  ExternalLink, 
  ShoppingBag, 
  Trash2,
  Edit3,
  Wallet,
  ArrowRightLeft
} from 'lucide-react';

export default function DashboardView({
  sales = [],
  expenses = [],
  nfcCards = [],
  inventory = [],
  leads = [],
  targets = {},
  partnerBalance = {},
  setCurrentTab,
  onOpenCardDetails,
  onOpenNewSale,
  onOpenNewExpense,
  onRequestDelete,
  projectionsData,
  onUpdateProjectionsData,
  showToast
}) {
  // Cálculos financieros globales
  const { totalSalesAmount, totalCost, totalGrossProfit, totalExpenses, netProfit } = calculateFinance(sales, expenses);

  // Período contable actual para ventas del mes
  const currentAccountingMonth = getAccountingMonth(localDate());
  const currentMonthLabel = ACCOUNTING_MONTHS[currentAccountingMonth] || currentAccountingMonth;

  // Filtrado de ventas que pertenecen al mes actual
  const monthlySales = useMemo(() => {
    return sales.filter(s => {
      if (!s.date) return true; // Ventas sin fecha o registradas en vivo se asocian al período corriente
      return getAccountingMonth(s.date) === currentAccountingMonth;
    });
  }, [sales, currentAccountingMonth]);

  const monthlySalesAmount = useMemo(() => {
    return monthlySales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  }, [monthlySales]);

  // Sincronización automática con la Venta Mensual Bruta calculada desde el mix de Proyecciones
  const unitsProjection = useMemo(() => {
    return calculateUnitsProjection(projectionsData || {});
  }, [projectionsData]);

  const revenueTarget = Number(
    unitsProjection.grossRevenue > 0
      ? unitsProjection.grossRevenue
      : (targets?.monthlyRevenueEstimate || 2100.00)
  );

  const revenueProgressPct = revenueTarget > 0
    ? Math.min(100, Math.round((monthlySalesAmount / revenueTarget) * 100))
    : 0;
  
  // Unidades vendidas e inventario físico total
  const totalUnitsSold = sales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  const totalInventoryStock = inventory.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const inventoryCapacity = totalInventoryStock + totalUnitsSold;
  const unitsProgressPct = inventoryCapacity > 0 ? Math.min(100, Math.round((totalUnitsSold / inventoryCapacity) * 100)) : 0;

  // Cálculos de recaudación en cuentas personales y conciliación 50/50
  const partnerCashAccounts = projectionsData?.partnerCashAccounts || null;
  const cashCalculations = useMemo(() => {
    return calculatePartnerCashAccounts(sales, partnerCashAccounts);
  }, [sales, partnerCashAccounts]);

  const {
    autoLuis,
    autoKevin,
    luisHeld,
    kevinHeld,
    totalInAccounts,
    pendingToAccount,
    debtLuisToKevin: debtBetweenPartnersForSales
  } = cashCalculations;

  const accountsProgressPct = totalSalesAmount > 0 
    ? Math.min(100, Math.round((totalInAccounts / totalSalesAmount) * 100)) 
    : (totalInAccounts > 0 ? 100 : 0);

  // Modal para configurar custodia de cuentas personales
  const [isCashAccountsModalOpen, setIsCashAccountsModalOpen] = useState(false);
  const [manualLuisCash, setManualLuisCash] = useState('');
  const [manualKevinCash, setManualKevinCash] = useState('');

  const handleOpenCashAccountsModal = () => {
    setManualLuisCash(luisHeld.toString());
    setManualKevinCash(kevinHeld.toString());
    setIsCashAccountsModalOpen(true);
  };

  const handleSaveCashAccounts = (e) => {
    e.preventDefault();
    const numLuis = parseFloat(manualLuisCash);
    const numKevin = parseFloat(manualKevinCash);

    if (isNaN(numLuis) || numLuis < 0 || isNaN(numKevin) || numKevin < 0) {
      if (showToast) showToast('Ingresa montos válidos para ambos socios', 'warning');
      return;
    }

    if (onUpdateProjectionsData) {
      onUpdateProjectionsData({
        ...(projectionsData || {}),
        partnerCashAccounts: {
          luis: numLuis,
          kevin: numKevin,
          isCustom: true,
          updatedAt: new Date().toISOString()
        }
      });
      if (showToast) {
        showToast('✓ Distribución de ventas en cuentas personales guardada', 'success');
      }
    }
    setIsCashAccountsModalOpen(false);
  };

  const handleResetToAutoSales = () => {
    setManualLuisCash(autoLuis.toString());
    setManualKevinCash(autoKevin.toString());
  };

  // Alertas de inventario
  const lowStockItems = inventory.filter(i => i.quantity <= i.minThreshold);

  return (
    <div className="dashboard-view" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {targets.isFeasible === false && <p role="alert">{targets.warning}</p>}
      {/* Encabezado Principal Despejado y Elegante (Sin cajas pesadas) */}
      <div className="dashboard-header">
        <div>
          <div className="dashboard-header-eyebrow">
            <span className="live-dot"></span>
            <span>Sistema Operativo Comercial · Co-CEOs 50/50</span>
          </div>
          <h1 className="dashboard-title">
            Panel General <span className="brand-ges-tag">LinkeoGes</span>
          </h1>
          <p className="dashboard-subtitle">
            Supervisión ejecutiva para <strong>Luis Romero</strong> y <strong>Kevin Servat</strong>. 
            Control de ventas NFC, trazabilidad de Google Place IDs y cuadre de aportes al 50/50.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button className="btn btn-secondary" onClick={() => setCurrentTab('nfc-traceability')}>
            <QrCode size={16} />
            <span>Ver Tarjetas NFC</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenNewSale}>
            <TrendingUp size={16} />
            <span>+ Registrar Venta</span>
          </button>
        </div>
      </div>

      {/* Sincronización con Proyecciones Financieras & Metas Manuales */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.22)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.95rem'
          }}>
            🎯
          </div>
          <span style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>
            <strong>Custodia de Ventas (Cuentas Personales):</strong> Ventas Totales: <strong>S/ {totalSalesAmount.toFixed(2)}</strong> · En Cuentas: <strong>S/ {totalInAccounts.toFixed(2)}</strong> (Luis: S/ {luisHeld.toFixed(2)} | Kevin: S/ {kevinHeld.toFixed(2)}) · Resta por conciliar: <strong style={{ color: pendingToAccount > 0 ? '#f59e0b' : '#10b981' }}>S/ {pendingToAccount.toFixed(2)}</strong>.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenCashAccountsModal}
            style={{ fontSize: '0.78rem', padding: '5px 12px', gap: '5px' }}
          >
            <Wallet size={13} />
            <span>Ajustar Dinero en Cuentas</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentTab('projections')}
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            Ajustar en Proyecciones →
          </button>
        </div>
      </div>

      {/* Grid de KPIs Clave */}
      <div className="metrics-grid">
        {/* KPI 1: Facturación / Ventas Mensuales */}
        <div className="kpi-card">
          <div className="kpi-header">
            <div>
              <span className="kpi-label">Ventas Mensuales</span>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                {currentMonthLabel}
              </div>
            </div>
            <div className="kpi-icon-wrapper">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">S/ {monthlySalesAmount.toFixed(2)}</div>
          <div className="kpi-subtext" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>Meta mensual: S/ {revenueTarget.toFixed(2)}</span>
              <button 
                type="button"
                onClick={() => setCurrentTab('projections')}
                style={{ 
                  background: 'rgba(59, 130, 246, 0.12)', 
                  border: '1px solid rgba(59, 130, 246, 0.25)', 
                  cursor: 'pointer', 
                  padding: '2px 7px', 
                  borderRadius: '4px',
                  color: 'var(--primary-400)', 
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  gap: '3px'
                }}
                title="Sincronizada automáticamente con la Venta Mensual Bruta de Proyecciones. Clic para ajustar mix y productos."
              >
                <span>Proyecciones ↗</span>
              </button>
            </span>
            <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
              {revenueProgressPct}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${revenueProgressPct}%` }}></div>
          </div>
          {totalSalesAmount !== monthlySalesAmount && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Total histórico acumulado: <strong>S/ {totalSalesAmount.toFixed(2)}</strong>
            </div>
          )}
        </div>

        {/* KPI 2: Unidades Vendidas */}
        <div className="kpi-card kpi-green">
          <div className="kpi-header">
            <span className="kpi-label">Unidades Vendidas</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-value">
            {totalUnitsSold} <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>/ {totalInventoryStock} uds</span>
          </div>
          <div className="kpi-subtext" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{totalInventoryStock} unidades disponibles en almacén</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>
              {unitsProgressPct}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${unitsProgressPct}%`, background: '#10b981' }}></div>
          </div>
        </div>

        {/* KPI 3: Recaudación en Cuentas Personales (Reemplaza a Utilidad Neta Operativa) */}
        <div className="kpi-card kpi-yellow">
          <div className="kpi-header">
            <span className="kpi-label">Ventas en Cuentas Personales</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: totalInAccounts >= totalSalesAmount && totalSalesAmount > 0 ? '#10b981' : '#f59e0b' }}>
            S/ {totalInAccounts.toFixed(2)}
          </div>
          <div className="kpi-subtext" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>Ventas del negocio: S/ {totalSalesAmount.toFixed(2)}</span>
              <button 
                type="button"
                onClick={handleOpenCashAccountsModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#f59e0b', display: 'inline-flex' }}
                title="Ajustar dinero que tiene cada socio en su cuenta personal"
              >
                <Edit3 size={12} />
              </button>
            </span>
            <span style={{ fontWeight: 700, color: accountsProgressPct >= 100 ? '#10b981' : '#f59e0b' }}>
              {accountsProgressPct}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${accountsProgressPct}%`, background: accountsProgressPct >= 100 ? '#10b981' : '#f59e0b' }}></div>
          </div>
          
          {/* Desglose de quién tiene cuánto y la resta solicitada */}
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-subtle)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
              <span>👨‍💼 Luis: <strong>S/ {luisHeld.toFixed(2)}</strong></span>
              <span>🚀 Kevin: <strong>S/ {kevinHeld.toFixed(2)}</strong></span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: pendingToAccount > 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
              <span>Resta (Ventas – En cuentas):</span>
              <span>S/ {pendingToAccount.toFixed(2)}</span>
            </div>

            {Math.abs(debtBetweenPartnersForSales) > 0.01 ? (
              <div style={{ color: '#38bdf8', fontSize: '0.71rem', marginTop: '2px', fontWeight: 600 }}>
                {debtBetweenPartnersForSales > 0 
                  ? `👉 Luis transfiere S/ ${debtBetweenPartnersForSales.toFixed(2)} a Kevin (50/50)` 
                  : `👉 Kevin transfiere S/ ${Math.abs(debtBetweenPartnersForSales).toFixed(2)} a Luis (50/50)`}
              </div>
            ) : (
              <div style={{ color: '#10b981', fontSize: '0.71rem', marginTop: '2px', fontWeight: 600 }}>
                ✓ Ventas equilibradas al 50/50 (Sin cuenta propia)
              </div>
            )}
          </div>
        </div>

        {/* KPI 4: Balance de Socios ("Cuentas Claras") */}
        <div className="kpi-card kpi-purple">
          <div className="kpi-header">
            <span className="kpi-label">Balance Socios (50/50)</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.85rem', color: (partnerBalance.debtLuisToKevin || 0) === 0 ? '#10b981' : '#f59e0b' }}>
            S/ {Math.abs(partnerBalance.debtLuisToKevin || 0).toFixed(2)}
          </div>
          <div className="kpi-subtext" style={{ fontWeight: 600 }}>
            {(partnerBalance.debtLuisToKevin || 0) > 0 ? (
              <span style={{ color: '#f59e0b' }}>Luis Romero debe a Kevin Servat</span>
            ) : (partnerBalance.debtLuisToKevin || 0) < 0 ? (
              <span style={{ color: '#38bdf8' }}>Kevin Servat debe a Luis Romero</span>
            ) : (
              <span style={{ color: 'var(--google-green)' }}>✓ Cuentas saldadas al 50/50</span>
            )}
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', marginTop: '12px', fontSize: '0.78rem' }}
            onClick={() => setCurrentTab('finances')}
          >
            Ver Detalles de Cuadre →
          </button>
        </div>
      </div>

      {/* Sección Central de 2 Columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
        
        {/* Columna Izquierda: Tarjetas NFC Activas & Enlaces */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <QrCode size={18} color="var(--primary-600)" />
              <span>Últimos Chips NFC y Place IDs Asignados</span>
            </h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentTab('nfc-traceability')}
            >
              Ver Todas ({nfcCards.length})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {nfcCards.length === 0 ? (
              <div className="empty-state-card" style={{ padding: '38px 20px' }}>
                <div className="empty-state-icon">
                  <QrCode size={26} />
                </div>
                <div className="empty-state-title">No hay tarjetas NFC asignadas aún</div>
                <p className="empty-state-subtitle">
                  Al registrar una venta o vincular un chip a un negocio local, aparecerá aquí con su Place ID y QR directo.
                </p>
                <button className="btn btn-secondary btn-sm" onClick={onOpenNewSale}>
                  + Vincular Primer Chip
                </button>
              </div>
            ) : (
              nfcCards.slice(0, 4).map(card => (
                <div 
                  key={card.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'border-color var(--transition-fast)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="code-mono">{card.id}</span>
                      <strong style={{ fontSize: '0.92rem' }}>{card.businessName}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                      <span>📍 {card.district}</span>
                      <span>•</span>
                      <span>{card.model}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a 
                      href={card.reviewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '5px 10px' }}
                      title="Probar enlace de reseña de Google"
                    >
                      <ExternalLink size={14} />
                      <span style={{ fontSize: '0.78rem' }}>Probar</span>
                    </a>
                    <button 
                      className="btn btn-primary btn-sm"
                      style={{ padding: '5px 10px' }}
                      onClick={() => onOpenCardDetails(card)}
                      title="Ver QR y detalles"
                    >
                      QR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna Derecha: Alertas Operativas y Rutas de Socios */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={18} color="#f59e0b" />
              <span>Control Operativo & Disponibilidad</span>
            </h3>
            <span className="badge badge-blue">Co-CEOs 50/50</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Estado de Inventario */}
            {lowStockItems.length > 0 ? (
              <div className="alert alert-warning" style={{ margin: 0 }}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Alerta de Quiebre de Stock ({lowStockItems[0].name})
                  </div>
                  <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                    Quedan solo <strong>{lowStockItems[0].quantity} unidades</strong>.
                    Tiempo de importación: {lowStockItems[0].leadTimeDays || 15} días.
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ marginTop: '8px', fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => setCurrentTab('inventory')}
                  >
                    Gestionar Almacén →
                  </button>
                </div>
              </div>
            ) : (
              <div 
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--google-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Almacén en Estado Óptimo
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {inventory.length > 0 
                      ? `${inventory.length} insumos registrados sin quiebres de stock.` 
                      : 'Almacén limpio listo para registrar tus tarjetas vírgenes y displays.'}
                  </div>
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentTab('inventory')}
                >
                  Almacén →
                </button>
              </div>
            )}

            {/* Coordinación Operativa Co-CEOs */}
            <div 
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(0, 102, 255, 0.06)',
                border: '1px solid rgba(0, 102, 255, 0.18)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.15rem' }}>🤝</span>
                <strong style={{ fontSize: '0.88rem' }}>Dirección Compartida 50/50</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                <strong>Luis Romero</strong> y <strong>Kevin Servat</strong> gestionan las visitas comerciales, 
                configuración de chips NFC y entregas con respaldo mutuo y conciliación equilibrada.
              </p>
            </div>

            {/* Estado del Embudo B2B */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Pipeline Comercial B2B</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {leads.filter(l => l.stage === 'negociacion' || l.stage === 'configurando').length} negociaciones activas en Lima
                </div>
              </div>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentTab('pipeline')}
              >
                Abrir Kanban →
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Tabla de Ventas Recientes */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <ShoppingBag size={18} color="#10b981" />
            <span>Últimas Ventas Registradas</span>
          </h3>
          <button className="btn btn-primary btn-sm" onClick={onOpenNewSale}>
            + Nueva Venta
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' }}>
              <ShoppingBag size={28} />
            </div>
            <div className="empty-state-title">Aún no se han registrado ventas</div>
            <p className="empty-state-subtitle">
              Registra tu primera venta comercial para emitir la tarjeta NFC, vincular el Google Place ID del negocio y actualizar el balance de socios al 50/50.
            </p>
            <button className="btn btn-primary" onClick={onOpenNewSale}>
              <TrendingUp size={16} />
              <span>Registrar Primera Venta</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Venta</th>
                  <th>Fecha</th>
                  <th>Cliente / Negocio</th>
                  <th>Distrito</th>
                  <th>Producto / Pack</th>
                  <th>Total (S/)</th>
                  <th>Margen (S/)</th>
                  <th>Pago</th>
                  <th>Vendedor</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id}>
                    <td><span className="code-mono">{sale.saleNumber || sale.id}</span></td>
                    <td>{sale.date}</td>
                    <td><strong>{sale.clientName}</strong></td>
                    <td>📍 {sale.district}</td>
                    <td>{sale.productName}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>S/ {sale.totalAmount.toFixed(2)}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>+S/ {sale.profit.toFixed(2)}</td>
                    <td><span className="badge badge-blue">{sale.paymentMethod}</span></td>
                    <td>{sale.soldBy === 'luis' ? '👨‍💼 Luis Romero' : '🚀 Kevin Servat'}</td>
                    <td>
                      <span className="badge badge-green">
                        <CheckCircle2 size={12} /> {sale.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon" 
                        style={{ width: '28px', height: '28px', color: '#ef4444' }}
                        onClick={() => onRequestDelete && onRequestDelete(sale, 'Venta')}
                        title="Eliminar venta (con registro de auditoría)"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para configurar custodia de ventas en cuentas personales */}
      {isCashAccountsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} style={{ color: 'var(--primary-500)' }} />
                <span>Custodia de Ventas en Cuentas Personales</span>
              </h3>
              <button className="close-btn" onClick={() => setIsCashAccountsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveCashAccounts}>
              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                ℹ️ <strong>Régimen Transitorio:</strong> Hasta abrir la cuenta bancaria propia de Linkeo, registren aquí cuánto dinero de las ventas cobradas custodia cada socio en sus cuentas (Yape, Plin, BCP, efectivo) para cuadrar y restar contra las ventas totales.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>👨‍💼 Luis Romero</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ventas: S/ {autoLuis.toFixed(2)}</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
                      S/
                    </span>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      style={{ paddingLeft: '38px', fontSize: '1rem', fontWeight: 600 }}
                      value={manualLuisCash}
                      onChange={(e) => setManualLuisCash(e.target.value)}
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>🚀 Kevin Servat</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ventas: S/ {autoKevin.toFixed(2)}</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
                      S/
                    </span>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      style={{ paddingLeft: '38px', fontSize: '1rem', fontWeight: 600 }}
                      value={manualKevinCash}
                      onChange={(e) => setManualKevinCash(e.target.value)}
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Botón rápido para autocompletar con las ventas registradas por cada uno */}
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  onClick={handleResetToAutoSales}
                >
                  ⚡ Autocompletar con ventas registradas (Luis S/ {autoLuis.toFixed(2)} | Kevin S/ {autoKevin.toFixed(2)})
                </button>
              </div>

              {/* Resumen en vivo de resta y cuadre */}
              {(() => {
                const liveLuis = parseFloat(manualLuisCash) || 0;
                const liveKevin = parseFloat(manualKevinCash) || 0;
                const liveTotalHeld = liveLuis + liveKevin;
                const livePending = totalSalesAmount - liveTotalHeld;
                const targetPerPartner = liveTotalHeld / 2;
                const liveTransferDiff = Math.abs(liveLuis - targetPerPartner);

                return (
                  <div style={{ marginTop: '16px', padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Ventas Totales Registradas:</span>
                      <strong style={{ color: 'var(--text-main)' }}>S/ {totalSalesAmount.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total en Cuentas Personales:</span>
                      <strong style={{ color: '#10b981' }}>S/ {liveTotalHeld.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Resta por Ingresar/Conciliar:</span>
                      <strong style={{ color: livePending > 0.01 ? '#eab308' : livePending < -0.01 ? '#3b82f6' : '#10b981' }}>
                        S/ {livePending.toFixed(2)} {livePending > 0.01 ? '(Falta recaudar)' : livePending < -0.01 ? '(Sobrante)' : '(Cuadrado exacto)'}
                      </strong>
                    </div>

                    <div style={{ marginTop: '4px', padding: '8px 10px', borderRadius: 'var(--radius-xs)', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', color: 'var(--text-main)' }}>
                      <strong>⚖️ Nivelación 50/50 entre socios:</strong>
                      <div style={{ marginTop: '2px', fontSize: '0.78rem' }}>
                        {liveTransferDiff < 0.01 ? (
                          <span style={{ color: '#10b981' }}>✓ Las cuentas de ambos están exactamente balanceadas al 50/50 (S/ {targetPerPartner.toFixed(2)} cada uno).</span>
                        ) : liveLuis > liveKevin ? (
                          <span>👉 Luis debe transferir <strong>S/ {liveTransferDiff.toFixed(2)}</strong> a Kevin para quedar 50/50 (S/ {targetPerPartner.toFixed(2)} c/u).</span>
                        ) : (
                          <span>👉 Kevin debe transferir <strong>S/ {liveTransferDiff.toFixed(2)}</strong> a Luis para quedar 50/50 (S/ {targetPerPartner.toFixed(2)} c/u).</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCashAccountsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Custodia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
