import React from 'react';
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
  Trash2 
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
  onRequestDelete
}) {
  // Cálculos financieros
  const totalSalesAmount = sales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  const totalCost = sales.reduce((acc, s) => acc + (Number(s.cost) || 0), 0);
  const totalGrossProfit = totalSalesAmount - totalCost;
  const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netProfit = totalGrossProfit - totalExpenses;
  
  const totalUnitsSold = sales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  const unitsTarget = targets.monthlyUnitsTarget || 75;
  const unitsProgressPct = Math.min(100, Math.round((totalUnitsSold / unitsTarget) * 100));

  const revenueTarget = targets.monthlyRevenueEstimate || 5100;
  const revenueProgressPct = Math.min(100, Math.round((totalSalesAmount / revenueTarget) * 100));

  const profitTarget = targets.monthlyProfitTarget || 4000;
  const profitProgressPct = Math.min(100, Math.max(0, Math.round((netProfit / profitTarget) * 100)));
  const partnerShareTarget = targets.targetPerPartner || (profitTarget / 2);

  // Alertas de inventario
  const lowStockItems = inventory.filter(i => i.quantity <= i.minThreshold);

  return (
    <div className="dashboard-view" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
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

      {/* Sincronización con Proyecciones Financieras */}
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
            <strong>Metas vinculadas a Proyecciones:</strong> Facturación: <strong>S/ {revenueTarget.toFixed(2)}</strong> · Volumen: <strong>{unitsTarget} uds</strong> · Utilidad Neta: <strong>S/ {profitTarget.toFixed(2)}</strong> (S/ {partnerShareTarget.toFixed(2)} por socio al 50/50).
          </span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setCurrentTab('projections')}
          style={{ fontSize: '0.78rem', padding: '5px 12px' }}
        >
          Ajustar en Proyecciones →
        </button>
      </div>

      {/* Grid de KPIs Clave */}
      <div className="metrics-grid">
        {/* KPI 1: Facturación / Ventas */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Ventas Totales</span>
            <div className="kpi-icon-wrapper">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">S/ {totalSalesAmount.toFixed(2)}</div>
          <div className="kpi-subtext">
            <span>Meta mensual: S/ {revenueTarget.toFixed(2)}</span>
            <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
              {revenueProgressPct}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${revenueProgressPct}%` }}></div>
          </div>
        </div>

        {/* KPI 2: Unidades Vendidas */}
        <div className="kpi-card kpi-green">
          <div className="kpi-header">
            <span className="kpi-label">Unidades Vendidas</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-value">{totalUnitsSold} <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>/ {unitsTarget} uds</span></div>
          <div className="kpi-subtext">
            <span>{unitsTarget - totalUnitsSold} unidades para la meta</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>
              {unitsProgressPct}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${unitsProgressPct}%`, background: '#10b981' }}></div>
          </div>
        </div>

        {/* KPI 3: Utilidad Acumulada */}
        <div className="kpi-card kpi-yellow">
          <div className="kpi-header">
            <span className="kpi-label">Utilidad Neta Operativa</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: netProfit >= 0 ? '#10b981' : '#f59e0b' }}>
            S/ {netProfit.toFixed(2)}
          </div>
          <div className="kpi-subtext">
            <span>Meta: S/ {profitTarget.toFixed(2)} (S/ {partnerShareTarget.toFixed(2)} c/u)</span>
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>
              {profitProgressPct}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${profitProgressPct}%`, background: '#f59e0b' }}></div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '8px' }}>
            Margen S/ {totalGrossProfit.toFixed(2)} - Gastos S/ {totalExpenses.toFixed(2)}
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
    </div>
  );
}
