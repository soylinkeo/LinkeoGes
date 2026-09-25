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
  X,
  AlertTriangle,
  Users
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
  onExportExcel,
  onBackupJson
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
      badgeType: 'phase'
    },
    { 
      id: 'nfc-traceability', 
      label: 'Chips & Enlaces NFC', 
      icon: Cpu,
      badge: nfcCardsCount > 0 ? nfcCardsCount : null,
      badgeType: 'count'
    },
    { 
      id: 'pipeline', 
      label: 'Pipeline B2B (Kanban)', 
      icon: Kanban,
      badge: leadsCount > 0 ? leadsCount : null,
      badgeType: 'count'
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
      badge: inventoryAlertsCount > 0 
        ? (inventoryAlertsCount === 1 ? '1 alerta' : `${inventoryAlertsCount} alertas`) 
        : (productsCount > 0 ? `${productsCount} prods` : null),
      badgeType: inventoryAlertsCount > 0 ? 'alert' : 'count'
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
      badgeType: 'excel'
    },
    { 
      id: 'audit', 
      label: 'Auditoría & Bajas', 
      icon: History,
      badge: null
    }
  ];

  const renderBadge = (item) => {
    if (!item.badge) return null;

    if (item.badgeType === 'alert') {
      return (
        <span className="sidebar-badge badge-alert" title="Artículos por debajo del umbral mínimo de stock">
          <span className="badge-pulse-dot" />
          <AlertTriangle size={11} />
          <span>{item.badge}</span>
        </span>
      );
    }

    if (item.badgeType === 'phase') {
      return (
        <span className="sidebar-badge badge-phase" title="Metodología 5 Fases ERP">
          <span className="badge-phase-pill">5F</span>
          <span>Fases</span>
        </span>
      );
    }

    if (item.badgeType === 'excel') {
      return (
        <span className="sidebar-badge badge-excel" title="Modelado financiero y proyecciones de venta">
          <span>Excel</span>
        </span>
      );
    }

    return (
      <span className="sidebar-badge badge-count">
        {item.badge}
      </span>
    );
  };

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
            title="Cerrar menú"
            aria-label="Cerrar menú lateral"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sección de Socios Co-CEOs y Conectividad en la barra izquierda */}
        {partnersState && !collapsed && (
          <div className="sidebar-partners-section">
            <div className="sidebar-status-header">
              <div className="sidebar-status-title">
                <Users size={12} color="#94a3b8" />
                <span>Socios Co-CEO</span>
              </div>
              <div 
                className={`sidebar-cloud-pill ${isCloudReady ? 'connected' : 'local'}`}
                title={isCloudReady ? 'Base de datos Supabase conectada y sincronizada' : 'Modo de almacenamiento local'}
              >
                <span className="status-dot-pulse" style={{ background: isCloudReady ? '#10b981' : '#eab308' }} />
                <span>{isCloudReady ? 'Supabase Nube' : 'Local'}</span>
              </div>
            </div>

            <div className="sidebar-co-ceos-grid">
              <button
                type="button"
                className={`co-ceo-card ${currentUser?.id === 'luis' ? 'is-current' : ''}`}
                onClick={() => { if (onOpenProfile) onOpenProfile(); if (onCloseMobileMenu) onCloseMobileMenu(); }}
                title="Clic para gestionar perfil y estado de Luis Romero"
              >
                <div className="co-ceo-avatar">👨‍💼</div>
                <div className="co-ceo-meta">
                  <span className="co-ceo-name">Luis</span>
                  <span className="co-ceo-status status-online">
                    <span className="status-dot" />
                    <span>{partnersState.luis?.status || 'Disponible'}</span>
                  </span>
                </div>
              </button>

              <button
                type="button"
                className={`co-ceo-card ${currentUser?.id === 'kevin' ? 'is-current' : ''}`}
                onClick={() => { if (onOpenProfile) onOpenProfile(); if (onCloseMobileMenu) onCloseMobileMenu(); }}
                title="Clic para gestionar perfil y estado de Kevin Servat"
              >
                <div className="co-ceo-avatar">🚀</div>
                <div className="co-ceo-meta">
                  <span className="co-ceo-name">Kevin</span>
                  <span className="co-ceo-status status-blue">
                    <span className="status-dot blue" />
                    <span>{partnersState.kevin?.status || 'Disponible'}</span>
                  </span>
                </div>
              </button>
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
                <Icon size={17} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {renderBadge(item)}
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

          {/* Botón Descargar Respaldo JSON */}
          {onBackupJson && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onBackupJson}
              title="Descargar copia de seguridad completa del sistema en JSON"
              style={{ 
                padding: '8px 12px', 
                fontSize: '0.8rem', 
                color: 'var(--text-main)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '6px',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'flex-start'
              }}
            >
              <Download size={15} color="#3b82f6" />
              <span>Descargar Respaldo JSON</span>
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

