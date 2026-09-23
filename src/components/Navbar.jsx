import React from 'react';
import { 
  Sun, 
  Moon, 
  Download, 
  CreditCard, 
  TrendingUp, 
  PanelLeftClose, 
  PanelLeftOpen, 
  MapPin, 
  RotateCcw,
  Menu
} from 'lucide-react';

export default function Navbar({ 
  currentTheme, 
  toggleTheme, 
  partnersState, 
  currentTab, 
  setCurrentTab, 
  sidebarCollapsed, 
  toggleSidebar, 
  onPartnerStatusChange, 
  onOpenNewSale, 
  onOpenNewExpense, 
  onOpenNewNfc, 
  onExportExcel, 
  toggleMobileMenu, 
  currentUser, 
  onOpenProfile, 
  onOpenMasterData, 
  onResetToZero, 
  onLoadDemoData, 
  isCloudReady = false,
  onSyncCloud,
  isSyncing = false
}) {
  return (
    <header className="top-navbar">
      {/* Sección Izquierda: Toggle Móvil / Desktop + Brand + Estado Socios */}
      <div className="nav-title-section">
        {/* Botón Menú Hamburguesa Móvil (Visible solo en pantallas < 900px) */}
        <button 
          className="btn-icon mobile-menu-btn" 
          onClick={toggleMobileMenu}
          title="Abrir menú de navegación"
          style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
        >
          <Menu size={20} />
        </button>

        {/* Botón Colapsar Sidebar Desktop (Visible en pantallas >= 900px) */}
        <button 
          className="btn-icon desktop-sidebar-btn" 
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        {/* Brand Tag: visible solo cuando el sidebar está colapsado en desktop */}
        {sidebarCollapsed && (
          <div 
            onClick={() => setCurrentTab('dashboard')} 
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              marginLeft: '4px' 
            }}
            title="Ir al Panel General"
          >
            <span style={{ fontSize: '1.15rem' }}>⚡</span>
            <span style={{ fontWeight: 800, fontSize: '0.98rem', letterSpacing: '-0.02em' }}>
              Linkeo<span className="brand-ges-tag">Ges</span>
            </span>
          </div>
        )}
      </div>

      {/* Sección Derecha: Acciones Rápidas (Adaptadas para Móvil) */}
      <div className="nav-actions">
        {/* Grupo Secundario: Distritos y Excel (Se ocultan en móvil < 640px, disponibles en Sidebar Drawer) */}
        <div className="nav-secondary-actions">
          {/* Botón Maestro Distritos */}
          {onOpenMasterData && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onOpenMasterData}
              title="Gestionar distritos atendidos de Lima"
              style={{ height: '40px', padding: '0 14px', fontSize: '0.85rem', gap: '8px' }}
            >
              <MapPin size={16} />
              <span>Distritos</span>
            </button>
          )}

          {/* Botón Exportar Excel */}
          <button 
            className="btn btn-outline-excel btn-sm" 
            onClick={onExportExcel}
            title="Exportar base de datos a Excel (.xlsx)"
            style={{ height: '40px', padding: '0 14px', fontSize: '0.85rem', gap: '8px' }}
          >
            <Download size={16} />
            <span>Excel</span>
          </button>
        </div>

        <div className="nav-separator nav-secondary-actions" />

        {/* Grupo Principal: Nueva Venta (Siempre visible) + Nuevo Gasto (Secundario en móvil) */}
        <div className="nav-primary-actions">
          {/* Botón Nueva Venta (Principal, visible en móvil) */}
          <button 
            className="btn btn-primary btn-sm" 
            onClick={onOpenNewSale} 
            title="Registrar nueva venta con chip NFC y Place ID"
            style={{ height: '40px', padding: '0 16px', fontSize: '0.86rem', fontWeight: 700, gap: '8px' }}
          >
            <TrendingUp size={16} />
            <span>+ Venta</span>
          </button>

          {/* Botón Nuevo Gasto (Oculto en móvil estrecho, accesible en Sidebar Drawer) */}
          <div className="nav-secondary-actions">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={onOpenNewExpense} 
              title="Registrar un gasto pagado para conciliación 50/50"
              style={{ height: '40px', padding: '0 15px', fontSize: '0.86rem', fontWeight: 600, gap: '8px' }}
            >
              <CreditCard size={16} />
              <span>+ Gasto</span>
            </button>
          </div>
        </div>

        <div className="nav-separator" />

        {/* Grupo Utilidades y Perfil */}
        <div className="nav-utility-actions">
          {/* Botón Sincronizar con la Nube */}
          {onSyncCloud && (
            <div className="nav-secondary-actions">
              <button 
                className="btn-icon" 
                onClick={onSyncCloud}
                disabled={isSyncing}
                title="Sincronizar y actualizar datos con Supabase Nube"
                style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0, opacity: isSyncing ? 0.6 : 1 }}
              >
                <RotateCcw size={17} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>
          )}

          {/* Toggle Modo Oscuro / Claro */}
          <button 
            className="btn-icon" 
            onClick={toggleTheme}
            title={currentTheme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
          >
            {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Perfil Usuario Activo */}
          {currentUser && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onOpenProfile}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                borderColor: 'var(--primary-600)',
                backgroundColor: 'rgba(0, 102, 255, 0.12)',
                padding: '0 14px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
                fontSize: '0.86rem'
              }}
              title="Ver perfil de socio y cerrar sesión"
            >
              <span style={{ fontSize: '1.15rem' }}>{currentUser.avatar}</span>
              <span className="nav-user-name" style={{ fontWeight: 700 }}>
                {currentUser.name.split(' ')[0]}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
