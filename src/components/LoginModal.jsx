import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { verifyUserPassword, PARTNERS_INFO } from '../services/authService';

export default function LoginModal({ onLoginSuccess }) {
  const [selectedUser, setSelectedUser] = useState('luis');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const users = [
    PARTNERS_INFO.luis,
    PARTNERS_INFO.kevin
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const { isValid, user } = await verifyUserPassword(selectedUser, password);
      if (!isValid) {
        setErrorMsg(`Contraseña incorrecta para ${PARTNERS_INFO[selectedUser]?.name || 'el socio'}.`);
        setIsLoading(false);
        return;
      }

      onLoginSuccess(user, rememberMe);
    } catch (err) {
      console.warn('Error al verificar login:', err);
      setErrorMsg('Error al validar credenciales con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 15, 29, 0.95)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card, #111827)',
          border: '1px solid rgba(0, 102, 255, 0.3)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 102, 255, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Encabezado con branding Linkeo */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.2) 0%, rgba(11, 87, 208, 0.08) 100%)',
            padding: '28px 24px 22px 24px',
            textAlign: 'center',
            borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))'
          }}
        >
          <div 
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 12px auto',
              borderRadius: '14px',
              backgroundColor: 'var(--primary-600, #0066ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(0, 102, 255, 0.4)'
            }}
          >
            <ShieldCheck size={32} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Linkeo<span style={{ color: '#0066ff', fontWeight: 900 }}>Ges</span> ERP
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
            Sistema Interno de Gestión Comercial & Operativa
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} style={{ padding: '24px' }}>
          {errorMsg && (
            <div 
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: '#ef4444'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main, #f8fafc)' }}>
              Selecciona tu Usuario:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {users.map(u => {
                const isSelected = selectedUser === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setSelectedUser(u.id); setErrorMsg(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? 'var(--primary-600, #0066ff)' : 'var(--border-subtle, rgba(255, 255, 255, 0.1))'}`,
                      backgroundColor: isSelected ? 'rgba(0, 102, 255, 0.15)' : 'var(--bg-input, rgba(255, 255, 255, 0.04))',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{u.avatar}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? '#38bdf8' : 'var(--text-main, #f8fafc)' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: isSelected ? '#38bdf8' : 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
                        Co-CEO & Dirección General
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main, #f8fafc)' }}>
              Contraseña de Acceso:
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted, #94a3b8)' 
                }} 
              />
              <input 
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Ingresa clave (2109)"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                required
                autoFocus
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '40px',
                  height: '44px',
                  fontSize: '0.95rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Clave por defecto: <strong>2109</strong> (Modificable en Perfil)</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>🔒 Cifrado SHA-256</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
              />
              <span>Mantener sesión iniciada</span>
            </label>
            <span style={{ fontSize: '0.74rem', color: '#f59e0b' }}>⏱️ Inactividad: 10 min</span>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              width: '100%',
              height: '46px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isLoading ? 0.75 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Verificando Credenciales...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
