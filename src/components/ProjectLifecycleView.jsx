import React, { useState } from 'react';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Sparkles 
} from 'lucide-react';

export default function ProjectLifecycleView({
  projectPhases = [],
  onToggleDeliverable,
  onAddDeliverable,
  onEditDeliverable,
  onDeleteDeliverable,
  currentUser,
  onSyncActualProgress
}) {
  const [activePhaseKey, setActivePhaseKey] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState('fase-1');
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('both');

  // Métricas generales del ciclo de vida
  const totalDeliverables = projectPhases.reduce((acc, p) => acc + (p.deliverables ? p.deliverables.length : 0), 0);
  const completedDeliverables = projectPhases.reduce((acc, p) => {
    return acc + (p.deliverables ? p.deliverables.filter(d => d.completed).length : 0);
  }, 0);
  const overallProgress = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0;

  // Fase actual y siguiente hito dinámicos
  const currentActivePhase = projectPhases.find(p => p.progress < 100) || projectPhases[projectPhases.length - 1];
  const nextDeliverable = projectPhases.flatMap(p => p.deliverables || []).find(d => !d.completed);

  const handleOpenAdd = (phaseId) => {
    setSelectedPhaseId(phaseId);
    setFormTitle('');
    setFormAssignedTo('both');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    onAddDeliverable(selectedPhaseId, {
      id: `del-${Date.now()}`,
      title: formTitle.trim(),
      completed: false,
      assignedTo: formAssignedTo
    });

    setIsAddModalOpen(false);
    setFormTitle('');
  };

  const handleOpenEdit = (phaseId, deliverable) => {
    setSelectedPhaseId(phaseId);
    setEditingItem(deliverable);
    setFormTitle(deliverable.title);
    setFormAssignedTo(deliverable.assignedTo || 'both');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !editingItem) return;

    onEditDeliverable(selectedPhaseId, {
      ...editingItem,
      title: formTitle.trim(),
      assignedTo: formAssignedTo
    });

    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const filteredPhases = activePhaseKey === 'all' 
    ? projectPhases 
    : projectPhases.filter(p => p.key === activePhaseKey);

  return (
    <div className="project-lifecycle-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: 'rgba(0, 102, 255, 0.12)', padding: '8px', borderRadius: 'var(--radius-md)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderKanban size={24} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
              Gestión del Proyecto LinkeoGes (5 Fases ERP)
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
            Ciclo de vida estructurado: Inicio, Planificación, Implementación, Monitoreo y Finalización con entregables auditados.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {onSyncActualProgress && completedDeliverables < 17 && (
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onSyncActualProgress}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 102, 255, 0.15)',
                border: '1px solid var(--primary-500)',
                color: '#38bdf8',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Sincronizar automáticamente los 17 entregables ya construidos y validados"
            >
              <Sparkles size={14} />
              <span>Marcar Avance Real (74%)</span>
            </button>
          )}
          <span className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            Avance Global: {overallProgress}%
          </span>
        </div>
      </div>

      {/* Métricas del Proyecto */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Progreso Integral</span>
            <div className="kpi-icon-wrapper">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value">{overallProgress}%</div>
          <div className="kpi-subtext">{completedDeliverables} de {totalDeliverables} hitos completados</div>
          <div className="progress-bar-container" style={{ marginTop: '8px' }}>
            <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-header">
            <span className="kpi-label">Fase Actual</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
            {currentActivePhase ? currentActivePhase.name.replace(/^\d+\.\s*/, '') : 'En curso'}
          </div>
          <div className="kpi-subtext">
            {currentActivePhase ? currentActivePhase.description : 'Producción y despliegue'}
          </div>
        </div>

        <div className="kpi-card kpi-yellow">
          <div className="kpi-header">
            <span className="kpi-label">Siguiente Gran Hito</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.05rem', color: '#f59e0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nextDeliverable ? nextDeliverable.title : 'Todos los hitos completados'}
          </div>
          <div className="kpi-subtext">
            {nextDeliverable ? `Asignado a: ${nextDeliverable.assignedTo === 'luis' ? 'Luis Romero' : nextDeliverable.assignedTo === 'kevin' ? 'Kevin Servat' : 'Ambos Co-CEOs'}` : '¡Meta alcanzada!'}
          </div>
        </div>
      </div>

      {/* Selector de Fases */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '8px', 
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)' 
        }}
      >
        <button 
          className={`btn btn-sm ${activePhaseKey === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActivePhaseKey('all')}
        >
          Todas las Fases (5)
        </button>
        {projectPhases.map(p => (
          <button 
            key={p.key}
            className={`btn btn-sm ${activePhaseKey === p.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActivePhaseKey(p.key)}
          >
            {p.name.split('.')[0]}. {p.key.charAt(0).toUpperCase() + p.key.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid de Fases y Entregables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredPhases.map(phase => {
          const completedCount = phase.deliverables.filter(d => d.completed).length;
          const phasePct = phase.deliverables.length > 0 
            ? Math.round((completedCount / phase.deliverables.length) * 100) 
            : 0;

          return (
            <div 
              key={phase.id}
              className="card"
              style={{
                borderLeft: `4px solid ${
                  phasePct === 100 ? '#10b981' : phasePct > 50 ? 'var(--primary-600)' : '#f59e0b'
                }`
              }}
            >
              <div className="card-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                      {phase.name}
                    </h3>
                    <span className={`badge ${
                      phasePct === 100 ? 'badge-green' : phasePct > 0 ? 'badge-blue' : 'badge-yellow'
                    }`}>
                      {phasePct === 100 ? '✓ Completado' : phasePct > 0 ? '⚡ En Progreso' : '⏳ Pendiente'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                    {phase.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{phasePct}%</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {completedCount} / {phase.deliverables.length} entregables
                    </div>
                  </div>

                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenAdd(phase.id)}
                    title="Agregar entregable a esta fase"
                  >
                    <Plus size={14} />
                    <span>+ Hito</span>
                  </button>
                </div>
              </div>

              {/* Barra de progreso de la fase */}
              <div className="progress-bar-container" style={{ margin: '0 0 16px 0', height: '6px' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${phasePct}%`,
                    background: phasePct === 100 ? '#10b981' : 'var(--primary-600)'
                  }}
                ></div>
              </div>

              {/* Lista de Entregables */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {phase.deliverables.map(del => (
                  <div 
                    key={del.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: del.completed ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-input)',
                      border: `1px solid ${del.completed ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)'}`,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <input 
                        type="checkbox"
                        checked={del.completed}
                        onChange={() => onToggleDeliverable(phase.id, del.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        title="Marcar como completado"
                      />
                      <span 
                        style={{ 
                          fontSize: '0.86rem', 
                          fontWeight: 500,
                          textDecoration: del.completed ? 'line-through' : 'none',
                          color: del.completed ? 'var(--text-muted)' : 'var(--text-main)'
                        }}
                      >
                        {del.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${
                        del.assignedTo === 'luis' ? 'badge-blue' : del.assignedTo === 'kevin' ? 'badge-yellow' : 'badge-purple'
                      }`} style={{ fontSize: '0.72rem' }}>
                        {del.assignedTo === 'luis' ? '👨‍💼 Luis Romero' : del.assignedTo === 'kevin' ? '🚀 Kevin Servat' : '🤝 Ambos Co-CEOs'}
                      </span>

                      <button 
                        className="btn-icon"
                        style={{ width: '26px', height: '26px' }}
                        onClick={() => handleOpenEdit(phase.id, del)}
                        title="Editar hito"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button 
                        className="btn-icon"
                        style={{ width: '26px', height: '26px', color: '#ef4444' }}
                        onClick={() => onDeleteDeliverable(phase.id, del)}
                        title="Eliminar hito (con auditoría)"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Agregar Hito */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Nuevo Hito / Entregable</h3>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveAdd}>
              <div className="form-group">
                <label className="form-label">Descripción del Entregable:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Integrar API de Supabase para login en tiempo real..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Socio Responsable:</label>
                <select 
                  className="form-control"
                  value={formAssignedTo}
                  onChange={(e) => setFormAssignedTo(e.target.value)}
                >
                  <option value="both">🤝 Ambos Co-CEOs (Luis Romero & Kevin Servat)</option>
                  <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                  <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Hito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Hito */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Hito / Entregable</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Descripción del Entregable:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Socio Responsable:</label>
                <select 
                  className="form-control"
                  value={formAssignedTo}
                  onChange={(e) => setFormAssignedTo(e.target.value)}
                >
                  <option value="both">🤝 Ambos Co-CEOs (Luis Romero & Kevin Servat)</option>
                  <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                  <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
