import React, { useState, useRef } from 'react';
import { LogOut, ShieldCheck, DollarSign, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { changeUserPassword } from '../services/authService';

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  currentStatus,
  onStatusChange,
  onLogout,
  partnerBalance = {},
  logAudit,
  showToast
}) {
  const [showSecuritySection, setShowSecuritySection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const currentPassRef = useRef(null);
  const newPassRef = useRef(null);
  const confirmPassRef = useRef(null);

  const handleModalClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPassError('');
    setPassSuccess('');
    setShowSecuritySection(false);
    if (onClose) onClose();
  };

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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword) {
      setPassError('Por favor ingresa tu contraseña actual.');
      currentPassRef.current?.focus();
      return;
    }
    if (!newPassword || newPassword.trim().length < 4) {
      setPassError('La nueva contraseña debe tener al menos 4 caracteres.');
      setNewPassword('');
      setConfirmPassword('');
      newPassRef.current?.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('La confirmación de la nueva contraseña no coincide.');
      setConfirmPassword('');
      confirmPassRef.current?.focus();
      return;
    }
    if (newPassword === currentPassword) {
      setPassError('La nueva contraseña no puede ser idéntica a la actual.');
      setNewPassword('');
      setConfirmPassword('');
      newPassRef.current?.focus();
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changeUserPassword(currentUser.id, currentPassword, newPassword);
      if (res.success) {
        setPassSuccess('¡Contraseña actualizada y hasheada (SHA-256) exitosamente en la base de datos!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (showToast) {
          showToast('Contraseña de acceso actualizada correctamente', 'success');
        }
        if (logAudit) {
          logAudit({
            actionType: 'Seguridad',
            entityType: 'Credenciales',
            entityId: currentUser.id,
            entityName: `${currentUser.name} (Seguridad)`,
            reason: `Cambio de contraseña de socio registrado y cifrado en base de datos.`
          });
        }
      }
    } catch (err) {
      const msg = err.message || 'Error al actualizar la contraseña.';
      setPassError(msg);
      // Limpiar celda de contraseña actual si falló la verificación
      setCurrentPassword('');
      currentPassRef.current?.focus();
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleModalClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>{currentUser.avatar}</span>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>{currentUser.name}</h3>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{currentUser.role}</span>
            </div>
          </div>
          <button className="close-btn" onClick={handleModalClose}>✕</button>
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
              marginBottom: '16px'
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

          {/* Sección de Seguridad y Contraseña */}
          <div 
            style={{
              backgroundColor: 'var(--bg-input)',
              border: showSecuritySection ? '1.5px solid rgba(0, 102, 255, 0.4)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: '20px',
              transition: 'all 0.25s ease'
            }}
          >
            <div 
              onClick={() => {
                setShowSecuritySection(!showSecuritySection);
                setPassError('');
                setPassSuccess('');
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={17} color="#38bdf8" />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Seguridad & Contraseña Personal
                </span>
              </div>
              <span 
                className="badge" 
                style={{ 
                  backgroundColor: showSecuritySection ? 'rgba(0, 102, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: showSecuritySection ? '#38bdf8' : 'var(--text-muted)',
                  fontSize: '0.72rem'
                }}
              >
                {showSecuritySection ? 'Ocultar' : 'Cambiar clave'}
              </span>
            </div>

            {showSecuritySection && (
              <form onSubmit={handlePasswordSubmit} style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                {passError && (
                  <div 
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.78rem',
                      color: '#ef4444'
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{passError}</span>
                  </div>
                )}

                {passSuccess && (
                  <div 
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.78rem',
                      color: '#10b981'
                    }}
                  >
                    <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                    <span>{passSuccess}</span>
                  </div>
                )}

                {/* Contraseña Actual */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Contraseña Actual:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      ref={currentPassRef}
                      type={showCurrentPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Ingresa tu clave actual (def: 2109)"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      style={{ height: '38px', fontSize: '0.85rem', paddingRight: '36px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Nueva Contraseña (mínimo 4 caracteres):
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      ref={newPassRef}
                      type={showNewPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Nueva contraseña secreta"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={4}
                      style={{ height: '38px', fontSize: '0.85rem', paddingRight: '36px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    Confirmar Nueva Contraseña:
                  </label>
                  <input 
                    ref={confirmPassRef}
                    type={showNewPass ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={4}
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isChangingPass}
                  style={{
                    width: '100%',
                    height: '38px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isChangingPass ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Hasheando y Guardando en Base...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Guardar Nueva Clave en Base de Datos</span>
                    </>
                  )}
                </button>
              </form>
            )}
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
              onClick={handleModalClose}
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

