import React from 'react';
import { User, LogOut, CheckCircle, Clock, ShieldCheck, DollarSign, Activity } from 'lucide-react';

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  currentStatus,
  onStatusChange,
  onLogout,
  partnerBalance = {}
}) {
  if (!isOpen || !currentUser) return null;

  const statusOptions = [
    { id: 'Disponible', label: 'Disponible', color: '#10b981', icon: '🟢' },
    { id: 'En Gestión', label: 'En Gestión Comercial / Llamadas', color: '#3b82f6', icon: '📞' },
    { id: 'En Ruta / Visitas', label: 'En Ruta / Visitas Presenciales', color: '#8b5cf6', icon: '🚗' },
    { id: 'Guardia', label: 'De Guardia / Atención Inmediata', color: '#06b6d4', icon: '⚡' },
    { id: 'En Capacitación', label: 'En Capacitación / Formación', color: '#8b5cf6', icon: '📚' },
    { id: 'Ocupado', label: 'Ocupado / En Reunión', color: '#f59e0b', icon: '⛔' },
    { id: 'Ausente', label: 'Ausente (Inactividad 10 min)', color: '#64748b', icon: '💤' }
  ];

  const myPaidAmount = currentUser.id === 'luis' 
    ? (partnerBalance.paidByLuis || 0) 
    : (partnerBalance.paidByKevin || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>{currentUser.avatar}</span>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>{currentUser.name}</h3>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{currentUser.role}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '4px 0' }}>
          {/* Card de Estado Actual y Cambio */}
          <div 
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Estado Operativo en Tiempo Real:
              </span>
              <span className="badge badge-purple">Regla 50/50 Activa</span>
            </div>

            <select 
              className="form-control"
              value={currentStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              style={{ fontWeight: 600, fontSize: '0.9rem' }}
            >
              {statusOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
              💡 Si pasas <strong>10 minutos</strong> sin interacción (clic o teclado), el sistema cambiará tu estado a <em>Ausente</em> para avisar a tu socio automáticamente.
            </div>
          </div>

          {/* Métricas Financieras del Socio */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px'
            }}
          >
            <div 
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px'
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={13} color="#10b981" />
                <span>Total Aportado:</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)' }}>
                S/ {myPaidAmount.toFixed(2)}
              </div>
            </div>

            <div 
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px'
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} color="#38bdf8" />
                <span>Participación:</span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px', color: '#38bdf8' }}>
                50.00%
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onLogout}
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', gap: '6px' }}
            >
              <LogOut size={15} />
              <span>Cerrar Sesión</span>
            </button>

            <button 
              type="button" 
              className="btn btn-primary"
              onClick={onClose}
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
