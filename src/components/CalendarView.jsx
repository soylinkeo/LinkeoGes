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
  Layers, 
  ChevronRight, 
  Filter, 
  Check, 
  Trash2, 
  Edit3 
} from 'lucide-react';

export default function CalendarView({
  events = [],
  onAddNewEvent,
  onEditEvent,
  plan30Days = [],
  onTogglePlanTask,
  onAddPlanTask,
  onEditPlanTask,
  nfcCards = [],
  onRequestDelete,
  districts = []
}) {
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' o 'plan30'
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);

  const [filterWeek, setFilterWeek] = useState('all');

  // Formulario de nueva cita o tarea
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

  // Formulario tarea plan 30 días
  const [planTaskForm, setPlanTaskForm] = useState({
    day: (plan30Days.length > 0 ? Math.max(...plan30Days.map(t => t.day || 0)) + 1 : 1),
    week: 1,
    action: '',
    target: '',
    channel: 'WhatsApp / Presencial',
    responsible: 'Luis Romero',
    result: ''
  });
  const [editingPlanTask, setEditingPlanTask] = useState(null);

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

  // Tareas completadas del Plan de 30 días
  const completedTasksCount = plan30Days.filter(t => t.completed).length;
  const planProgressPct = plan30Days.length > 0 
    ? Math.round((completedTasksCount / plan30Days.length) * 100) 
    : 0;

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

  // Handlers para Plan 30 Días
  const handleOpenAddPlan = () => {
    const nextDay = plan30Days.length > 0 ? Math.max(...plan30Days.map(t => t.day || 0)) + 1 : 1;
    const computedWeek = Math.min(4, Math.ceil(nextDay / 7)) || 1;
    setPlanTaskForm({
      day: nextDay,
      week: computedWeek,
      action: '',
      target: '',
      channel: 'WhatsApp / Presencial',
      responsible: 'Luis',
      result: ''
    });
    setIsAddPlanModalOpen(true);
  };

  const handleSaveAddPlan = (e) => {
    e.preventDefault();
    if (!planTaskForm.action.trim()) return;

    const newTask = {
      day: Number(planTaskForm.day) || 1,
      week: Number(planTaskForm.week) || 1,
      action: planTaskForm.action.trim(),
      target: planTaskForm.target.trim() || 'Ejecución clave',
      channel: planTaskForm.channel,
      responsible: planTaskForm.responsible,
      completed: false,
      result: planTaskForm.result.trim() || ''
    };

    if (onAddPlanTask) {
      onAddPlanTask(newTask);
    }
    setIsAddPlanModalOpen(false);
  };

  const handleOpenEditPlan = (task) => {
    setEditingPlanTask({ ...task });
    setIsEditPlanModalOpen(true);
  };

  const handleSaveEditPlan = (e) => {
    e.preventDefault();
    if (!editingPlanTask) return;

    if (onEditPlanTask) {
      onEditPlanTask(editingPlanTask);
    }
    setIsEditPlanModalOpen(false);
    setEditingPlanTask(null);
  };

  const filteredTasks = plan30Days.filter(task => {
    if (filterWeek === 'all') return true;
    return task.week?.toString() === filterWeek;
  });

  return (
    <div className="calendar-view">
      {/* Header con tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={24} color="var(--primary-600)" />
            <span>Agenda, Enrutamiento Inteligente & Plan 30 Días</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Coordinación sin fricción entre Luis Romero y Kevin Servat con edición completa y auditoría de cambios.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button 
              className={`btn btn-sm ${activeTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
              onClick={() => setActiveTab('calendar')}
            >
              Agenda Compartida ({events.length})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'plan30' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
              onClick={() => setActiveTab('plan30')}
            >
              Plan 30 Días ({planProgressPct}%)
            </button>
          </div>

          {activeTab === 'calendar' ? (
            <button className="btn btn-primary" onClick={() => setIsNewEventModalOpen(true)}>
              <Plus size={16} />
              <span>+ Agendar Cita</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleOpenAddPlan}>
              <Plus size={16} />
              <span>+ Tarea al Plan</span>
            </button>
          )}
        </div>
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

      {activeTab === 'calendar' ? (
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
      ) : (
        /* VISTA: Plan de Acción de 30 Días (CRUD Completo) */
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Layers size={18} color="var(--primary-600)" />
                <span>Plan de Acción de 30 Días (Validación & Escalamiento)</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Extraído directamente de <code>Control de Gastos NFC.xlsx</code>. Permite agregar, editar y auditar cada hito.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select 
                className="form-control" 
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
              >
                <option value="all">Todas las Semanas</option>
                <option value="1">Semana 1: Oferta & Muestras</option>
                <option value="2">Semana 2: Prospección Activa</option>
                <option value="3">Semana 3: Demostraciones & Cierres</option>
                <option value="4">Semana 4: Escala & Referidos</option>
              </select>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                  {completedTasksCount} / {plan30Days.length}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progreso del Plan */}
          <div className="progress-bar-container" style={{ height: '10px', marginBottom: '20px' }}>
            <div className="progress-bar-fill" style={{ width: `${planProgressPct}%` }}></div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>OK</th>
                  <th>Día</th>
                  <th>Semana</th>
                  <th>Acción Principal</th>
                  <th>Meta Medible</th>
                  <th>Canal</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Resultado / Aprendizaje</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr 
                    key={task.day}
                    style={{
                      opacity: task.completed ? 0.75 : 1,
                      backgroundColor: task.completed ? 'rgba(16, 185, 129, 0.03)' : 'transparent'
                    }}
                  >
                    <td>
                      <input 
                        type="checkbox" 
                        checked={task.completed}
                        onChange={() => onTogglePlanTask(task.day)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    <td><strong>Día {task.day}</strong></td>
                    <td>Semana {task.week}</td>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.action}
                      </span>
                    </td>
                    <td><span className="badge badge-blue">{task.target}</span></td>
                    <td>{task.channel}</td>
                    <td>{task.responsible}</td>
                    <td>
                      <span className={`badge ${task.completed ? 'badge-green' : 'badge-yellow'}`}>
                        {task.completed ? 'Completado' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {task.result || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button 
                          className="btn-icon" 
                          style={{ width: '26px', height: '26px' }}
                          onClick={() => handleOpenEditPlan(task)}
                          title="Editar tarea del plan"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          className="btn-icon" 
                          style={{ width: '26px', height: '26px', color: '#ef4444' }}
                          onClick={() => onRequestDelete && onRequestDelete(task, 'Plan 30 Días')}
                          title="Eliminar tarea del plan (con auditoría)"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                    <option value="demo">🎯 Demostración en Vivo / Visita</option>
                    <option value="delivery">📦 Entrega de Tarjeta & Cobro</option>
                    <option value="route">🚗 Ruta de Prospección en Zona</option>
                    <option value="follow_up">📞 Seguimiento Post-Venta (7 Días)</option>
                    <option value="meeting">🤝 Reunión Estratégica Co-CEOs</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Asignación:</label>
                  <select 
                    className="form-control"
                    value={eventForm.partner}
                    onChange={(e) => setEventForm({ ...eventForm, partner: e.target.value })}
                  >
                    <option value="auto">⚡ Asignación Equitativa Co-CEOs</option>
                    <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                    <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                    <option value="both">🤝 Ambos Co-CEOs</option>
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
                  <label className="form-label">Hora Inicio:</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    required
                  />
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

              <div className="form-group">
                <label className="form-label">Detalles de la Cita:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  placeholder="Llevar display de muestra, acordar con encargado de caja..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewEventModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agendar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Cita */}
      {isEditEventModalOpen && editingEvent && (
        <div className="modal-overlay" onClick={() => setIsEditEventModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Evento / Visita Programada</h3>
              <button className="close-btn" onClick={() => setIsEditEventModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditEvent}>
              <div className="form-group">
                <label className="form-label">Título:</label>
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
                    value={editingEvent.type || 'demo'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value })}
                  >
                    <option value="demo">🎯 Demostración en Vivo / Visita</option>
                    <option value="delivery">📦 Entrega de Tarjeta & Cobro</option>
                    <option value="route">🚗 Ruta de Prospección en Zona</option>
                    <option value="follow_up">📞 Seguimiento Post-Venta (7 Días)</option>
                    <option value="meeting">🤝 Reunión Estratégica Co-CEOs</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Responsable:</label>
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

      {/* MODAL: Agregar Tarea Plan 30 Días */}
      {isAddPlanModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddPlanModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Nueva Tarea al Plan 30 Días</h3>
              <button className="close-btn" onClick={() => setIsAddPlanModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveAddPlan}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Día (1 - 30):</label>
                  <input 
                    type="number"
                    min="1"
                    max="60"
                    className="form-control"
                    value={planTaskForm.day}
                    onChange={(e) => setPlanTaskForm({ ...planTaskForm, day: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Semana (1 - 4):</label>
                  <select 
                    className="form-control"
                    value={planTaskForm.week}
                    onChange={(e) => setPlanTaskForm({ ...planTaskForm, week: e.target.value })}
                  >
                    <option value="1">Semana 1</option>
                    <option value="2">Semana 2</option>
                    <option value="3">Semana 3</option>
                    <option value="4">Semana 4</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Acción Principal:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Visitar 5 cafeterías en Av. Larco con displays de prueba..."
                  value={planTaskForm.action}
                  onChange={(e) => setPlanTaskForm({ ...planTaskForm, action: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Meta Medible:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej: 3 demos agendadas"
                    value={planTaskForm.target}
                    onChange={(e) => setPlanTaskForm({ ...planTaskForm, target: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Responsable:</label>
                  <select 
                    className="form-control"
                    value={planTaskForm.responsible}
                    onChange={(e) => setPlanTaskForm({ ...planTaskForm, responsible: e.target.value })}
                  >
                    <option value="Luis Romero">Luis Romero (Co-CEO)</option>
                    <option value="Kevin Servat">Kevin Servat (Co-CEO)</option>
                    <option value="Luis Romero / Kevin Servat">Luis Romero / Kevin Servat</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddPlanModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Tarea Plan 30 Días */}
      {isEditPlanModalOpen && editingPlanTask && (
        <div className="modal-overlay" onClick={() => setIsEditPlanModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Tarea del Plan 30 Días</h3>
              <button className="close-btn" onClick={() => setIsEditPlanModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditPlan}>
              <div className="form-group">
                <label className="form-label">Acción Principal:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingPlanTask.action}
                  onChange={(e) => setEditingPlanTask({ ...editingPlanTask, action: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Meta Medible:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={editingPlanTask.target}
                    onChange={(e) => setEditingPlanTask({ ...editingPlanTask, target: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Responsable:</label>
                  <select 
                    className="form-control"
                    value={editingPlanTask.responsible}
                    onChange={(e) => setEditingPlanTask({ ...editingPlanTask, responsible: e.target.value })}
                  >
                    <option value="Luis Romero">Luis Romero (Co-CEO)</option>
                    <option value="Kevin Servat">Kevin Servat (Co-CEO)</option>
                    <option value="Luis Romero / Kevin Servat">Luis Romero / Kevin Servat</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resultado / Aprendizaje Obtenido:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  value={editingPlanTask.result || ''}
                  onChange={(e) => setEditingPlanTask({ ...editingPlanTask, result: e.target.value })}
                  placeholder="Anotar resultados de la acción..."
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditPlanModalOpen(false)}>
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
