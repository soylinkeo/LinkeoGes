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
  History,
  FolderKanban,
  MapPin,
  TrendingUp,
  CreditCard,
  Download,
  X
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
  mobileOpen = false,
  onCloseMobileMenu,
  onOpenMasterData,
  partnersState,
  currentUser,
  onOpenProfile,
  isCloudReady = false,
  onOpenNewSale,
  onOpenNewExpense,
  onExportExcel
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
      label: 'Almacén & Inventario', 
      icon: Boxes,
      badge: inventoryAlertsCount > 0 ? '⚠️ Alerta' : (productsCount > 0 ? `${productsCount} prods` : null),
      badgeColor: inventoryAlertsCount > 0 ? 'badge-yellow' : 'badge-blue'
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
      id: 'audit', 
      label: 'Auditoría & Bajas', 
      icon: History,
      badge: null
    }
  ];

  return (
    <>
      {/* Fondo Desenfocado (Backdrop) para cerrar el menú en celular al tocar fuera */}
      <div 
        className={`sidebar-backdrop ${mobileOpen ? 'active' : ''}`}
        onClick={() => onCloseMobileMenu && onCloseMobileMenu()}
        aria-hidden="true"
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
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

          {/* Botón Cerrar Drawer Móvil */}
          <button 
            className="btn-icon mobile-close-btn"
            onClick={() => onCloseMobileMenu && onCloseMobileMenu()}
            style={{ 
              display: 'none', 
              marginLeft: 'auto', 
              width: '32px', 
              height: '32px',
              borderRadius: 'var(--radius-md)'
            }}
            title="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sección de Socios Co-CEOs y Conectividad en la barra izquierda */}
        {partnersState && !collapsed && (
          <div 
            className="sidebar-partners-section" 
            style={{ 
              padding: '10px 14px', 
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '7px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Estado de Co-CEOs
              </div>
              <div 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.68rem',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: isCloudReady ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                  color: isCloudReady ? 'var(--google-green)' : '#eab308',
                  border: `1px solid ${isCloudReady ? 'rgba(16, 185, 129, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
                  fontWeight: 600
                }}
                title={isCloudReady ? 'Base de datos Supabase conectada y sincronizada' : 'Modo local (sin nube)'}
              >
                <span>{isCloudReady ? '☁️' : '💾'}</span>
                <span>{isCloudReady ? 'Supabase Nube' : 'Local'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div 
                onClick={() => { if (onOpenProfile) onOpenProfile(); if (onCloseMobileMenu) onCloseMobileMenu(); }}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '5px 11px', 
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${currentUser?.id === 'luis' ? 'var(--primary-600)' : 'rgba(16, 185, 129, 0.25)'}`,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                title="Clic para gestionar estado de Luis Romero"
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
                <span style={{ fontWeight: 700 }}>Luis:</span>
                <span style={{ color: 'var(--google-green)', fontWeight: 600 }}>{partnersState.luis?.status || 'Disponible'}</span>
              </div>

              <div 
                onClick={() => { if (onOpenProfile) onOpenProfile(); if (onCloseMobileMenu) onCloseMobileMenu(); }}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '5px 11px', 
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: `1px solid ${currentUser?.id === 'kevin' ? 'var(--primary-600)' : 'rgba(59, 130, 246, 0.25)'}`,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                title="Clic para gestionar estado de Kevin Servat"
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }}></span>
                <span style={{ fontWeight: 700 }}>Kevin:</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>{partnersState.kevin?.status || 'Guardia'}</span>
              </div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTab(item.id);
                  if (onCloseMobileMenu) onCloseMobileMenu();
                }}
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
              onClick={() => {
                onOpenMasterData();
                if (onCloseMobileMenu) onCloseMobileMenu();
              }}
              style={{ 
                padding: '8px 12px', 
                fontSize: '0.8rem', 
                color: 'var(--text-main)',
                backgroundColor: 'rgba(0, 102, 255, 0.08)',
                border: '1px solid rgba(0, 102, 255, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '6px',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'flex-start'
              }}
            >
              <MapPin size={15} color="var(--primary-600)" />
              <span>Maestro Distritos Lima</span>
            </button>
          )}

          {/* Exportar Excel */}
          {onExportExcel && (
            <button 
              type="button"
              className="nav-item"
              onClick={() => {
                onExportExcel();
                if (onCloseMobileMenu) onCloseMobileMenu();
              }}
              style={{ 
                padding: '8px 12px', 
                fontSize: '0.8rem', 
                color: 'var(--text-main)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '6px',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'flex-start'
              }}
            >
              <Download size={15} color="var(--google-green)" />
              <span>Exportar Todo a Excel</span>
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
    </>
  );
}

