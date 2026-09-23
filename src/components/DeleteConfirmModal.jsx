import React, { useState, useEffect } from 'react';
import { Trash2, ShieldAlert } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  item,
  entityType,
  onConfirm,
  onClose,
  currentUser
}) {
  const [deletedBy, setDeletedBy] = useState(currentUser?.id || 'luis');
  const [reasonCategory, setReasonCategory] = useState('Error de ingreso / prueba');
  const [detailedReason, setDetailedReason] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      setDeletedBy(currentUser.id);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !item) return null;

  const itemName = item.name || item.businessName || item.title || item.description || item.saleNumber || item.id;
  const itemId = item.id || item.sku || item.saleNumber || '';

  const handleClose = () => {
    setDetailedReason('');
    setReasonCategory('Error de ingreso / prueba');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = `${reasonCategory}: ${detailedReason.trim() || 'Sin observaciones adicionales'}`;
    const activeId = currentUser?.id || 'luis';
    const activeName = currentUser?.name || 'Luis Romero';
    const confirmed = onConfirm({
      item,
      entityType,
      reason: finalReason,
      deletedBy: activeId,
      deletedByName: activeName
    });
    if (confirmed !== false) handleClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.15rem' }}>Eliminar {entityType}</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registro en Bitácora de Auditoría</span>
            </div>
          </div>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        {/* Advertencia de Auditoría */}
        <div 
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
            Esta acción removerá el elemento de las operaciones activas y <strong>quedará registrada de forma permanente en la Bitácora de Auditoría</strong> para mantener la transparencia entre Luis Romero y Kevin Servat.
          </div>
        </div>

        {/* Resumen del elemento a eliminar */}
        <div 
          style={{ 
            backgroundColor: 'var(--bg-input)', 
            padding: '12px 14px', 
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2px' }}>
            Elemento seleccionado:
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
            {itemName}
          </div>
          {itemId && itemId !== itemName && (
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '2px' }}>
              ID: <span className="code-mono">{itemId}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Socio que autoriza la eliminación (directamente la sesión activa) */}
          <div className="form-group">
            <label className="form-label">Socio que autoriza la eliminación (Sesión iniciada):</label>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-input)',
                border: '1.5px solid rgba(0, 102, 255, 0.35)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>
                  {currentUser?.avatar || (currentUser?.id === 'kevin' ? '🚀' : '👨‍💼')}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#38bdf8' }}>
                    {currentUser?.name || (currentUser?.id === 'kevin' ? 'Kevin Servat' : 'Luis Romero')} (Co-CEO)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Sesión activa • Responsable registrado en la bitácora
                  </div>
                </div>
              </div>
              <span className="badge badge-blue">
                ✓ Autorizado
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Motivo de Eliminación (Auditoría):</label>
            <select 
              className="form-control"
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              required
            >
              <option value="Error de ingreso / prueba">Error de ingreso / dato de prueba</option>
              <option value="Cancelado por cliente">Cancelado o desistido por el cliente</option>
              <option value="Registro duplicado">Registro duplicado</option>
              <option value="Obsolescencia / cambio">Obsolescencia o reemplazo de modelo</option>
              <option value="Ajuste o merma de inventario">Ajuste o merma de inventario físico</option>
              <option value="Socio acordó retiro">Acuerdo conjunto entre socios</option>
              <option value="Otro motivo">Otro motivo</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Justificación / Detalle adicional:</label>
            <textarea 
              className="form-control"
              rows="2"
              placeholder="Explica brevemente por qué se retira este registro para la auditoría..."
              value={detailedReason}
              onChange={(e) => setDetailedReason(e.target.value)}
              required
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', borderColor: '#ef4444' }}
            >
              <Trash2 size={15} />
              <span>Confirmar y Auditar Eliminación</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
