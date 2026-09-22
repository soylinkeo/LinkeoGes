import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Users, 
  CheckCircle2, 
  ArrowUpRight, 
  QrCode, 
  Calendar,
  ExternalLink,
  Sparkles,
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

  // Alertas de inventario
  const lowStockItems = inventory.filter(i => i.quantity <= i.minThreshold);

  return (
    <div className="dashboard-view">
      {/* Banner de Bienvenida */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.15) 0%, rgba(11, 87, 208, 0.05) 100%)',
          border: '1px solid rgba(0, 102, 255, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.4rem' }}>👋</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Panel de Control | Linkeo<span className="brand-ges-tag">Ges</span>
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '650px' }}>
            Bienvenido, Luis Romero y Kevin Servat. Control de ventas NFC, trazabilidad de Place IDs de Google, 
            pipeline B2B y balance financiero 50/50.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={onOpenNewSale}>
            <TrendingUp size={16} />
            <span>Registrar Venta</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setCurrentTab('nfc-traceability')}>
            <QrCode size={16} />
            <span>Ver Tarjetas NFC</span>
          </button>
        </div>
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
            <span style={{ fontWeight: 700, color: 'var(--primary-600)', marginLeft: 'auto' }}>
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
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-value">{totalUnitsSold} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {unitsTarget} uds</span></div>
          <div className="kpi-subtext">
            <span>{unitsTarget - totalUnitsSold} unidades para la meta de S/ 4,000</span>
            <span style={{ fontWeight: 700, color: '#10b981', marginLeft: 'auto' }}>
              {unitsProgressPct}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${unitsProgressPct}%`, background: '#10b981' }}></div>
          </div>
        </div>

        {/* KPI 3: Utilidad Acumulada */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Utilidad Neta Operativa</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: netProfit >= 0 ? '#10b981' : '#f59e0b' }}>
            S/ {netProfit.toFixed(2)}
          </div>
          <div className="kpi-subtext">
            <span>Margen bruto S/ {totalGrossProfit.toFixed(2)} - Gastos S/ {totalExpenses.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '8px' }}>
            Fase inicial de inversión en mercadería (lote de 15 tarjetas)
          </div>
        </div>

        {/* KPI 4: Balance de Socios ("Cuentas Claras") */}
        <div className="kpi-card kpi-yellow">
          <div className="kpi-header">
            <span className="kpi-label">Balance Socios (50/50)</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.45rem', color: '#f59e0b' }}>
            S/ {Math.abs(partnerBalance.debtLuisToKevin || 0).toFixed(2)}
          </div>
          <div className="kpi-subtext" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            {partnerBalance.debtLuisToKevin > 0 ? (
              <span>Luis Romero debe a Kevin Servat</span>
            ) : (
              <span>Kevin Servat debe a Luis Romero</span>
            )}
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', marginTop: '10px', fontSize: '0.78rem' }}
            onClick={() => setCurrentTab('finances')}
          >
            Ver Detalles de Cuadre →
          </button>
        </div>
      </div>

      {/* Sección Central de 2 Columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
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
            {nfcCards.slice(0, 4).map(card => (
              <div 
                key={card.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'border-color var(--transition-fast)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="code-mono">{card.id}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{card.businessName}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
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
                    style={{ padding: '4px 8px' }}
                    title="Probar enlace de reseña de Google"
                  >
                    <ExternalLink size={14} />
                    <span style={{ fontSize: '0.75rem' }}>Probar</span>
                  </a>
                  <button 
                    className="btn btn-primary btn-sm"
                    style={{ padding: '4px 8px' }}
                    onClick={() => onOpenCardDetails(card)}
                    title="Ver QR y detalles"
                  >
                    QR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Alertas Operativas y Rutas de Socios */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={18} color="#f59e0b" />
              <span>Alertas Operativas & Disponibilidad</span>
            </h3>
            <span className="badge badge-yellow">Acción Requerida</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Alerta de Stock Crítico */}
            {lowStockItems.length > 0 && (
              <div className="alert alert-warning" style={{ margin: 0 }}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Alerta de Quiebre de Stock (AliExpress)
                  </div>
                  <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                    Quedan solo <strong>{lowStockItems[0].quantity} unidades</strong> de Tarjetas Vírgenes (Mínimo: 20).
                    Tiempo de importación: 15-18 días. Se debe realizar pedido a proveedor pronto.
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ marginTop: '8px', fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => setCurrentTab('inventory')}
                  >
                    Gestionar Proveedores →
                  </button>
                </div>
              </div>
            )}

            {/* Coordinación Operativa Co-CEOs */}
            <div 
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(0, 102, 255, 0.08)',
                border: '1px solid rgba(0, 102, 255, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.1rem' }}>🤝</span>
                <strong style={{ fontSize: '0.85rem' }}>Coordinación Operativa Co-CEOs Activa</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                <strong>Luis Romero</strong> y <strong>Kevin Servat</strong> comparten la dirección comercial y operativa al 50/50. 
                Los prospectos, visitas y entregas se gestionan de manera coordinada con respaldo mutuo inmediato.
              </p>
            </div>

            {/* Estado del Embudo B2B */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Leads en Negociación</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {leads.filter(l => l.stage === 'negociacion' || l.stage === 'configurando').length} negocios activos en Lima
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
      </div>
    </div>
  );
}
