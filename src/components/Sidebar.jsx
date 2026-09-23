import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Kanban, 
  CalendarDays, 
  Boxes, 
  DollarSign, 
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  History,
  FolderKanban,
  MapPin,
  TrendingUp
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  nfcCardsCount, 
  leadsCount, 
  inventoryAlertsCount,
  auditLogsCount = 0,
  productsCount = 0,
  partnerBalance,
  expenses = [],
  collapsed = false,
  setCollapsed,
  onOpenMasterData
}) {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Panel General', 
      icon: LayoutDashboard,
      badge: null 
    },
    { 
      id: 'lifecycle', 
      label: 'Gestión Proyecto (5F)', 
      icon: FolderKanban,
      badge: '5 Fases',
      badgeColor: 'badge-blue'
    },
    { 
      id: 'nfc-traceability', 
      label: 'Chips & Enlaces NFC', 
      icon: Cpu,
      badge: nfcCardsCount > 0 ? nfcCardsCount : null 
    },
    { 
      id: 'pipeline', 
      label: 'Pipeline B2B (Kanban)', 
      icon: Kanban,
      badge: leadsCount > 0 ? leadsCount : null 
    },
    { 
      id: 'calendar', 
      label: 'Agenda & Tareas', 
      icon: CalendarDays,
      badge: null 
    },
    { 
      id: 'inventory', 
      label: 'Inventario & Proveedores', 
      icon: Boxes,
      badge: inventoryAlertsCount > 0 ? '⚠️ Alerta' : null,
      badgeColor: 'badge-yellow'
    },
    { 
      id: 'finances', 
      label: 'Finanzas & Balances', 
      icon: DollarSign,
      badge: null 
    },
    { 
      id: 'projections', 
      label: 'Proyecciones & Metas', 
      icon: TrendingUp,
      badge: 'Excel',
      badgeColor: 'badge-blue'
    },
    { 
      id: 'products', 
      label: 'Almacén & Catálogo (Precios)', 
      icon: ShoppingBag,
      badge: productsCount > 0 ? productsCount : null 
    },
    { 
      id: 'audit', 
      label: 'Auditoría & Bajas', 
      icon: History,
      badge: null
    }
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div 
          className="sidebar-brand-badge" 
          onClick={() => setCollapsed && setCollapsed(!collapsed)}
          style={{ cursor: 'pointer' }}
          title={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
        >
          <ShieldCheck size={22} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <h1>
              Linkeo<span className="brand-ges-tag">Ges</span>
            </h1>
            <span className="sidebar-subtitle">Sistema Operativo</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`nav-badge ${item.badgeColor || ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {/* Widget Cuentas Claras */}
        <div className="partners-compact-card">
          <div className="partners-compact-header">
            <span>Cuentas Claras</span>
            <span style={{ fontSize: '0.68rem', color: '#10b981' }}>50% / 50%</span>
          </div>

          <div style={{ fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
            Estado de Aportes:
          </div>

          <div style={{ 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            color: (partnerBalance?.debtLuisToKevin || 0) > 0 ? '#f59e0b' : (partnerBalance?.debtLuisToKevin || 0) < 0 ? '#38bdf8' : '#10b981',
            padding: '4px 0',
            lineHeight: 1.2
          }}>
            {(partnerBalance?.debtLuisToKevin || 0) > 0 
              ? `Luis Romero debe debitar S/ ${partnerBalance.debtLuisToKevin.toFixed(2)} a Kevin Servat`
              : (partnerBalance?.debtLuisToKevin || 0) < 0
              ? `Kevin Servat debe debitar S/ ${Math.abs(partnerBalance.debtLuisToKevin).toFixed(2)} a Luis Romero`
              : 'Balance equilibrado (50/50)'
            }
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
            {expenses && expenses.length > 0 
              ? `Último gasto: S/ ${Number(expenses[0].amount).toFixed(2)} (${expenses[0].paidBy === 'luis' ? 'Luis' : 'Kevin'})`
              : 'Sin gastos registrados'}
          </div>
        </div>

        {/* Acceso a Maestro de Distritos */}
        {onOpenMasterData && (
          <button 
            type="button"
            className="nav-item"
            onClick={onOpenMasterData}
            style={{ 
              padding: '8px 12px', 
              fontSize: '0.8rem', 
              color: 'var(--text-main)',
              backgroundColor: 'rgba(0, 102, 255, 0.08)',
              border: '1px solid rgba(0, 102, 255, 0.25)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'flex-start'
            }}
          >
            <MapPin size={15} color="var(--primary-600)" />
            <span>Maestro Distritos Lima</span>
          </button>
        )}

        {/* Enlace al sitio público */}
        <a 
          href="https://linkeocards.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="nav-item"
          style={{ 
            padding: '8px 12px', 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <ExternalLink size={15} />
          <span>Ver linkeocards.com</span>
        </a>
      </div>
    </aside>
  );
}
