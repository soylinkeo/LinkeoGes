import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Plus, 
  Kanban, 
  DollarSign, 
  Menu,
  ShoppingBag,
  TrendingDown,
  UserPlus,
  X
} from 'lucide-react';

export default function MobileBottomNav({
  currentTab,
  setCurrentTab,
  onOpenNewSale,
  onOpenNewExpense,
  toggleMobileMenu,
  nfcCardsCount = 0,
  leadsCount = 0
}) {
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  const handleAction = (callback) => {
    setQuickActionOpen(false);
    if (callback) callback();
  };

  return (
    <>
      {/* Hoja de Acciones Rápidas Móvil (Bottom Sheet) */}
      {quickActionOpen && (
        <div 
          className="mobile-quick-overlay"
          onClick={() => setQuickActionOpen(false)}
        >
          <div 
            className="mobile-quick-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                ⚡ Operación Rápida
              </div>
              <button 
                className="btn-icon" 
                style={{ width: '32px', height: '32px' }}
                onClick={() => setQuickActionOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-quick-grid">
              <button 
                className="mobile-quick-btn quick-sale"
                onClick={() => handleAction(onOpenNewSale)}
              >
                <div className="quick-icon-circle" style={{ background: 'rgba(0, 102, 255, 0.15)', color: '#0066ff' }}>
                  <ShoppingBag size={22} />
                </div>
                <div className="quick-btn-text">
                  <strong>+ Nueva Venta</strong>
                  <span>Descuenta stock y crea tarjeta</span>
                </div>
              </button>

              <button 
                className="mobile-quick-btn quick-expense"
                onClick={() => handleAction(onOpenNewExpense)}
              >
                <div className="quick-icon-circle" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <TrendingDown size={22} />
                </div>
                <div className="quick-btn-text">
                  <strong>+ Registrar Gasto</strong>
                  <span>Compras de mercadería o cuadres</span>
                </div>
              </button>

              <button 
                className="mobile-quick-btn quick-nfc"
                onClick={() => handleAction(() => setCurrentTab('nfc-traceability'))}
              >
                <div className="quick-icon-circle" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                  <Cpu size={22} />
                </div>
                <div className="quick-btn-text">
                  <strong>Gestionar Tarjetas</strong>
                  <span>UIDs, Google Place IDs y QR</span>
                </div>
              </button>

              <button 
                className="mobile-quick-btn quick-lead"
                onClick={() => handleAction(() => setCurrentTab('pipeline'))}
              >
                <div className="quick-icon-circle" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <UserPlus size={22} />
                </div>
                <div className="quick-btn-text">
                  <strong>Pipeline de Clientes</strong>
                  <span>Prospectos y citas comerciales</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Navegación Inferior Fija (iOS Tab Bar) */}
      <nav className="mobile-bottom-nav" aria-label="Navegación móvil principal">
        <button 
          className={`nav-tab-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
          title="Panel General"
        >
          <LayoutDashboard size={20} />
          <span>Panel</span>
        </button>

        <button 
          className={`nav-tab-item ${currentTab === 'nfc-traceability' ? 'active' : ''}`}
          onClick={() => setCurrentTab('nfc-traceability')}
          title="Chips NFC"
        >
          <div style={{ position: 'relative' }}>
            <Cpu size={20} />
            {nfcCardsCount > 0 && <span className="mobile-tab-badge">{nfcCardsCount}</span>}
          </div>
          <span>NFC</span>
        </button>

        {/* Botón Central Flotante de Acción Rápida */}
        <div className="nav-center-action">
          <button 
            className="mobile-fab-btn"
            onClick={() => setQuickActionOpen(!quickActionOpen)}
            title="Crear nueva operación"
            aria-label="Registrar nueva operación"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        <button 
          className={`nav-tab-item ${currentTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setCurrentTab('pipeline')}
          title="Pipeline B2B"
        >
          <div style={{ position: 'relative' }}>
            <Kanban size={20} />
            {leadsCount > 0 && <span className="mobile-tab-badge">{leadsCount}</span>}
          </div>
          <span>Pipeline</span>
        </button>

        <button 
          className={`nav-tab-item ${currentTab === 'finances' ? 'active' : ''}`}
          onClick={() => setCurrentTab('finances')}
          title="Finanzas 50/50"
        >
          <DollarSign size={20} />
          <span>Finanzas</span>
        </button>

        <button 
          className="nav-tab-item"
          onClick={toggleMobileMenu}
          title="Más módulos"
        >
          <Menu size={20} />
          <span>Más</span>
        </button>
      </nav>
    </>
  );
}
