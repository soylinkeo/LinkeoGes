import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

export default function MasterDataModal({
  isOpen,
  onClose,
  districts = [],
  onAddDistrict,
  onDeleteDistrict
}) {
  const [newDistrictName, setNewDistrictName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newDistrictName.trim();
    if (!trimmed) return;

    if (districts.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Este distrito ya se encuentra registrado en el maestro.');
      return;
    }

    onAddDistrict(trimmed);
    setNewDistrictName('');
    setErrorMsg('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 102, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-600)'
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.15rem' }}>Maestro Central de Distritos</h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Se sincroniza automáticamente con Ventas, Leads, NFC y Agenda
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div>
          {/* Formulario para agregar nuevo distrito */}
          <form onSubmit={handleAdd} style={{ marginBottom: '20px' }}>
            <label className="form-label">Agregar Nuevo Distrito a Lima:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-control"
                placeholder="Ej: Jesús María, San Miguel, Los Olivos..."
                value={newDistrictName}
                onChange={(e) => { setNewDistrictName(e.target.value); setErrorMsg(''); }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                <Plus size={16} />
                <span>Agregar</span>
              </button>
            </div>
            {errorMsg && (
              <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '6px' }}>
                {errorMsg}
              </div>
            )}
          </form>

          {/* Lista de distritos actuales */}
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Distritos Activos ({districts.length}):
          </div>

          <div 
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '6px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '6px' }}>
              {districts.map(district => (
                <div 
                  key={district}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>📍 {district}</span>
                  {districts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteDistrict(district)}
                      title={`Eliminar ${district}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Cerrar y Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
