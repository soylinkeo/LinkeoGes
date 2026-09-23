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
  RotateCcw 
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
      {/* Sección Izquierda: Toggle + Estado Socios + Nube */}
      <div className="nav-title-section">
        <button 
          className="btn-icon" 
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
        </button>

        {/* Brand Tag sutil si la barra lateral está colapsada */}
        {sidebarCollapsed && (
          <div 
            onClick={() => setCurrentTab('dashboard')} 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px', marginRight: '6px' }}
          >
            <span style={{ fontSize: '1.2rem' }}>⚡</span>
            <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              Linkeo<span className="brand-ges-tag">Ges</span>
            </span>
          </div>
        )}

        {/* Separador vertical limpio */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)', margin: '0 12px', flexShrink: 0 }} />

        {/* Indicador de Disponibilidad de Socios */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
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

      {/* Sección Derecha: Acciones en Línea con Márgenes y Separación Clara */}
      <div className="nav-actions">
        {/* Grupo 1: Herramientas y Datos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Botón Maestro Distritos */}
          {onOpenMasterData && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onOpenMasterData}
              title="Gestionar distritos atendidos de Lima"
              style={{ height: '38px', padding: '0 13px', fontSize: '0.84rem' }}
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
            style={{ height: '38px', padding: '0 13px', fontSize: '0.84rem' }}
          >
            <Download size={14} />
            <span>Excel</span>
          </button>
        </div>

        {/* Separador vertical 1 */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)', margin: '0 6px', flexShrink: 0 }} />

        {/* Grupo 2: Acciones Principales (Ventas y Gastos) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Botón Nueva Venta (Principal) */}
          <button 
            className="btn btn-primary btn-sm" 
            onClick={onOpenNewSale} 
            title="Registrar nueva venta con chip NFC y Place ID"
            style={{ height: '38px', padding: '0 16px', fontSize: '0.86rem', fontWeight: 700 }}
          >
            <TrendingUp size={15} />
            <span>+ Venta</span>
          </button>

          {/* Botón Nuevo Gasto */}
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onOpenNewExpense} 
            title="Registrar un gasto pagado para conciliación 50/50"
            style={{ height: '38px', padding: '0 15px', fontSize: '0.86rem', fontWeight: 600 }}
          >
            <CreditCard size={15} />
            <span>+ Gasto</span>
          </button>
        </div>

        {/* Separador vertical 2 */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)', margin: '0 6px', flexShrink: 0 }} />

        {/* Grupo 3: Utilidades del Sistema y Perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Botón Reiniciar a 0 */}
          {onResetToZero && (
            <button 
              className="btn-icon" 
              onClick={onResetToZero}
              title="Restablecer registros operativos a 0 (Modo limpio)"
              style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
            >
              <RotateCcw size={15} />
            </button>
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
                gap: '8px', 
                borderColor: 'var(--primary-600)',
                backgroundColor: 'rgba(0, 102, 255, 0.1)',
                padding: '0 14px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
                fontSize: '0.84rem'
              }}
              title="Ver perfil de socio y cerrar sesión"
            >
              <span style={{ fontSize: '1.05rem' }}>{currentUser.avatar}</span>
              <span style={{ fontWeight: 700 }}>{currentUser.name.split(' ')[0]}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
