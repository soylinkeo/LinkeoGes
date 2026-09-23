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
          style={{ width: '34px', height: '34px', flexShrink: 0 }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Brand Tag sutil si la barra lateral está colapsada */}
        {sidebarCollapsed && (
          <div 
            onClick={() => setCurrentTab('dashboard')} 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}
          >
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
              Linkeo<span className="brand-ges-tag">Ges</span>
            </span>
          </div>
        )}

        {/* Separador vertical sutil */}
        <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-subtle)', margin: '0 4px', flexShrink: 0 }} />

        {/* Indicador de Disponibilidad de Socios */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Luis Romero */}
          <div 
            onClick={onOpenProfile}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 10px', 
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${currentUser?.id === 'luis' ? 'var(--primary-600)' : 'rgba(16, 185, 129, 0.25)'}`,
              fontSize: '0.74rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            title="Clic para gestionar estado de Luis Romero (Co-CEO)"
          >
            <span>👨‍💼</span>
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
              gap: '6px', 
              padding: '4px 10px', 
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${currentUser?.id === 'kevin' ? 'var(--primary-600)' : 'rgba(59, 130, 246, 0.25)'}`,
              fontSize: '0.74rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            title="Clic para gestionar estado de Kevin Servat (Co-CEO)"
          >
            <span>🚀</span>
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
              gap: '5px',
              fontSize: '0.72rem',
              padding: '4px 9px',
              borderRadius: 'var(--radius-full)',
              background: isCloudReady ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)',
              color: isCloudReady ? 'var(--google-green)' : '#eab308',
              border: `1px solid ${isCloudReady ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
            title={isCloudReady ? 'Base de datos Supabase conectada y sincronizada en tiempo real' : 'Modo local (sin nube)'}
          >
            <span>{isCloudReady ? '☁️' : '💾'}</span>
            <span>{isCloudReady ? 'Supabase Nube' : 'Modo Local'}</span>
          </div>
        </div>
      </div>

      {/* Sección Derecha: Acciones en Línea */}
      <div className="nav-actions">
        {/* Botón Maestro Distritos */}
        {onOpenMasterData && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onOpenMasterData}
            title="Gestionar distritos atendidos de Lima"
          >
            <MapPin size={14} />
            <span>Distritos</span>
          </button>
        )}

        {/* Botón Nueva Venta (Principal) */}
        <button 
          className="btn btn-primary btn-sm" 
          onClick={onOpenNewSale} 
          title="Registrar nueva venta con chip NFC y Place ID"
        >
          <TrendingUp size={15} />
          <span>+ Venta</span>
        </button>

        {/* Botón Nuevo Gasto */}
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={onOpenNewExpense} 
          title="Registrar un gasto pagado para conciliación 50/50"
        >
          <CreditCard size={15} />
          <span>+ Gasto</span>
        </button>

        {/* Botón Exportar Excel */}
        <button 
          className="btn btn-outline-excel btn-sm" 
          onClick={onExportExcel}
          title="Exportar base de datos a Excel (.xlsx)"
        >
          <Download size={14} />
          <span>Excel</span>
        </button>

        {/* Botón Reiniciar a 0 */}
        {onResetToZero && (
          <button 
            className="btn-icon" 
            onClick={onResetToZero}
            title="Restablecer registros operativos a 0 (Modo limpio)"
            style={{ width: '32px', height: '32px', flexShrink: 0 }}
          >
            <RotateCcw size={15} />
          </button>
        )}

        {/* Separador vertical sutil */}
        <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-subtle)', margin: '0 2px', flexShrink: 0 }} />

        {/* Toggle Modo Oscuro / Claro */}
        <button 
          className="btn-icon" 
          onClick={toggleTheme}
          title={currentTheme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          style={{ width: '32px', height: '32px', flexShrink: 0 }}
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
              padding: '5px 10px',
              flexShrink: 0
            }}
            title="Ver perfil de socio y cerrar sesión"
          >
            <span style={{ fontSize: '1rem' }}>{currentUser.avatar}</span>
            <span style={{ fontWeight: 700 }}>{currentUser.name.split(' ')[0]}</span>
          </button>
        )}
      </div>
    </header>
  );
}
