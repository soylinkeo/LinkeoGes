import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Kanban, 
  Plus, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  Trash2 
} from 'lucide-react';

const STAGES = [
  { id: 'contactado', label: '1. Contactado', color: '#64748b' },
  { id: 'negociacion', label: '2. Negociación / Demo', color: '#3b82f6' },
  { id: 'esperando_info', label: '3. Esperando Place ID', color: '#f59e0b' },
  { id: 'configurando', label: '4. Configurando NFC', color: '#8b5cf6' },
  { id: 'entregado', label: '5. Entregado y Cobrado', color: '#10b981' },
  { id: 'postventa', label: '6. Post-Venta (7 Días)', color: '#06b6d4' }
];

export default function KanbanView({
  leads = [],
  onUpdateLeadStage,
  onAddNewLead,
  onConvertLeadToSale,
  onRequestDelete
}) {
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [mobileStageFilter, setMobileStageFilter] = useState('all');

  // Formulario nuevo lead
  const [newLeadForm, setNewLeadForm] = useState({
    businessName: '',
    rubro: 'Restaurante / Cafetería',
    district: 'Miraflores',
    address: '',
    contactName: '',
    phone: '',
    interestedProduct: 'Pack Negocio',
    estimatedValue: 100.00,
    assignedTo: 'kevin',
    notes: '',
    nextStepNote: 'Enviar catálogo por WhatsApp',
    nextStepDate: new Date().toISOString().slice(0, 10)
  });

  const handleStageChange = (leadId, newStage) => {
    onUpdateLeadStage(leadId, newStage);
    if (newStage === 'entregado') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleSaveNewLead = (e) => {
    e.preventDefault();
    const newLead = {
      id: `lead-${Date.now()}`,
      businessName: newLeadForm.businessName,
      rubro: newLeadForm.rubro,
      district: newLeadForm.district,
      address: newLeadForm.address,
      contactName: newLeadForm.contactName,
      phone: newLeadForm.phone,
      stage: 'contactado',
      interestedProduct: newLeadForm.interestedProduct,
      estimatedValue: Number(newLeadForm.estimatedValue) || 100,
      assignedTo: newLeadForm.assignedTo,
      notes: newLeadForm.notes,
      nextStepNote: newLeadForm.nextStepNote,
      nextStepDate: newLeadForm.nextStepDate
    };

    onAddNewLead(newLead);
    setIsNewLeadModalOpen(false);
    setNewLeadForm({
      businessName: '',
      rubro: 'Restaurante / Cafetería',
      district: 'Miraflores',
      address: '',
      contactName: '',
      phone: '',
      interestedProduct: 'Pack Negocio',
      estimatedValue: 100.00,
      assignedTo: 'kevin',
      notes: '',
      nextStepNote: 'Enviar catálogo por WhatsApp',
      nextStepDate: new Date().toISOString().slice(0, 10)
    });
  };

  const handleOpenConvert = (lead) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvert = () => {
    if (!selectedLead) return;
    onConvertLeadToSale(selectedLead);
    setIsConvertModalOpen(false);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });
  };

  const totalPipelineValue = leads.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);

  return (
    <div className="kanban-view">
      {/* Header Compacto para maximizar espacio vertical */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Kanban size={22} color="var(--primary-600)" />
              <span>Pipeline B2B | Embudo de Ventas Linkeo</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
              6 fases comerciales • Prospectos activos en Lima
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
              Pipeline: S/ {totalPipelineValue.toFixed(2)}
            </span>
            <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
              {leads.length} Leads
            </span>
          </div>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setIsNewLeadModalOpen(true)}>
          <Plus size={15} />
          <span>+ Nuevo Prospecto / Lead</span>
        </button>
      </div>

      {/* Selector Táctil de Fases en Móvil */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '6px', 
          overflowX: 'auto', 
          whiteSpace: 'nowrap',
          paddingBottom: '8px', 
          marginBottom: '14px',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <button 
          type="button"
          className={`btn btn-sm ${mobileStageFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMobileStageFilter('all')}
          style={{ fontSize: '0.78rem', padding: '5px 12px', flexShrink: 0 }}
        >
          Todas las Fases ({leads.length})
        </button>
        {STAGES.map(stage => {
          const count = leads.filter(l => l.stage === stage.id).length;
          return (
            <button 
              key={stage.id}
              type="button"
              className={`btn btn-sm ${mobileStageFilter === stage.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMobileStageFilter(stage.id)}
              style={{ fontSize: '0.78rem', padding: '5px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: stage.color }} />
              <span>{stage.label.split('.')[1] || stage.label}</span>
              <span style={{ opacity: 0.8, fontWeight: 700 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Tablero Kanban Full Width */}
      <div className="kanban-board">
        {(mobileStageFilter === 'all' ? STAGES : STAGES.filter(s => s.id === mobileStageFilter)).map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage.id);
          const totalValue = stageLeads.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);

          return (
            <div key={stage.id} className="kanban-column">
              <div className="kanban-col-header">
                <div className="kanban-col-title">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color, flexShrink: 0 }} />
                  <span>{stage.label}</span>
                </div>
                <span className="kanban-col-count">{stageLeads.length}</span>
              </div>

              <div style={{ padding: '4px 10px', fontSize: '0.7rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total:</span>
                <strong style={{ color: 'var(--text-main)' }}>S/ {totalValue.toFixed(2)}</strong>
              </div>

              <div className="kanban-col-body">
                {stageLeads.map(lead => (
                  <div key={lead.id} className="kanban-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '2px 5px' }}>
                        {lead.rubro}
                      </span>
                      <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.82rem' }}>
                        S/ {lead.estimatedValue}
                      </span>
                    </div>

                    <div className="kanban-card-title">{lead.businessName}</div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={11} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.district}</span>
                      {lead.contactName && <span>• {lead.contactName.split(' ')[0]}</span>}
                    </div>

                    <div style={{ marginTop: '6px', padding: '5px 7px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', fontSize: '0.72rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📦 {lead.interestedProduct}
                      </div>
                      <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        👉 {lead.nextStepNote}
                      </div>
                    </div>

                    <div className="kanban-card-footer">
                      {/* Asignado */}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {lead.assignedTo === 'luis' ? '👨‍💼 Luis Romero' : '🚀 Kevin Servat'}
                      </span>

                      {/* WhatsApp Directo */}
                      {lead.phone && (
                        <a 
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${lead.contactName || ''}, te saluda el equipo de Linkeo (linkeocards.com). Te escribo sobre las tarjetas inteligentes con Google Reviews para ${lead.businessName}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon"
                          style={{ width: '26px', height: '26px', color: '#10b981' }}
                          title="Contactar por WhatsApp"
                        >
                          <Phone size={12} />
                        </a>
                      )}

                      {/* Botón Eliminar Prospecto */}
                      <button 
                        className="btn-icon"
                        style={{ width: '26px', height: '26px', color: '#ef4444' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDelete && onRequestDelete(lead, 'Lead');
                        }}
                        title="Eliminar prospecto (Registra en Auditoría)"
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* Selector de siguiente etapa */}
                      <select 
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 4px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-input)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-subtle)',
                          maxWidth: '100px'
                        }}
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value)}
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id}>{s.label.split('.')[1] || s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Botón de Conversión si está en etapa avanzada */}
                    {(lead.stage === 'configurando' || lead.stage === 'entregado') && (
                      <button 
                        className="btn btn-success btn-sm"
                        style={{ width: '100%', marginTop: '8px', fontSize: '0.72rem', padding: '3px 6px' }}
                        onClick={() => handleOpenConvert(lead)}
                      >
                        <Sparkles size={12} />
                        <span>Convertir en Venta</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Nuevo Prospecto */}
      {isNewLeadModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewLeadModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Prospecto B2B</h3>
              <button className="close-btn" onClick={() => setIsNewLeadModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveNewLead}>
              <div className="form-group">
                <label className="form-label">Nombre del Negocio:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Barbería Don Tito, Pollería Roky's..."
                  value={newLeadForm.businessName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, businessName: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rubro:</label>
                  <select 
                    className="form-control"
                    value={newLeadForm.rubro}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, rubro: e.target.value })}
                  >
                    <option value="Restaurante / Cafetería">Restaurante / Cafetería</option>
                    <option value="Barbería y Estética">Barbería y Estética</option>
                    <option value="Clínica / Salud">Clínica / Salud</option>
                    <option value="Gimnasio / Fitness">Gimnasio / Fitness</option>
                    <option value="Tienda / Retail">Tienda / Retail</option>
                    <option value="Hotel / Hospedaje">Hotel / Hospedaje</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Distrito de Lima:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Miraflores, San Isidro, Surco..."
                    value={newLeadForm.district}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, district: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Persona de Contacto:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Encargado o Dueño"
                    value={newLeadForm.contactName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono WhatsApp:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="+51 987 654 321"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Producto de Interés:</label>
                  <select 
                    className="form-control"
                    value={newLeadForm.interestedProduct}
                    onChange={(e) => {
                      const val = e.target.value;
                      let est = 100;
                      if (val.includes('Display')) est = 60;
                      if (val.includes('Horizontal')) est = 80;
                      if (val.includes('Vertical')) est = 40;
                      if (val.includes('Emprendedor')) est = 80;
                      if (val.includes('Negocio')) est = 100;
                      if (val.includes('Dúo')) est = 120;
                      if (val.includes('Full')) est = 160;
                      setNewLeadForm({ ...newLeadForm, interestedProduct: val, estimatedValue: est });
                    }}
                  >
                    <option value="Pack Negocio">Pack Negocio (Display + Vertical - S/ 100)</option>
                    <option value="Modelo 1 – Display de Mesa">Modelo 1 – Display de Mesa (S/ 60)</option>
                    <option value="Modelo 2 – Tarjeta Horizontal">Modelo 2 – Tarjeta Horizontal (S/ 80)</option>
                    <option value="Modelo 3 – Tarjeta Vertical">Modelo 3 – Tarjeta Vertical (S/ 40)</option>
                    <option value="Pack Emprendedor">Pack Emprendedor (S/ 80)</option>
                    <option value="Pack Dúo Premium">Pack Dúo Premium (S/ 120)</option>
                    <option value="Pack Full">Pack Full (S/ 160)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Asignado A:</label>
                  <select 
                    className="form-control"
                    value={newLeadForm.assignedTo}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, assignedTo: e.target.value })}
                  >
                    <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                    <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Próximo Paso:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={newLeadForm.nextStepNote}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, nextStepNote: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha Próximo Paso:</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={newLeadForm.nextStepDate}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, nextStepDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas Adicionales:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  placeholder="Detalles de la conversación, objeciones, horarios preferidos..."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewLeadModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Prospecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Conversión a Venta */}
      {isConvertModalOpen && selectedLead && (
        <div className="modal-overlay" onClick={() => setIsConvertModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🎉 Convertir Prospecto en Venta Real</h3>
              <button className="close-btn" onClick={() => setIsConvertModalOpen(false)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Esta acción registrará formalmente la venta de <strong>{selectedLead.businessName}</strong>,
              sumará <strong>S/ {selectedLead.estimatedValue.toFixed(2)}</strong> a la facturación del mes
              y generará la trazabilidad del chip NFC.
            </p>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Cliente:</span>
                <strong>{selectedLead.businessName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Producto:</span>
                <strong>{selectedLead.interestedProduct}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Monto Facturado:</span>
                <strong style={{ color: '#10b981' }}>S/ {selectedLead.estimatedValue.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Vendedor:</span>
                <strong>{selectedLead.assignedTo === 'luis' ? 'Luis Romero' : 'Kevin Servat'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setIsConvertModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-success" onClick={handleConfirmConvert}>
                <CheckCircle2 size={16} />
                <span>Confirmar y Registrar Venta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
