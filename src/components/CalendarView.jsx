import { localDate } from '../utils/dateUtils.js';
import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  CalendarDays,
  Clock, 
  Plus, 
  Check, 
  CheckCircle2,
  CheckSquare,
  Trash2, 
  Edit3, 
  RotateCcw,
  Sparkles,
  UserCheck,
  Tag
} from 'lucide-react';

export default function CalendarView({
  events = [],
  onAddNewEvent,
  onEditEvent,
  nfcCards = [],
  onRequestDelete,
  districts = [],
  showToast
}) {
  // Modales de Citas / Visitas
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [completingEvent, setCompletingEvent] = useState(null);
  const [completionSummary, setCompletionSummary] = useState('');

  // Modales de Tareas Diarias
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Filtros de visualización
  const [appointmentFilter, setAppointmentFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [taskPartnerFilter, setTaskPartnerFilter] = useState('all'); // 'all', 'luis', 'kevin', 'both'

  // Formulario de nueva cita o visita
  const [eventForm, setEventForm] = useState({
    title: '',
    partner: 'auto', // 'auto', 'luis', 'kevin', 'both'
    type: 'demo', // demo, delivery, follow_up, meeting, route
    date: localDate(),
    startTime: '19:30',
    endTime: '20:30',
    client: '',
    district: districts[0] || 'Miraflores',
    description: ''
  });

  // Formulario edición evento
  const [editingEvent, setEditingEvent] = useState(null);

  // Formulario de nueva tarea diaria
  const [taskForm, setTaskForm] = useState({
    title: '',
    partner: 'both', // 'both', 'luis', 'kevin'
    category: 'Prospección', // Prospección, Ventas, Operaciones, Finanzas, Postventa
    priority: 'alta', // alta, media, normal
    description: ''
  });

  // Separación clara entre Citas/Visitas y Tareas Diarias
  const appointments = events.filter(e => !e.isDailyTask && e.type !== 'daily_task');
  const dailyTasks = events.filter(e => e.isDailyTask || e.type === 'daily_task');

  // Filtrado de Citas
  const filteredAppointments = appointments.filter(evt => {
    const isCompleted = evt.status === 'realizada' || evt.completed;
    if (appointmentFilter === 'pending') return !isCompleted;
    if (appointmentFilter === 'completed') return isCompleted;
    return true;
  });

  const pendingAppointmentsCount = appointments.filter(e => e.status !== 'realizada' && !e.completed).length;
  const completedAppointmentsCount = appointments.filter(e => e.status === 'realizada' || e.completed).length;

  // Filtrado de Tareas Diarias
  const filteredDailyTasks = dailyTasks.filter(task => {
    if (taskPartnerFilter === 'all') return true;
    return task.partner === taskPartnerFilter;
  });

  const completedDailyTasksCount = dailyTasks.filter(t => t.completed || t.status === 'completada').length;
  const luisTasksCount = dailyTasks.filter(t => t.partner === 'luis').length;
  const kevinTasksCount = dailyTasks.filter(t => t.partner === 'kevin').length;
  const bothTasksCount = dailyTasks.filter(t => t.partner === 'both').length;

  const taskProgressPct = dailyTasks.length > 0 ? Math.round((completedDailyTasksCount / dailyTasks.length) * 100) : 0;

  // Lógica de asignación equitativa Co-CEOs para Citas
  const determineAssignedPartner = (dateStr, startTimeStr, userChoice) => {
    if (userChoice !== 'auto') return userChoice;
    const luisCount = appointments.filter(e => e.partner === 'luis').length;
    const kevinCount = appointments.filter(e => e.partner === 'kevin').length;
    return kevinCount < luisCount ? 'kevin' : 'luis';
  };

  // Handlers para Citas
  const handleCloseNewEventModal = () => {
    setEventForm({
      title: '',
      partner: 'auto',
      type: 'demo',
      date: localDate(),
      startTime: '19:30',
      endTime: '20:30',
      client: '',
      district: districts[0] || 'Miraflores',
      description: ''
    });
    setIsNewEventModalOpen(false);
  };

  const handleCloseEditEventModal = () => {
    setEditingEvent(null);
    setIsEditEventModalOpen(false);
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    const assigned = determineAssignedPartner(eventForm.date, eventForm.startTime, eventForm.partner);

    const newEvent = {
      id: `evt-${Date.now()}`,
      title: eventForm.title.trim(),
      partner: assigned,
      type: eventForm.type,
      date: eventForm.date,
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      client: eventForm.client.trim(),
      district: eventForm.district,
      description: eventForm.description.trim(),
      status: 'pendiente',
      completed: false,
      resultSummary: ''
    };

    onAddNewEvent(newEvent);
    if (showToast) {
      showToast(`📅 Cita "${newEvent.title}" agendada exitosamente`, 'success');
    }
    handleCloseNewEventModal();
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
    if (showToast) {
      showToast(`📅 Cita "${editingEvent.title}" actualizada exitosamente`, 'success');
    }
    handleCloseEditEventModal();
  };

  // Completar Cita y registrar resumen de lo que se hizo
  const handleOpenCompleteModal = (evt) => {
    setCompletingEvent(evt);
    setCompletionSummary(evt.resultSummary || '');
  };

  const handleCloseCompleteModal = () => {
    setCompletingEvent(null);
    setCompletionSummary('');
  };

  const handleSaveCompleteAppointment = (e) => {
    e.preventDefault();
    if (!completingEvent) return;

    const updated = {
      ...completingEvent,
      status: 'realizada',
      completed: true,
      resultSummary: completionSummary.trim(),
      completedAt: new Date().toISOString()
    };

    onEditEvent(updated);
    if (showToast) {
      showToast(`✓ Cita "${completingEvent.title}" marcada como Realizada con su resumen operativo`, 'success');
    }
    handleCloseCompleteModal();
  };

  const handleReopenAppointment = (evt) => {
    const updated = {
      ...evt,
      status: 'pendiente',
      completed: false
    };
    onEditEvent(updated);
    if (showToast) {
      showToast(`Cita "${evt.title}" reabierta a estado Pendiente`, 'info');
    }
  };

  // Handlers para Tareas Diarias
  const handleCloseNewTaskModal = () => {
    setTaskForm({
      title: '',
      partner: 'both',
      category: 'Prospección',
      priority: 'alta',
      description: ''
    });
    setIsNewTaskModalOpen(false);
  };

  const handleSaveNewTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: taskForm.title.trim(),
      type: 'daily_task',
      isDailyTask: true,
      partner: taskForm.partner,
      category: taskForm.category,
      priority: taskForm.priority,
      status: 'pendiente',
      completed: false,
      date: localDate(),
      startTime: '09:00',
      endTime: '18:00',
      description: taskForm.description.trim()
    };

    onAddNewEvent(newTask);
    if (showToast) {
      showToast(`✓ Tarea diaria asignada a ${taskForm.partner === 'luis' ? 'Luis Romero' : taskForm.partner === 'kevin' ? 'Kevin Servat' : 'Ambos Co-CEOs'}`, 'success');
    }
    handleCloseNewTaskModal();
  };

  const handleToggleDailyTask = (task) => {
    const isCompleted = !(task.completed || task.status === 'completada');
    const updated = {
      ...task,
      completed: isCompleted,
      status: isCompleted ? 'completada' : 'pendiente',
      completedAt: isCompleted ? new Date().toISOString() : null
    };

    onEditEvent(updated);
    if (showToast) {
      showToast(isCompleted ? `✓ Tarea completada: "${task.title}"` : `Tarea reabierta: "${task.title}"`, 'info', 1800);
    }
  };

  const handleOpenEditTask = (task) => {
    setEditingTask({ ...task });
  };

  const handleCloseEditTask = () => {
    setEditingTask(null);
  };

  const handleSaveEditTask = (e) => {
    e.preventDefault();
    if (!editingTask) return;

    onEditEvent(editingTask);
    if (showToast) {
      showToast(`✓ Tarea "${editingTask.title}" actualizada`, 'success');
    }
    handleCloseEditTask();
  };

  // Precargar tareas diarias sugeridas si está vacío
  const handleLoadSuggestedDailyTasks = () => {
    const SUGGESTIONS = [
      {
        title: 'Contactar a 15 prospectos comerciales por WhatsApp / Instagram',
        partner: 'both',
        category: 'Prospección',
        priority: 'alta',
        description: 'Buscar barberías, restaurantes y cafeterías con presencia en Google Maps.'
      },
      {
        title: 'Visitas presenciales de demostración con tarjeta física (3 a 5 locales)',
        partner: 'luis',
        category: 'Ventas',
        priority: 'alta',
        description: 'Presentar la tarjeta al dueño y probar lectura NFC en tiempo real con su smartphone.'
      },
      {
        title: 'Configuración y prueba de chips NTAG215 con Google Place IDs',
        partner: 'kevin',
        category: 'Operaciones',
        priority: 'alta',
        description: 'Verificar enlace directo de 5 estrellas y validar lectura en Android y iPhone.'
      },
      {
        title: 'Seguimiento de 48 horas a prospectos de demostración',
        partner: 'both',
        category: 'Postventa',
        priority: 'media',
        description: 'Consultar dudas al cliente, ofrecer Pack Dúo promocional y coordinar fecha de instalación.'
      },
      {
        title: 'Cierre diario de caja, ventas y balance de gastos en LinkeoGes (50/50)',
        partner: 'luis',
        category: 'Finanzas',
        priority: 'normal',
        description: 'Registrar ventas confirmadas, gastos del día y verificar que el balance de socios esté al día.'
      }
    ];

    SUGGESTIONS.forEach((sug, idx) => {
      setTimeout(() => {
        onAddNewEvent({
          id: `task-sug-${Date.now()}-${idx}`,
          title: sug.title,
          type: 'daily_task',
          isDailyTask: true,
          partner: sug.partner,
          category: sug.category,
          priority: sug.priority,
          status: 'pendiente',
          completed: false,
          date: localDate(),
          startTime: '09:00',
          endTime: '18:00',
          description: sug.description
        });
      }, idx * 40);
    });

    if (showToast) {
      showToast('✓ 5 Tareas diarias operativas sugeridas agregadas exitosamente', 'success');
    }
  };

  return (
    <div className="calendar-view">
      {/* Header Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: 'rgba(0, 102, 255, 0.12)', padding: '8px', borderRadius: 'var(--radius-md)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarIcon size={24} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
              Agenda, Visitas Presenciales & Tareas Diarias
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
            Coordinación centralizada de demostraciones en campo, tareas operativas diarias asignadas a cada socio y registro de resultados de cada visita.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setIsNewTaskModalOpen(true)}>
            <CheckSquare size={16} />
            <span>+ Nueva Tarea Diaria</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsNewEventModalOpen(true)}>
            <Plus size={16} />
            <span>+ Agendar Cita</span>
          </button>
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
            Agenda Compartida & Tareas de Alto Rendimiento 50/50
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Demostraciones presenciales, entregas técnicas y tareas diarias asignadas con respaldo mutuo entre <strong>Luis Romero</strong> y <strong>Kevin Servat</strong>.
          </div>
        </div>
        <span className="badge badge-green" style={{ flexShrink: 0 }}>
          <Check size={12} /> Agenda 50/50 Activa
        </span>
      </div>

      {/* Grid de Contenido de Agenda: Citas a la izquierda | Tareas Diarias a la derecha */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
        
        {/* ========================================================================= */}
        {/* COLUMNA 1: CITAS Y VISITAS PROGRAMADAS CON RESUMEN DE REALIZADO           */}
        {/* ========================================================================= */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              <Clock size={18} color="var(--primary-600)" />
              <span>Citas y Visitas Presenciales</span>
            </h3>
            <span className="badge badge-blue">{appointments.length} Citas</span>
          </div>

          {/* Filtros de Citas */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${appointmentFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
              onClick={() => setAppointmentFilter('all')}
            >
              Todas ({appointments.length})
            </button>
            <button 
              className={`btn btn-sm ${appointmentFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
              onClick={() => setAppointmentFilter('pending')}
            >
              ⏳ Pendientes ({pendingAppointmentsCount})
            </button>
            <button 
              className={`btn btn-sm ${appointmentFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
              onClick={() => setAppointmentFilter('completed')}
            >
              ✓ Realizadas ({completedAppointmentsCount})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredAppointments.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Clock size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  {appointmentFilter === 'completed' 
                    ? 'Aún no hay citas marcadas como realizadas.'
                    : appointmentFilter === 'pending'
                    ? 'No hay citas pendientes. ¡Excelente!'
                    : 'No hay citas agendadas. Haz clic en "+ Agendar Cita" para programar una visita comercial.'}
                </p>
              </div>
            ) : (
              filteredAppointments.map(evt => {
                const isRealizada = evt.status === 'realizada' || evt.completed;

                return (
                  <div 
                    key={evt.id}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isRealizada ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-input)',
                      border: isRealizada ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-subtle)',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {/* Fila 1: Título, Estado y Responsable */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem' }}>
                          {evt.type === 'demo' ? '🎯' : evt.type === 'delivery' ? '📦' : evt.type === 'route' ? '🚗' : evt.type === 'follow_up' ? '📞' : '🤝'}
                        </span>
                        <strong style={{ fontSize: '0.94rem', textDecoration: isRealizada ? 'none' : 'none' }}>
                          {evt.title}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Estado: Pendiente o Realizada */}
                        {isRealizada ? (
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Cita Realizada
                          </span>
                        ) : (
                          <span className="badge badge-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Pendiente
                          </span>
                        )}

                        <span className={`badge ${evt.partner === 'luis' ? 'badge-blue' : evt.partner === 'kevin' ? 'badge-yellow' : 'badge-purple'}`}>
                          {evt.partner === 'luis' ? '👨‍💼 Luis Romero' : evt.partner === 'kevin' ? '🚀 Kevin Servat' : '🤝 Ambos Co-CEOs'}
                        </span>

                        {/* Botón Editar Evento */}
                        <button 
                          className="btn-icon" 
                          style={{ width: '24px', height: '24px' }}
                          onClick={() => handleOpenEditEvent(evt)}
                          title="Editar detalles de la cita"
                        >
                          <Edit3 size={12} />
                        </button>

                        {/* Botón Eliminar Evento */}
                        <button 
                          className="btn-icon" 
                          style={{ width: '24px', height: '24px', color: '#ef4444' }}
                          onClick={() => onRequestDelete && onRequestDelete(evt, 'Evento')}
                          title="Eliminar cita (con auditoría)"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Metadata de fecha, hora y lugar */}
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span>📅 {evt.date}</span>
                      <span>⏰ {evt.startTime} - {evt.endTime}</span>
                      {evt.district && <span>📍 {evt.district}</span>}
                      {evt.client && <span>🏢 {evt.client}</span>}
                    </div>

                    {evt.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '0 0 10px 0' }}>
                        {evt.description}
                      </p>
                    )}

                    {/* Resumen de lo que se hizo si la cita está realizada */}
                    {isRealizada && (
                      <div 
                        style={{
                          marginTop: '8px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.22)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={13} />
                            <span>Resumen de lo que se hizo en la visita:</span>
                          </span>
                          <button 
                            type="button" 
                            onClick={() => handleOpenCompleteModal(evt)}
                            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}
                          >
                            Editar resumen
                          </button>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                          {evt.resultSummary || 'Visita comercial completada exitosamente.'}
                        </p>
                      </div>
                    )}

                    {/* Barra de Acciones de la Cita */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                      {!isRealizada ? (
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.78rem', padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => handleOpenCompleteModal(evt)}
                        >
                          <CheckCircle2 size={13} />
                          <span>Marcar como Realizada (+ Resumen)</span>
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.74rem', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleReopenAppointment(evt)}
                          title="Volver la cita a estado pendiente"
                        >
                          <RotateCcw size={11} />
                          <span>Reabrir a Pendiente</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA 2: TAREAS DIARIAS OPERATIVAS (ASIGNADAS POR SOCIO)                 */}
        {/* ========================================================================= */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={18} color="var(--primary-600)" />
                <span>Tareas Diarias Operativas</span>
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                {completedDailyTasksCount} de {dailyTasks.length} hechas
              </span>
              <button 
                className="btn btn-sm btn-primary" 
                style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setIsNewTaskModalOpen(true)}
              >
                <Plus size={13} />
                <span>+ Nueva Tarea</span>
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
            Checklist diario de operaciones para <strong>Luis Romero</strong> y <strong>Kevin Servat</strong>. Marca las tareas concluidas conforme avanza la jornada.
          </p>

          {/* Barra de Progreso de Tareas */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)' }}>Progreso de la jornada</span>
              <span style={{ color: taskProgressPct === 100 ? '#10b981' : 'var(--primary-600)' }}>{taskProgressPct}%</span>
            </div>
            <div className="progress-bar-container" style={{ height: '6px' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${taskProgressPct}%`,
                  background: taskProgressPct === 100 ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #10b981)' 
                }}
              ></div>
            </div>
          </div>

          {/* Filtros de Asignación por Socio */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${taskPartnerFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.74rem', padding: '3px 9px' }}
              onClick={() => setTaskPartnerFilter('all')}
            >
              Todas ({dailyTasks.length})
            </button>
            <button 
              className={`btn btn-sm ${taskPartnerFilter === 'luis' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.74rem', padding: '3px 9px' }}
              onClick={() => setTaskPartnerFilter('luis')}
            >
              👨‍💼 Luis ({luisTasksCount})
            </button>
            <button 
              className={`btn btn-sm ${taskPartnerFilter === 'kevin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.74rem', padding: '3px 9px' }}
              onClick={() => setTaskPartnerFilter('kevin')}
            >
              🚀 Kevin ({kevinTasksCount})
            </button>
            <button 
              className={`btn btn-sm ${taskPartnerFilter === 'both' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.74rem', padding: '3px 9px' }}
              onClick={() => setTaskPartnerFilter('both')}
            >
              🤝 Ambos ({bothTasksCount})
            </button>
          </div>

          {/* Lista de Tareas Diarias */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredDailyTasks.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <CheckSquare size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                <p style={{ margin: '0 0 10px 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {taskPartnerFilter !== 'all' 
                    ? `No hay tareas asignadas para este filtro.` 
                    : 'Aún no has registrado tareas diarias para el equipo.'}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: '0.76rem', padding: '4px 12px' }}
                    onClick={() => setIsNewTaskModalOpen(true)}
                  >
                    <Plus size={13} />
                    <span>Crear Primera Tarea</span>
                  </button>
                  {dailyTasks.length === 0 && (
                    <button 
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.76rem', padding: '4px 12px' }}
                      onClick={handleLoadSuggestedDailyTasks}
                    >
                      <Sparkles size={13} />
                      <span>Cargar 5 Tareas Sugeridas</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredDailyTasks.map(task => {
                const isCompleted = task.completed || task.status === 'completada';

                return (
                  <div 
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-input)',
                      border: isCompleted ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                      transition: 'all var(--transition-fast)',
                      opacity: isCompleted ? 0.75 : 1
                    }}
                  >
                    {/* Checkbox y Contenido de la Tarea */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0, marginRight: '10px' }}>
                      <input 
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleDailyTask(task)}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginTop: '2px',
                          cursor: 'pointer',
                          accentColor: '#10b981'
                        }}
                        title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          wordBreak: 'break-word'
                        }}>
                          {task.title}
                        </div>

                        {task.description && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {task.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                          {/* Badge de Socio Asignado */}
                          <span 
                            className={`badge ${task.partner === 'luis' ? 'badge-blue' : task.partner === 'kevin' ? 'badge-yellow' : 'badge-purple'}`}
                            style={{ fontSize: '0.7rem', padding: '2px 7px' }}
                          >
                            {task.partner === 'luis' ? '👨‍💼 Luis' : task.partner === 'kevin' ? '🚀 Kevin' : '🤝 Ambos'}
                          </span>

                          {/* Categoría / Área */}
                          {task.category && (
                            <span 
                              className="badge badge-secondary" 
                              style={{ fontSize: '0.7rem', padding: '2px 7px', backgroundColor: 'rgba(255,255,255,0.06)' }}
                            >
                              {task.category}
                            </span>
                          )}

                          {/* Prioridad Alta */}
                          {task.priority === 'alta' && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444' }}>
                              ⚡ Alta
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones Editar y Eliminar Tarea */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button 
                        className="btn-icon" 
                        style={{ width: '24px', height: '24px' }}
                        onClick={() => handleOpenEditTask(task)}
                        title="Editar tarea diaria"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button 
                        className="btn-icon" 
                        style={{ width: '24px', height: '24px', color: '#ef4444' }}
                        onClick={() => onRequestDelete && onRequestDelete(task, 'Evento')}
                        title="Eliminar tarea diaria"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Nueva Cita / Enrutamiento                                          */}
      {/* ========================================================================= */}
      {isNewEventModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agendar Nueva Cita o Visita Presencial</h3>
              <button className="close-btn" onClick={handleCloseNewEventModal}>✕</button>
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
                    <option value="auto">⚡ Balance Automático 50/50</option>
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
                <button type="button" className="btn btn-secondary" onClick={handleCloseNewEventModal}>
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

      {/* ========================================================================= */}
      {/* MODAL: Completar Cita (+ Resumen de lo que se hizo)                       */}
      {/* ========================================================================= */}
      {completingEvent && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#10b981" />
                <span>Registrar Cita como Realizada</span>
              </h3>
              <button className="close-btn" onClick={handleCloseCompleteModal}>✕</button>
            </div>

            <form onSubmit={handleSaveCompleteAppointment}>
              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(0, 102, 255, 0.06)',
                border: '1px solid rgba(0, 102, 255, 0.2)',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {completingEvent.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  📅 {completingEvent.date} · ⏰ {completingEvent.startTime} · 📍 {completingEvent.district || 'Lima'} · 
                  {completingEvent.client ? ` 🏢 ${completingEvent.client}` : ''}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Resumen de lo que se hizo en la visita: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea 
                  className="form-control"
                  rows="4"
                  placeholder="Detalla lo ocurrido en la cita: ¿Se hizo demostración? ¿Qué modelo le gustó al cliente? ¿Pidió cotización de 1 tarjeta o Pack? ¿Siguientes pasos acordados?"
                  value={completionSummary}
                  onChange={(e) => setCompletionSummary(e.target.value)}
                  required
                  autoFocus
                ></textarea>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>
                  Este resumen quedará registrado en la bitácora operativa para seguimiento conjunto entre ambos socios.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseCompleteModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}>
                  <Check size={16} />
                  <span>Guardar Cita Realizada</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Editar Cita / Evento                                               */}
      {/* ========================================================================= */}
      {isEditEventModalOpen && editingEvent && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Cita o Visita Agendada</h3>
              <button className="close-btn" onClick={handleCloseEditEventModal}>✕</button>
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
                  <label className="form-label">Estado de la Cita:</label>
                  <select 
                    className="form-control"
                    value={editingEvent.status || 'pendiente'}
                    onChange={(e) => setEditingEvent({ 
                      ...editingEvent, 
                      status: e.target.value,
                      completed: e.target.value === 'realizada'
                    })}
                  >
                    <option value="pendiente">⏳ Pendiente de Realización</option>
                    <option value="realizada">✓ Cita Realizada</option>
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
                <label className="form-label">Descripción Inicial / Plan de Visita:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                ></textarea>
              </div>

              {/* Resumen de lo que se hizo si se marca como realizada */}
              {(editingEvent.status === 'realizada' || editingEvent.completed) && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#10b981' }}>
                    📝 Resumen de lo que se hizo en la visita:
                  </label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    placeholder="Resultados, demostración efectuada o acuerdos comerciales..."
                    value={editingEvent.resultSummary || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, resultSummary: e.target.value })}
                  ></textarea>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseEditEventModal}>
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

      {/* ========================================================================= */}
      {/* MODAL: Nueva Tarea Diaria (Asignada a Socio)                              */}
      {/* ========================================================================= */}
      {isNewTaskModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={20} color="var(--primary-600)" />
                <span>Crear Nueva Tarea Diaria</span>
              </h3>
              <button className="close-btn" onClick={handleCloseNewTaskModal}>✕</button>
            </div>

            <form onSubmit={handleSaveNewTask}>
              <div className="form-group">
                <label className="form-label">Título de la Tarea:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Contactar 15 prospectos por WhatsApp en Miraflores..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Asignar a Socio:</label>
                  <select 
                    className="form-control"
                    value={taskForm.partner}
                    onChange={(e) => setTaskForm({ ...taskForm, partner: e.target.value })}
                  >
                    <option value="both">🤝 Ambos Co-CEOs (Equipo)</option>
                    <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                    <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Área / Categoría:</label>
                  <select 
                    className="form-control"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                  >
                    <option value="Prospección">🎯 Prospección Comercial</option>
                    <option value="Ventas">🤝 Ventas & Demostraciones</option>
                    <option value="Operaciones">🔧 Operaciones & Chips NFC</option>
                    <option value="Postventa">📦 Entregas & Postventa</option>
                    <option value="Finanzas">💰 Finanzas & Cuadre 50/50</option>
                    <option value="Contenido">📱 Redes & Video Marketing</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Prioridad:</label>
                <select 
                  className="form-control"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <option value="alta">⚡ Alta (Ineludible para hoy)</option>
                  <option value="media">🔹 Media (Importante)</option>
                  <option value="normal">⚪ Normal (Rutinaria)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notas Adicionales (Opcional):</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  placeholder="Detalles sobre el objetivo o link de apoyo..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseNewTaskModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear y Asignar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Editar Tarea Diaria                                                */}
      {/* ========================================================================= */}
      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Tarea Diaria</h3>
              <button className="close-btn" onClick={handleCloseEditTask}>✕</button>
            </div>

            <form onSubmit={handleSaveEditTask}>
              <div className="form-group">
                <label className="form-label">Título de la Tarea:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Socio Asignado:</label>
                  <select 
                    className="form-control"
                    value={editingTask.partner}
                    onChange={(e) => setEditingTask({ ...editingTask, partner: e.target.value })}
                  >
                    <option value="both">🤝 Ambos Co-CEOs</option>
                    <option value="luis">👨‍💼 Luis Romero</option>
                    <option value="kevin">🚀 Kevin Servat</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Área / Categoría:</label>
                  <select 
                    className="form-control"
                    value={editingTask.category || 'Prospección'}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                  >
                    <option value="Prospección">🎯 Prospección Comercial</option>
                    <option value="Ventas">🤝 Ventas & Demostraciones</option>
                    <option value="Operaciones">🔧 Operaciones & Chips NFC</option>
                    <option value="Postventa">📦 Entregas & Postventa</option>
                    <option value="Finanzas">💰 Finanzas & Cuadre 50/50</option>
                    <option value="Contenido">📱 Redes & Video Marketing</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Estado:</label>
                  <select 
                    className="form-control"
                    value={editingTask.completed || editingTask.status === 'completada' ? 'completada' : 'pendiente'}
                    onChange={(e) => {
                      const isComp = e.target.value === 'completada';
                      setEditingTask({
                        ...editingTask,
                        completed: isComp,
                        status: e.target.value
                      });
                    }}
                  >
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="completada">✓ Completada</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Prioridad:</label>
                  <select 
                    className="form-control"
                    value={editingTask.priority || 'media'}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                  >
                    <option value="alta">⚡ Alta</option>
                    <option value="media">🔹 Media</option>
                    <option value="normal">⚪ Normal</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas Adicionales:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseEditTask}>
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
