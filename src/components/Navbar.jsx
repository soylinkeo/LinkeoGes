import React from 'react';
import { 
  Sun, 
  Moon, 
  Download, 
  PlusCircle, 
  CreditCard, 
  TrendingUp, 
  Cpu,
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
      <div className="nav-title-section">
        {/* Botón para expandir/colapsar sidebar y tener pantalla completa */}
        <button 
          className="btn-icon" 
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral (Modo Pantalla Completa)"}
          style={{ marginRight: '4px' }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <div className="nav-logo" onClick={() => setCurrentTab('dashboard')} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '1.25rem' }}>⚡</span>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Linkeo<span className="brand-ges-tag">Ges</span>
            </h2>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
              Control Operativo & CRM
            </p>
          </div>
        </div>

        {/* Separador vertical sutil */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)', margin: '0 8px' }} />

        {/* Indicador de Disponibilidad de Socios / Co-CEOs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Luis */}
          <div 
            onClick={onOpenProfile}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 10px', 
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: `1.5px solid ${currentUser?.id === 'luis' ? 'var(--primary-600)' : 'rgba(16, 185, 129, 0.25)'}`,
              fontSize: '0.76rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Clic para gestionar estado de Luis Romero (Co-CEO)"
          >
            <span style={{ fontSize: '0.9rem' }}>👨‍💼</span>
            <span style={{ fontWeight: 700 }}>Luis Romero (Co-CEO):</span>
            <span style={{ color: 'var(--google-green)', fontWeight: 600 }}>{partnersState.luis?.status || 'Disponible'}</span>
          </div>

          {/* Kevin Servat */}
          <div 
            onClick={onOpenProfile}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 10px', 
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: `1.5px solid ${currentUser?.id === 'kevin' ? 'var(--primary-600)' : 'rgba(59, 130, 246, 0.25)'}`,
              fontSize: '0.76rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Clic para gestionar estado de Kevin Servat (Co-CEO)"
          >
            <span style={{ fontSize: '0.9rem' }}>🚀</span>
            <span style={{ fontWeight: 700 }}>Kevin Servat (Co-CEO):</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{partnersState.kevin?.status || 'Guardia'}</span>
          </div>

          {/* Estado de Sincronización en la Nube Supabase */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              background: isCloudReady ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)',
              color: isCloudReady ? 'var(--google-green)' : '#eab308',
              border: `1px solid ${isCloudReady ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              fontWeight: 600
            }}
            title={isCloudReady ? 'Base de datos Supabase conectada. Los cambios se sincronizan en tiempo real entre socios.' : 'Modo local (sin Supabase conectado)'}
          >
            <span style={{ fontSize: '0.75rem' }}>{isCloudReady ? '☁️' : '💾'}</span>
            <span>{isCloudReady ? 'Supabase Nube' : 'Modo Local'}</span>
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {/* Maestro Distritos */}
        {onOpenMasterData && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onOpenMasterData}
            title="Configurar y gestionar distritos de Lima atendidos"
          >
            <MapPin size={14} />
            <span className="hide-mobile">Distritos</span>
          </button>
        )}

        {/* Cargar Datos en 0 (Modo Default) */}
        {onResetToZero && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onResetToZero}
            title="Restablecer todos los registros operativos a 0 (inicio desde cero)"
          >
            <RotateCcw size={14} />
            <span className="hide-mobile">Datos 0</span>
          </button>
        )}

        {/* Botón Nueva Venta */}
        <button className="btn btn-primary btn-sm" onClick={onOpenNewSale} title="Registrar venta con Place ID">
          <TrendingUp size={15} />
          <span className="hide-mobile">+ Venta</span>
        </button>

        {/* Botón Nuevo Chip NFC */}
        <button className="btn btn-secondary btn-sm" onClick={onOpenNewNfc} title="Vincular nueva tarjeta NFC">
          <Cpu size={15} />
          <span className="hide-mobile">+ Chip NFC</span>
        </button>

        {/* Botón Nuevo Gasto */}
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={onOpenNewExpense} 
          title="Registrar un gasto pagado por Luis Romero o Kevin Servat"
        >
          <CreditCard size={15} />
          <span>+ Gasto</span>
        </button>

        <button 
          className="btn btn-outline-excel btn-sm" 
          onClick={onExportExcel}
          title="Exportar base de datos completa a Excel (.xlsx)"
        >
          <Download size={15} />
          <span>Excel (.xlsx)</span>
        </button>

        {/* Toggle Tema Oscuro / Claro */}
        <button 
          className="btn-icon" 
          onClick={toggleTheme}
          title={currentTheme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Perfil Usuario Activo */}
        {currentUser && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onOpenProfile}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              borderColor: 'var(--primary-600)',
              backgroundColor: 'rgba(0, 102, 255, 0.1)'
            }}
            title="Ver perfil de usuario y cerrar sesión"
          >
            <span style={{ fontSize: '1.1rem' }}>{currentUser.avatar}</span>
            <span style={{ fontWeight: 700 }}>{currentUser.name.split(' ')[0]}</span>
          </button>
        )}
      </div>
    </header>
  );
}
