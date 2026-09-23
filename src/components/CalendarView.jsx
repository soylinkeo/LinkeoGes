import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  CalendarDays,
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  UserCheck, 
  Bell, 
  MapPin, 
  Check, 
  Trash2, 
  Edit3 
} from 'lucide-react';

export default function CalendarView({
  events = [],
  onAddNewEvent,
  onEditEvent,
  nfcCards = [],
  onRequestDelete,
  districts = []
}) {
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);

  // Formulario de nueva cita o visita
  const [eventForm, setEventForm] = useState({
    title: '',
    partner: 'auto', // 'auto', 'luis', 'kevin', 'both'
    type: 'demo', // demo, delivery, follow_up, meeting
    date: new Date().toISOString().slice(0, 10),
    startTime: '19:30',
    endTime: '20:30',
    client: '',
    district: districts[0] || 'Miraflores',
    description: ''
  });

  // Formulario edición evento
  const [editingEvent, setEditingEvent] = useState(null);

  // Cálculo de renovaciones próximas (a vencer en menos de 45 días o vencimiento de 1 año)
  const renewals = nfcCards.map(c => {
    const assigned = new Date(c.assignedDate || '2026-09-15');
    const renewal = new Date(assigned.getTime() + 365 * 24 * 60 * 60 * 1000);
    return {
      cardId: c.id,
      businessName: c.businessName,
      renewalDateStr: renewal.toISOString().slice(0, 10),
      district: c.district,
      phone: c.contactPhone
    };
  });

  // Lógica de asignación equitativa Co-CEOs
  const determineAssignedPartner = (dateStr, startTimeStr, userChoice) => {
    if (userChoice !== 'auto') return userChoice;
    const luisCount = events.filter(e => e.partner === 'luis').length;
    const kevinCount = events.filter(e => e.partner === 'kevin').length;
    return kevinCount < luisCount ? 'kevin' : 'luis';
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    const assigned = determineAssignedPartner(eventForm.date, eventForm.startTime, eventForm.partner);

    const newEvent = {
      id: `evt-${Date.now()}`,
      title: eventForm.title,
      partner: assigned,
      type: eventForm.type,
      date: eventForm.date,
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      client: eventForm.client,
      district: eventForm.district,
      description: eventForm.description
    };

    onAddNewEvent(newEvent);
    setIsNewEventModalOpen(false);
    setEventForm({
      title: '',
      partner: 'auto',
      type: 'demo',
      date: new Date().toISOString().slice(0, 10),
      startTime: '19:30',
      endTime: '20:30',
      client: '',
      district: districts[0] || 'Miraflores',
      description: ''
    });
  };

  const handleOpenEditEvent = (evt) => {
    setEditingEvent({ ...evt });
    setIsEditEventModalOpen(true);
  };

  const handleSaveEditEvent = (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    if (onEditEvent) {
      onEditEvent(editingEvent);
    }
    setIsEditEventModalOpen(false);
    setEditingEvent(null);
  };

  return (
    <div className="calendar-view">
      {/* Header Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={24} color="var(--primary-600)" />
            <span>Agenda & Enrutamiento de Visitas Presenciales</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Coordinación centralizada de demostraciones, visitas comerciales y soporte técnico 50/50 entre Luis Romero y Kevin Servat.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsNewEventModalOpen(true)}>
          <Plus size={16} />
          <span>+ Agendar Cita</span>
        </button>
      </div>

      {/* Banner de Coordinación Compartida Co-CEOs */}
      <div 
        style={{
          padding: '14px 18px',
          backgroundColor: 'rgba(0, 102, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(0, 102, 255, 0.25)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <CalendarDays size={26} color="var(--primary-600)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Agenda Compartida & Coordinación de Visitas Co-CEOs
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Coordinación centralizada de demostraciones presenciales, visitas a clientes y entregas técnicas con respaldo mutuo 50/50 entre <strong>Luis Romero</strong> y <strong>Kevin Servat</strong>.
          </div>
        </div>
        <span className="badge badge-green" style={{ flexShrink: 0 }}>
          <Check size={12} /> Agenda 50/50 Activa
        </span>
      </div>

      {/* Grid de Contenido de Agenda */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Columna 1: Citas y Tareas Programadas */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={18} color="var(--primary-600)" />
              <span>Próximas Citas y Visitas Programadas</span>
            </h3>
            <span className="badge badge-blue">{events.length} Eventos</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No hay citas registradas. Haz clic en <strong>+ Agendar Cita</strong> para programar una visita.
              </div>
            ) : (
              events.map(evt => (
                <div 
                  key={evt.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>
                        {evt.type === 'demo' ? '🎯' : evt.type === 'delivery' ? '📦' : evt.type === 'route' ? '🚗' : evt.type === 'follow_up' ? '📞' : '🤝'}
                      </span>
                      <strong style={{ fontSize: '0.92rem' }}>{evt.title}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge ${evt.partner === 'luis' ? 'badge-blue' : evt.partner === 'kevin' ? 'badge-yellow' : 'badge-purple'}`}>
                        {evt.partner === 'luis' ? '👨‍💼 Luis Romero' : evt.partner === 'kevin' ? '🚀 Kevin Servat' : '🤝 Ambos Co-CEOs'}
                      </span>

                      {/* Botón Editar Evento */}
                      <button 
                        className="btn-icon" 
                        style={{ width: '24px', height: '24px' }}
                        onClick={() => handleOpenEditEvent(evt)}
                        title="Editar evento"
                      >
                        <Edit3 size={12} />
                      </button>

                      {/* Botón Eliminar Evento */}
                      <button 
                        className="btn-icon" 
                        style={{ width: '24px', height: '24px', color: '#ef4444' }}
                        onClick={() => onRequestDelete && onRequestDelete(evt, 'Evento')}
                        title="Eliminar evento de la agenda (con auditoría)"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span>📅 {evt.date}</span>
                    <span>⏰ {evt.startTime} - {evt.endTime}</span>
                    {evt.district && <span>📍 {evt.district}</span>}
                    {evt.client && <span>🏢 {evt.client}</span>}
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0 }}>
                    {evt.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna 2: Alertas de Renovación Anual (30 días antes) */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Bell size={18} color="#f59e0b" />
              <span>Alertas de Renovación Anual (Chips Activos)</span>
            </h3>
            <span className="badge badge-yellow">30 Días Antes</span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Si deciden cobrar una tarifa anual por el servicio de mantenimiento del enlace directo o actualización de Place ID:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {renewals.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No hay tarjetas asignadas en este momento.
              </div>
            ) : (
              renewals.map(ren => (
                <div 
                  key={ren.cardId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="code-mono">{ren.cardId}</span>
                      <strong style={{ fontSize: '0.88rem' }}>{ren.businessName}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      📍 {ren.district} • Vencimiento: <span style={{ color: '#38bdf8' }}>{ren.renewalDateStr}</span>
                    </div>
                  </div>

                  <a 
                    href={`https://wa.me/${(ren.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${ren.businessName}, te saluda el equipo de Linkeo. Te escribimos para la renovación y soporte anual de tu tarjeta Google Reviews.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    Notificar
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Nueva Cita / Enrutamiento */}
      {isNewEventModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewEventModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agendar Cita o Tarea con Enrutador Inteligente</h3>
              <button className="close-btn" onClick={() => setIsNewEventModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEvent}>
              <div className="form-group">
                <label className="form-label">Título del Evento o Visita:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Demo presencial en Restaurante El Gaucho..."
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo de Actividad:</label>
                  <select 
                    className="form-control"
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                  >
                    <option value="demo">🎯 Demostración Presencial</option>
                    <option value="delivery">📦 Entrega / Instalación de Tarjeta</option>
                    <option value="route">🚗 Ruta de Prospección en Zona</option>
                    <option value="follow_up">📞 Seguimiento / Negociación</option>
                    <option value="meeting">🤝 Reunión de Socios 50/50</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Responsable Asignado:</label>
                  <select 
                    className="form-control"
                    value={eventForm.partner}
                    onChange={(e) => setEventForm({ ...eventForm, partner: e.target.value })}
                  >
                    <option value="auto">⚡ Balance Automático 50/50 (Recomendado)</option>
                    <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                    <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                    <option value="both">🤝 Ambos Co-CEOs</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Negocio o Cliente:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Nombre del local comercial"
                    value={eventForm.client}
                    onChange={(e) => setEventForm({ ...eventForm, client: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Distrito:</label>
                  <select 
                    className="form-control"
                    value={eventForm.district}
                    onChange={(e) => setEventForm({ ...eventForm, district: e.target.value })}
                  >
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha:</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Horario:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="time" 
                      className="form-control"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    />
                    <input 
                      type="time" 
                      className="form-control"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción / Notas:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  placeholder="Detalles de la visita, acuerdos previos o material a llevar..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewEventModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agendar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Cita / Evento */}
      {isEditEventModalOpen && editingEvent && (
        <div className="modal-overlay" onClick={() => setIsEditEventModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Cita o Tarea Agendada</h3>
              <button className="close-btn" onClick={() => setIsEditEventModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditEvent}>
              <div className="form-group">
                <label className="form-label">Título del Evento o Visita:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipo de Actividad:</label>
                  <select 
                    className="form-control"
                    value={editingEvent.type}
                    onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value })}
                  >
                    <option value="demo">🎯 Demostración Presencial</option>
                    <option value="delivery">📦 Entrega / Instalación de Tarjeta</option>
                    <option value="route">🚗 Ruta de Prospección en Zona</option>
                    <option value="follow_up">📞 Seguimiento / Negociación</option>
                    <option value="meeting">🤝 Reunión de Socios 50/50</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Responsable Asignado:</label>
                  <select 
                    className="form-control"
                    value={editingEvent.partner}
                    onChange={(e) => setEditingEvent({ ...editingEvent, partner: e.target.value })}
                  >
                    <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                    <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                    <option value="both">🤝 Ambos Co-CEOs</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Negocio o Cliente:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Nombre del local comercial"
                    value={editingEvent.client || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, client: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Distrito:</label>
                  <select 
                    className="form-control"
                    value={editingEvent.district || districts[0] || 'Miraflores'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, district: e.target.value })}
                  >
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha:</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Horario:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="time" 
                      className="form-control"
                      value={editingEvent.startTime}
                      onChange={(e) => setEditingEvent({ ...editingEvent, startTime: e.target.value })}
                    />
                    <input 
                      type="time" 
                      className="form-control"
                      value={editingEvent.endTime}
                      onChange={(e) => setEditingEvent({ ...editingEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción / Notas:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditEventModalOpen(false)}>
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
