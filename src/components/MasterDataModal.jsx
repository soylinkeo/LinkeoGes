import React, { useState, useMemo } from 'react';
import { MapPin, Plus, Trash2, Check, AlertCircle, Search, Database } from 'lucide-react';

export default function MasterDataModal({
  isOpen,
  onClose,
  districts = [],
  onAddDistrict,
  onDeleteDistrict
}) {
  const [newDistrictName, setNewDistrictName] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filteredDistricts = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return districts;
    return districts.filter(d => d.toLowerCase().includes(q));
  }, [districts, searchFilter]);

  if (!isOpen) return null;

  const handleAdd = (e) => {
    if (e) e.preventDefault();
    const trimmed = newDistrictName.trim();
    if (!trimmed) return false;

    if (districts.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`"${trimmed}" ya se encuentra registrado en el maestro.`);
      setNewDistrictName('');
      setSuccessMsg('');
      return false;
    }

    onAddDistrict(trimmed);
    setNewDistrictName('');
    setErrorMsg('');
    setSuccessMsg(`✓ Distrito "${trimmed}" guardado y sincronizado con la base de datos.`);
    setTimeout(() => setSuccessMsg(''), 4000);
    return true;
  };

  const handleCloseAndSave = () => {
    // Si el usuario escribió un distrito en la caja pero no pulsó "Agregar", agregarlo automáticamente
    const trimmed = newDistrictName.trim();
    if (trimmed) {
      if (!districts.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
        onAddDistrict(trimmed);
      }
    }
    setNewDistrictName('');
    setErrorMsg('');
    setSuccessMsg('');
    setSearchFilter('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 102, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-600)'
              }}
            >
              <MapPin size={22} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.15rem' }}>Maestro Central de Distritos</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '0.68rem', 
                  padding: '2px 7px', 
                  borderRadius: '4px', 
                  backgroundColor: 'rgba(16, 185, 129, 0.12)', 
                  color: '#10b981', 
                  fontWeight: 600,
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <Database size={11} />
                  Base de Datos Cloud: Supabase (Tabla `districts`)
                </span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={handleCloseAndSave}>✕</button>
        </div>

        <div>
          {/* Formulario para agregar nuevo distrito */}
          <form onSubmit={handleAdd} style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.84rem' }}>
              Agregar Nuevo Distrito a Lima:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-control"
                placeholder="Ej: La Victoria, Jesús María, Los Olivos..."
                value={newDistrictName}
                onChange={(e) => { setNewDistrictName(e.target.value); setErrorMsg(''); setSuccessMsg(''); }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0, padding: '0 16px' }}>
                <Plus size={16} />
                <span>Agregar</span>
              </button>
            </div>

            {errorMsg && (
              <div style={{ 
                fontSize: '0.78rem', 
                color: '#ef4444', 
                marginTop: '6px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px' 
              }}>
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ 
                fontSize: '0.78rem', 
                color: '#10b981', 
                marginTop: '6px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px' 
              }}>
                <Check size={14} />
                <span>{successMsg}</span>
              </div>
            )}
          </form>

          {/* Encabezado de la lista con buscador */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '8px' 
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Distritos Activos ({districts.length}):
            </div>
            {districts.length > 8 && (
              <div style={{ position: 'relative', width: '180px' }}>
                <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Buscar distrito..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ fontSize: '0.74rem', padding: '4px 8px 4px 26px', height: '28px' }}
                />
              </div>
            )}
          </div>

          {/* Grilla de distritos actuales */}
          <div 
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '8px'
            }}
          >
            {filteredDistricts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '6px' }}>
                {filteredDistricts.map(district => (
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
                      fontSize: '0.82rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>📍 {district}</span>
                    {districts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteDistrict(district)}
                        title={`Eliminar ${district} de la base de datos`}
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
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.80rem' }}>
                No se encontraron distritos con "<strong>{searchFilter}</strong>".
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '12px'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              💡 Se sincroniza con Ventas, Leads, NFC y Agenda en tiempo real.
            </span>
            <button type="button" className="btn btn-primary" onClick={handleCloseAndSave}>
              Cerrar y Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
