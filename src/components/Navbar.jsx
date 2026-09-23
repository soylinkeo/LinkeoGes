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
  isCloudReady = false 
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
          style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
        >
          <Menu size={20} />
        </button>

        {/* Botón Colapsar Sidebar Desktop (Visible en pantallas >= 900px) */}
        <button 
          className="btn-icon desktop-sidebar-btn" 
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
        </button>

        {/* Brand Tag: visible siempre en móvil y cuando el sidebar está colapsado en desktop */}
        <div 
          onClick={() => setCurrentTab('dashboard')} 
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginRight: '4px' 
          }}
          title="Ir al Panel General"
        >
          <span style={{ fontSize: '1.15rem' }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: '0.98rem', letterSpacing: '-0.02em' }}>
            Linkeo<span className="brand-ges-tag">Ges</span>
          </span>
        </div>

        {/* Separador vertical limpio */}
        <div className="nav-separator navbar-partner-statuses" />

        {/* Indicador de Disponibilidad de Socios (Oculto en móvil < 820px, visible en Sidebar Drawer) */}
        <div className="navbar-partner-statuses">
          {/* Luis Romero */}
          <div 
            onClick={onOpenProfile}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 14px', 
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: `1px solid ${currentUser?.id === 'luis' ? 'var(--primary-600)' : 'rgba(16, 185, 129, 0.25)'}`,
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)'
            }}
            title="Clic para gestionar estado de Luis Romero (Co-CEO)"
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', flexShrink: 0 }}></span>
            <span style={{ fontWeight: 700 }}>Luis:</span>
            <span style={{ color: 'var(--google-green)', fontWeight: 600 }}>
              {partnersState?.luis?.status || 'Disponible'}
            </span>
          </div>

          {/* Kevin Servat */}
          <div 
            onClick={onOpenProfile}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 14px', 
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: `1px solid ${currentUser?.id === 'kevin' ? 'var(--primary-600)' : 'rgba(59, 130, 246, 0.25)'}`,
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)'
            }}
            title="Clic para gestionar estado de Kevin Servat (Co-CEO)"
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8', flexShrink: 0 }}></span>
            <span style={{ fontWeight: 700 }}>Kevin:</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>
              {partnersState?.kevin?.status || 'Guardia'}
            </span>
          </div>

          {/* Estado de Sincronización en la Nube Supabase */}
          <div 
            style={{
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.8rem', 
              padding: '6px 13px', 
              borderRadius: 'var(--radius-full)', 
              background: isCloudReady ? 'rgba(16, 185, 129, 0.08)' : 'rgba(234, 179, 8, 0.08)',
              color: isCloudReady ? 'var(--google-green)' : '#eab308',
              border: `1px solid ${isCloudReady ? 'rgba(16, 185, 129, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              marginLeft: '4px'
            }}
            title={isCloudReady ? 'Base de datos Supabase conectada y sincronizada en tiempo real' : 'Modo local (sin nube)'}
          >
            <span>{isCloudReady ? '☁️' : '💾'}</span>
            <span>{isCloudReady ? 'Supabase Nube' : 'Modo Local'}</span>
          </div>
        </div>
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
              style={{ height: '38px', padding: '0 12px', fontSize: '0.84rem' }}
            >
              <MapPin size={14} />
              <span>Distritos</span>
            </button>
          )}

          {/* Botón Exportar Excel */}
          <button 
            className="btn btn-outline-excel btn-sm" 
            onClick={onExportExcel}
            title="Exportar base de datos a Excel (.xlsx)"
            style={{ height: '38px', padding: '0 12px', fontSize: '0.84rem' }}
          >
            <Download size={14} />
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
            style={{ height: '38px', padding: '0 14px', fontSize: '0.84rem', fontWeight: 700 }}
          >
            <TrendingUp size={15} />
            <span>+ Venta</span>
          </button>

          {/* Botón Nuevo Gasto (Oculto en móvil estrecho, accesible en Sidebar Drawer) */}
          <div className="nav-secondary-actions">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={onOpenNewExpense} 
              title="Registrar un gasto pagado para conciliación 50/50"
              style={{ height: '38px', padding: '0 13px', fontSize: '0.84rem', fontWeight: 600 }}
            >
              <CreditCard size={15} />
              <span>+ Gasto</span>
            </button>
          </div>
        </div>

        <div className="nav-separator" />

        {/* Grupo Utilidades y Perfil */}
        <div className="nav-utility-actions">
          {/* Botón Reiniciar a 0 */}
          {onResetToZero && (
            <div className="nav-secondary-actions">
              <button 
                className="btn-icon" 
                onClick={onResetToZero}
                title="Restablecer registros operativos a 0 (Modo limpio)"
                style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          )}

          {/* Toggle Modo Oscuro / Claro */}
          <button 
            className="btn-icon" 
            onClick={toggleTheme}
            title={currentTheme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
          >
            {currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Perfil Usuario Activo */}
          {currentUser && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onOpenProfile}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                borderColor: 'var(--primary-600)',
                backgroundColor: 'rgba(0, 102, 255, 0.1)',
                padding: '0 10px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
                fontSize: '0.84rem'
              }}
              title="Ver perfil de socio y cerrar sesión"
            >
              <span style={{ fontSize: '1.05rem' }}>{currentUser.avatar}</span>
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
