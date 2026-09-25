import { localDate } from '../utils/dateUtils.js';
import { OPERATIONAL_ROUTINE_EVENTS, DEFAULT_PROTOCOL_BLOCKS } from '../data/initialData.js';
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
  Tag,
  ArrowUpDown
} from 'lucide-react';

export { DEFAULT_PROTOCOL_BLOCKS };

export default function CalendarView({
  events = [],
  onAddNewEvent,
  onEditEvent,
  nfcCards = [],
  onRequestDelete,
  districts = [],
  showToast
}) {
  // Protocolo Operativo Diario (4 Bloques) editable con persistencia
  const [protocolBlocks, setProtocolBlocks] = useState(() => {
    try {
      const saved = localStorage.getItem('linkeo_operational_protocol_blocks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PROTOCOL_BLOCKS;
  });
  const [isEditProtocolModalOpen, setIsEditProtocolModalOpen] = useState(false);
  const [protocolEditForm, setProtocolEditForm] = useState(DEFAULT_PROTOCOL_BLOCKS);

  // Modales de Citas / Visitas
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [completingEvent, setCompletingEvent] = useState(null);
  const [completionSummary, setCompletionSummary] = useState('');

  // Modales de Tareas
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Filtros de visualización
  const [appointmentFilter, setAppointmentFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [taskPartnerFilter, setTaskPartnerFilter] = useState('all'); // 'all', 'luis', 'kevin', 'both'
  const [taskTypeFilter, setTaskTypeFilter] = useState('all'); // 'all', 'diarias', 'eventuales', 'completadas'

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

  // Formulario de nueva tarea operativa
  const [taskForm, setTaskForm] = useState({
    title: '',
    partner: 'both', // 'both', 'luis', 'kevin'
    category: 'Prospección', // Prospección, Ventas, Operaciones, Finanzas, Postventa
    priority: 'alta', // alta, media, normal
    taskType: 'diaria', // 'diaria', 'eventual'
    protocolBlock: '', // '', 'bloque-1', 'bloque-2', 'bloque-3', 'bloque-4', 'custom'
    startTime: '09:00',
    endTime: '18:00',
    description: ''
  });

  // Separación clara entre Citas/Visitas y Tareas Operativas
  const appointments = events.filter(e => !e.isDailyTask && e.type !== 'daily_task' && e.type !== 'task');
  const allTasks = events.filter(e => e.isDailyTask || e.type === 'daily_task' || e.type === 'task');

  // Ordenamiento de Citas por fecha y hora: de las más próximas a las más lejanas
  const [appointmentSortOrder, setAppointmentSortOrder] = useState('asc'); // 'asc': más próximas primero, 'desc': más lejanas primero

  const getRelativeDateLabel = (dateStr) => {
    if (!dateStr) return null;
    const todayStr = localDate();
    if (dateStr === todayStr) return 'Hoy';
    try {
      const today = new Date(todayStr + 'T00:00:00');
      const target = new Date(dateStr + 'T00:00:00');
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) return 'Mañana';
      if (diffDays === -1) return 'Ayer';
      if (diffDays > 1) return `En ${diffDays} días`;
      if (diffDays < -1) return `Hace ${Math.abs(diffDays)} días`;
    } catch (e) {}
    return null;
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateTimeA = `${a.date || '9999-12-31'} ${a.startTime || '00:00'}`;
    const dateTimeB = `${b.date || '9999-12-31'} ${b.startTime || '00:00'}`;
    const diff = dateTimeA.localeCompare(dateTimeB);
    return appointmentSortOrder === 'asc' ? diff : -diff;
  });

  // Filtrado de Citas ordenadas por fecha
  const filteredAppointments = sortedAppointments.filter(evt => {
    const isCompleted = evt.status === 'realizada' || evt.completed;
    if (appointmentFilter === 'pending') return !isCompleted;
    if (appointmentFilter === 'completed') return isCompleted;
    return true;
  });

  const pendingAppointmentsCount = appointments.filter(e => e.status !== 'realizada' && !e.completed).length;
  const completedAppointmentsCount = appointments.filter(e => e.status === 'realizada' || e.completed).length;

  // Filtrado de Tareas por Socio
  const filteredTasksByPartner = allTasks.filter(task => {
    if (taskPartnerFilter === 'all') return true;
    return task.partner === taskPartnerFilter;
  });

  // Clasificación de Tareas en 3 secciones solicitadas:
  // 1. Tareas Diarias Operativas (pendientes rutinarias)
  const pendingDailyTasks = filteredTasksByPartner.filter(t => 
    (!t.completed && t.status !== 'completada') && (t.taskType !== 'eventual')
  );

  // 2. Tareas Eventuales (pendientes puntuales o extraordinarias)
  const pendingEventualTasks = filteredTasksByPartner.filter(t => 
    (!t.completed && t.status !== 'completada') && (t.taskType === 'eventual')
  );

  // 3. Tareas Completadas (colocadas estrictamente abajo)
  const completedTasksList = filteredTasksByPartner.filter(t => 
    t.completed || t.status === 'completada'
  );

  const completedDailyTasksCount = allTasks.filter(t => t.completed || t.status === 'completada').length;
  const luisTasksCount = allTasks.filter(t => t.partner === 'luis').length;
  const kevinTasksCount = allTasks.filter(t => t.partner === 'kevin').length;
  const bothTasksCount = allTasks.filter(t => t.partner === 'both').length;

  const taskProgressPct = allTasks.length > 0 ? Math.round((completedDailyTasksCount / allTasks.length) * 100) : 0;

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

  // Handlers para Tareas
  const handleCloseNewTaskModal = () => {
    setTaskForm({
      title: '',
      partner: 'both',
      category: 'Prospección',
      priority: 'alta',
      taskType: 'diaria',
      protocolBlock: '',
      startTime: '09:00',
      endTime: '18:00',
      description: ''
    });
    setIsNewTaskModalOpen(false);
  };

  const handleProtocolBlockChange = (selectedBlockId, isEditing = false) => {
    const block = protocolBlocks.find(b => b.id === selectedBlockId);
    if (isEditing) {
      setEditingTask(prev => ({
        ...prev,
        protocolBlock: selectedBlockId,
        startTime: block?.startTime || prev.startTime || '09:00',
        endTime: block?.endTime || prev.endTime || '18:00'
      }));
    } else {
      setTaskForm(prev => ({
        ...prev,
        protocolBlock: selectedBlockId,
        startTime: block?.startTime || prev.startTime || '09:00',
        endTime: block?.endTime || prev.endTime || '18:00'
      }));
    }
  };

  const handleSaveNewTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: taskForm.title.trim(),
      type: 'daily_task',
      isDailyTask: true,
      taskType: taskForm.taskType || 'diaria',
      protocolBlock: taskForm.protocolBlock || '',
      partner: taskForm.partner,
      category: taskForm.category,
      priority: taskForm.priority,
      status: 'pendiente',
      completed: false,
      date: localDate(),
      startTime: taskForm.startTime || '09:00',
      endTime: taskForm.endTime || '18:00',
      description: taskForm.description.trim()
    };

    onAddNewEvent(newTask);
    if (showToast) {
      showToast(`✓ Tarea asignada a ${taskForm.partner === 'luis' ? 'Luis Romero' : taskForm.partner === 'kevin' ? 'Kevin Servat' : 'Ambos Co-CEOs'}`, 'success');
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
    setEditingTask({ 
      ...task,
      taskType: task.taskType || 'diaria',
      protocolBlock: task.protocolBlock || '',
      startTime: task.startTime || '09:00',
      endTime: task.endTime || '18:00'
    });
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

  // Handlers para Edición del Protocolo Operativo
  const handleOpenEditProtocol = () => {
    setProtocolEditForm(JSON.parse(JSON.stringify(protocolBlocks)));
    setIsEditProtocolModalOpen(true);
  };

  const handleCloseEditProtocol = () => {
    setIsEditProtocolModalOpen(false);
  };

  const handleUpdateBlockField = (index, field, value) => {
    setProtocolEditForm(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleResetProtocolDefaults = () => {
    setProtocolEditForm(JSON.parse(JSON.stringify(DEFAULT_PROTOCOL_BLOCKS)));
    if (showToast) {
      showToast('Campos restablecidos a la rutina original recomendada', 'info');
    }
  };

  const handleSaveProtocol = (e) => {
    e.preventDefault();
    setProtocolBlocks(protocolEditForm);
    try {
      localStorage.setItem('linkeo_operational_protocol_blocks', JSON.stringify(protocolEditForm));
    } catch (err) {}
    if (showToast) {
      showToast('✓ Protocolo operativo actualizado exitosamente', 'success');
    }
    setIsEditProtocolModalOpen(false);
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
            <span>+ Nueva Tarea</span>
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
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <CalendarDays size={26} color="var(--primary-600)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Agenda Compartida & Rutina Estratégica 50/50
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Demostraciones presenciales, entregas técnicas y tareas diarias asignadas con respaldo mutuo entre <strong>Luis Romero</strong> y <strong>Kevin Servat</strong>.
          </div>
        </div>
        <span className="badge badge-green" style={{ flexShrink: 0 }}>
          <Check size={12} /> Agenda 50/50 Activa
        </span>
      </div>

      {/* Guía Visual Rápida de la Rutina Operativa por Bloques (Editable) */}
      <div 
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🎯</span>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              Protocolo Operativo Diario Linkeo (Rutina Estratégica de 4 Bloques)
            </span>
          </div>
          <button 
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.76rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={handleOpenEditProtocol}
            title="Editar los 4 bloques del protocolo operativo diario"
          >
            <Edit3 size={13} color="var(--primary-600)" />
            <span>Editar Protocolo</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', fontSize: '0.78rem' }}>
          {protocolBlocks.map((block) => (
            <div 
              key={block.id}
              style={{ 
                padding: '10px 12px', 
                borderRadius: 'var(--radius-sm)', 
                backgroundColor: block.bgColor || 'rgba(59, 130, 246, 0.08)', 
                border: `1px solid ${block.borderColor || 'rgba(59, 130, 246, 0.22)'}` 
              }}
            >
              <strong style={{ color: block.themeColor || '#60a5fa', display: 'block', marginBottom: '4px' }}>
                {block.title} {block.schedule ? `(${block.schedule})` : ''}
              </strong>
              <span style={{ color: 'var(--text-main)', lineHeight: 1.45, display: 'block' }}>
                {block.description}
              </span>
            </div>
          ))}
        </div>
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

          {/* Filtros de Citas y Ordenamiento por Fecha */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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

            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.73rem', padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}
              onClick={() => setAppointmentSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              title={appointmentSortOrder === 'asc' ? 'Orden actual: Más próximas a más lejanas. Clic para invertir.' : 'Orden actual: Más lejanas a más próximas. Clic para invertir.'}
            >
              <ArrowUpDown size={12} />
              <span>{appointmentSortOrder === 'asc' ? '📅 Más próximas primero' : '📅 Más lejanas primero'}</span>
            </button>
          </div>

          <div className="agenda-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                    {/* Metadata de fecha, hora y lugar con etiqueta de proximidad */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        📅 <strong style={{ color: 'var(--text-main)' }}>{evt.date}</strong>
                        {(() => {
                          const rel = getRelativeDateLabel(evt.date);
                          if (!rel) return null;
                          const isToday = rel === 'Hoy';
                          const isTomorrow = rel === 'Mañana';
                          return (
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              backgroundColor: isToday ? 'rgba(16, 185, 129, 0.15)' : isTomorrow ? 'rgba(0, 102, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                              color: isToday ? '#10b981' : isTomorrow ? '#60a5fa' : 'var(--text-muted)'
                            }}>
                              {rel}
                            </span>
                          );
                        })()}
                      </span>
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
                <span>Tareas Operativas</span>
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                {completedDailyTasksCount} de {allTasks.length} hechas
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
            Checklist operativo para <strong>Luis Romero</strong> y <strong>Kevin Servat</strong>. Tareas diarias de rutina, eventuales y tareas concluidas.
          </p>

          {/* Barra de Progreso de Tareas */}
          <div style={{ marginBottom: '14px' }}>
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
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${taskPartnerFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.74rem', padding: '3px 9px' }}
              onClick={() => setTaskPartnerFilter('all')}
            >
              Todos ({allTasks.length})
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

          {/* Filtros por Tipo de Tarea */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${taskTypeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '2px 8px' }}
              onClick={() => setTaskTypeFilter('all')}
            >
              Todas ({filteredTasksByPartner.length})
            </button>
            <button 
              className={`btn btn-sm ${taskTypeFilter === 'diarias' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '2px 8px' }}
              onClick={() => setTaskTypeFilter('diarias')}
            >
              ☀️ Diarias ({pendingDailyTasks.length})
            </button>
            <button 
              className={`btn btn-sm ${taskTypeFilter === 'eventuales' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '2px 8px' }}
              onClick={() => setTaskTypeFilter('eventuales')}
            >
              📌 Eventuales ({pendingEventualTasks.length})
            </button>
            <button 
              className={`btn btn-sm ${taskTypeFilter === 'completadas' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '2px 8px' }}
              onClick={() => setTaskTypeFilter('completadas')}
            >
              ✅ Completadas ({completedTasksList.length})
            </button>
          </div>

          {/* Lista de Tareas con Scroll Independiente hasta la línea base */}
          <div className="agenda-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredTasksByPartner.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <CheckSquare size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                <p style={{ margin: '0 0 10px 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {taskPartnerFilter !== 'all' 
                    ? `No hay tareas asignadas para este filtro.` 
                    : 'Aún no has registrado tareas operativas.'}
                </p>
                <button 
                  className="btn btn-sm btn-primary"
                  style={{ fontSize: '0.76rem', padding: '4px 14px' }}
                  onClick={() => setIsNewTaskModalOpen(true)}
                >
                  <Plus size={13} />
                  <span>Crear Primera Tarea</span>
                </button>
              </div>
            ) : (
              <>
                {/* 1. SECCIÓN: TAREAS DIARIAS */}
                {(taskTypeFilter === 'all' || taskTypeFilter === 'diarias') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px', borderBottom: '1px solid rgba(59, 130, 246, 0.25)' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>☀️</span> Tareas Diarias ({pendingDailyTasks.length})
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rutina y operaciones de hoy</span>
                    </div>

                    {pendingDailyTasks.length === 0 ? (
                      <div style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                        No hay tareas diarias pendientes.
                      </div>
                    ) : (
                      pendingDailyTasks.map(task => {
                        const isCompleted = task.completed || task.status === 'completada';
                        const matchedBlock = task.protocolBlock ? protocolBlocks.find(b => b.id === task.protocolBlock) : null;

                        return (
                          <div 
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              transition: 'all var(--transition-fast)'
                            }}
                          >
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
                                title="Marcar como completada"
                              />

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-word' }}>
                                  {task.title}
                                </div>

                                {task.description && (
                                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {task.description}
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                  <span 
                                    className="badge" 
                                    style={{ fontSize: '0.68rem', padding: '2px 7px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.25)' }}
                                  >
                                    ☀️ Diaria
                                  </span>

                                  <span 
                                    className={`badge ${task.partner === 'luis' ? 'badge-blue' : task.partner === 'kevin' ? 'badge-yellow' : 'badge-purple'}`}
                                    style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                                  >
                                    {task.partner === 'luis' ? '👨‍💼 Luis' : task.partner === 'kevin' ? '🚀 Kevin' : '🤝 Ambos'}
                                  </span>

                                  {matchedBlock ? (
                                    <span 
                                      className="badge" 
                                      style={{ 
                                        fontSize: '0.68rem', 
                                        padding: '2px 7px', 
                                        backgroundColor: matchedBlock.bgColor, 
                                        color: matchedBlock.themeColor,
                                        border: `1px solid ${matchedBlock.borderColor}`
                                      }}
                                      title={matchedBlock.title}
                                    >
                                      🎯 B{matchedBlock.blockNumber}: {matchedBlock.schedule}
                                    </span>
                                  ) : task.startTime ? (
                                    <span 
                                      className="badge badge-secondary" 
                                      style={{ fontSize: '0.68rem', padding: '2px 7px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}
                                    >
                                      ⏰ {task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}
                                    </span>
                                  ) : null}

                                  {task.category && (
                                    <span 
                                      className="badge badge-secondary" 
                                      style={{ fontSize: '0.68rem', padding: '2px 7px', backgroundColor: 'rgba(255,255,255,0.06)' }}
                                    >
                                      {task.category}
                                    </span>
                                  )}

                                  {task.priority === 'alta' && (
                                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444' }}>
                                      ⚡ Alta
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              <button 
                                className="btn-icon" 
                                style={{ width: '24px', height: '24px' }}
                                onClick={() => handleOpenEditTask(task)}
                                title="Editar tarea"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button 
                                className="btn-icon" 
                                style={{ width: '24px', height: '24px', color: '#ef4444' }}
                                onClick={() => onRequestDelete && onRequestDelete(task, 'Evento')}
                                title="Eliminar tarea"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 2. SECCIÓN: TAREAS EVENTUALES */}
                {(taskTypeFilter === 'all' || taskTypeFilter === 'eventuales') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px', borderBottom: '1px solid rgba(236, 72, 153, 0.25)' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f472b6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📌</span> Tareas Eventuales ({pendingEventualTasks.length})
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Puntuales o extraordinarias</span>
                    </div>

                    {pendingEventualTasks.length === 0 ? (
                      <div style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                        No hay tareas eventuales pendientes.
                      </div>
                    ) : (
                      pendingEventualTasks.map(task => {
                        const isCompleted = task.completed || task.status === 'completada';
                        const matchedBlock = task.protocolBlock ? protocolBlocks.find(b => b.id === task.protocolBlock) : null;

                        return (
                          <div 
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid rgba(236, 72, 153, 0.22)',
                              transition: 'all var(--transition-fast)'
                            }}
                          >
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
                                title="Marcar como completada"
                              />

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-word' }}>
                                  {task.title}
                                </div>

                                {task.description && (
                                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {task.description}
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                  <span 
                                    className="badge" 
                                    style={{ fontSize: '0.68rem', padding: '2px 7px', backgroundColor: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.25)' }}
                                  >
                                    📌 Eventual
                                  </span>

                                  <span 
                                    className={`badge ${task.partner === 'luis' ? 'badge-blue' : task.partner === 'kevin' ? 'badge-yellow' : 'badge-purple'}`}
                                    style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                                  >
                                    {task.partner === 'luis' ? '👨‍💼 Luis' : task.partner === 'kevin' ? '🚀 Kevin' : '🤝 Ambos'}
                                  </span>

                                  {matchedBlock ? (
                                    <span 
                                      className="badge" 
                                      style={{ 
                                        fontSize: '0.68rem', 
                                        padding: '2px 7px', 
                                        backgroundColor: matchedBlock.bgColor, 
                                        color: matchedBlock.themeColor,
                                        border: `1px solid ${matchedBlock.borderColor}`
                                      }}
                                      title={matchedBlock.title}
                                    >
                                      🎯 B{matchedBlock.blockNumber}: {matchedBlock.schedule}
                                    </span>
                                  ) : task.startTime ? (
                                    <span 
                                      className="badge badge-secondary" 
                                      style={{ fontSize: '0.68rem', padding: '2px 7px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}
                                    >
                                      ⏰ {task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}
                                    </span>
                                  ) : null}

                                  {task.category && (
                                    <span 
                                      className="badge badge-secondary" 
                                      style={{ fontSize: '0.68rem', padding: '2px 7px', backgroundColor: 'rgba(255,255,255,0.06)' }}
                                    >
                                      {task.category}
                                    </span>
                                  )}

                                  {task.priority === 'alta' && (
                                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444' }}>
                                      ⚡ Alta
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              <button 
                                className="btn-icon" 
                                style={{ width: '24px', height: '24px' }}
                                onClick={() => handleOpenEditTask(task)}
                                title="Editar tarea"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button 
                                className="btn-icon" 
                                style={{ width: '24px', height: '24px', color: '#ef4444' }}
                                onClick={() => onRequestDelete && onRequestDelete(task, 'Evento')}
                                title="Eliminar tarea"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 3. SECCIÓN: TAREAS COMPLETADAS (ESTRICTAMENTE ABAJO) */}
                {(taskTypeFilter === 'all' || taskTypeFilter === 'completadas') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px', borderBottom: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✅</span> Tareas Completadas ({completedTasksList.length})
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Concluidas</span>
                    </div>

                    {completedTasksList.length === 0 ? (
                      <div style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                        Aún no hay tareas marcadas como completadas.
                      </div>
                    ) : (
                      completedTasksList.map(task => {
                        const isEventual = task.taskType === 'eventual';
                        const matchedBlock = task.protocolBlock ? protocolBlocks.find(b => b.id === task.protocolBlock) : null;

                        return (
                          <div 
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'rgba(16, 185, 129, 0.05)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              transition: 'all var(--transition-fast)',
                              opacity: 0.78
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0, marginRight: '10px' }}>
                              <input 
                                type="checkbox" 
                                checked={true}
                                onChange={() => handleToggleDailyTask(task)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  marginTop: '2px',
                                  cursor: 'pointer',
                                  accentColor: '#10b981'
                                }}
                                title="Reabrir tarea a pendiente"
                              />

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: '0.88rem',
                                  fontWeight: 600,
                                  color: 'var(--text-muted)',
                                  textDecoration: 'line-through',
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
                                  <span 
                                    className="badge badge-green" 
                                    style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                                  >
                                    ✓ Hecha
                                  </span>

                                  {isEventual ? (
                                    <span 
                                      className="badge" 
                                      style={{ fontSize: '0.68rem', padding: '2px 7px', backgroundColor: 'rgba(236, 72, 153, 0.12)', color: '#f472b6' }}
                                    >
                                      📌 Eventual
                                    </span>
                                  ) : (
                                    <span 
                                      className="badge" 
                                      style={{ fontSize: '0.68rem', padding: '2px 7px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}
                                    >
                                      ☀️ Diaria
                                    </span>
                                  )}

                                  <span 
                                    className={`badge ${task.partner === 'luis' ? 'badge-blue' : task.partner === 'kevin' ? 'badge-yellow' : 'badge-purple'}`}
                                    style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                                  >
                                    {task.partner === 'luis' ? '👨‍💼 Luis' : task.partner === 'kevin' ? '🚀 Kevin' : '🤝 Ambos'}
                                  </span>

                                  {matchedBlock ? (
                                    <span 
                                      className="badge" 
                                      style={{ 
                                        fontSize: '0.68rem', 
                                        padding: '2px 7px', 
                                        backgroundColor: matchedBlock.bgColor, 
                                        color: matchedBlock.themeColor 
                                      }}
                                    >
                                      🎯 B{matchedBlock.blockNumber}: {matchedBlock.schedule}
                                    </span>
                                  ) : task.startTime ? (
                                    <span 
                                      className="badge badge-secondary" 
                                      style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                                    >
                                      ⏰ {task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}
                                    </span>
                                  ) : null}

                                  {task.category && (
                                    <span 
                                      className="badge badge-secondary" 
                                      style={{ fontSize: '0.68rem', padding: '2px 7px', backgroundColor: 'rgba(255,255,255,0.06)' }}
                                    >
                                      {task.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              <button 
                                className="btn-icon" 
                                style={{ width: '24px', height: '24px' }}
                                onClick={() => handleOpenEditTask(task)}
                                title="Editar tarea"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button 
                                className="btn-icon" 
                                style={{ width: '24px', height: '24px', color: '#ef4444' }}
                                onClick={() => onRequestDelete && onRequestDelete(task, 'Evento')}
                                title="Eliminar tarea"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
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
      {/* MODAL: Nueva Tarea Operativa (Diaria o Eventual)                          */}
      {/* ========================================================================= */}
      {isNewTaskModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={20} color="var(--primary-600)" />
                <span>Crear Nueva Tarea Operativa</span>
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
                  <label className="form-label">Tipo de Tarea:</label>
                  <select 
                    className="form-control"
                    value={taskForm.taskType}
                    onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })}
                  >
                    <option value="diaria">☀️ Tarea Diaria (Rutina / Checklist del Día)</option>
                    <option value="eventual">📌 Tarea Eventual (Puntual / Extraordinaria)</option>
                  </select>
                </div>

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
              </div>

              {/* Rango del Protocolo Operativo */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯 Rango del Protocolo Operativo:</span>
                  <small style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Opcional)</small>
                </label>
                <select 
                  className="form-control"
                  value={taskForm.protocolBlock}
                  onChange={(e) => handleProtocolBlockChange(e.target.value, false)}
                >
                  <option value="">⚪ Sin Bloque / Horario Libre</option>
                  {protocolBlocks.map(block => (
                    <option key={block.id} value={block.id}>
                      🎯 {block.title} ({block.schedule})
                    </option>
                  ))}
                  <option value="custom">⚙️ Horario Personalizado</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hora Inicio:</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={taskForm.startTime} 
                    onChange={(e) => setTaskForm({ ...taskForm, startTime: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora Fin:</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={taskForm.endTime} 
                    onChange={(e) => setTaskForm({ ...taskForm, endTime: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-row">
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
      {/* MODAL: Editar Tarea Operativa                                             */}
      {/* ========================================================================= */}
      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Tarea Operativa</h3>
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
                  <label className="form-label">Tipo de Tarea:</label>
                  <select 
                    className="form-control"
                    value={editingTask.taskType || 'diaria'}
                    onChange={(e) => setEditingTask({ ...editingTask, taskType: e.target.value })}
                  >
                    <option value="diaria">☀️ Tarea Diaria (Rutina / Checklist del Día)</option>
                    <option value="eventual">📌 Tarea Eventual (Puntual / Extraordinaria)</option>
                  </select>
                </div>

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
              </div>

              {/* Rango del Protocolo Operativo */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯 Rango del Protocolo Operativo:</span>
                  <small style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Opcional)</small>
                </label>
                <select 
                  className="form-control"
                  value={editingTask.protocolBlock || ''}
                  onChange={(e) => handleProtocolBlockChange(e.target.value, true)}
                >
                  <option value="">⚪ Sin Bloque / Horario Libre</option>
                  {protocolBlocks.map(block => (
                    <option key={block.id} value={block.id}>
                      🎯 {block.title} ({block.schedule})
                    </option>
                  ))}
                  <option value="custom">⚙️ Horario Personalizado</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hora Inicio:</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={editingTask.startTime || '09:00'} 
                    onChange={(e) => setEditingTask({ ...editingTask, startTime: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora Fin:</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={editingTask.endTime || '18:00'} 
                    onChange={(e) => setEditingTask({ ...editingTask, endTime: e.target.value })} 
                  />
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

      {/* ========================================================================= */}
      {/* MODAL: Editar Protocolo Operativo Diario (Rutina de 4 Bloques)            */}
      {/* ========================================================================= */}
      {isEditProtocolModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '6px', borderRadius: 'var(--radius-sm)', color: 'var(--primary-600)' }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                    Editar Protocolo Operativo Diario (4 Bloques)
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Personaliza los nombres, rangos de horario y tareas estratégicas de cada bloque.
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseEditProtocol}>✕</button>
            </div>

            <form onSubmit={handleSaveProtocol}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px', margin: '16px 0' }}>
                {protocolEditForm.map((block, idx) => (
                  <div 
                    key={block.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${block.borderColor || 'var(--border-subtle)'}`,
                      borderLeft: `4px solid ${block.themeColor || 'var(--primary-600)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.84rem', color: block.themeColor }}>
                        Bloque {block.blockNumber || idx + 1}
                      </span>
                      <span className="badge badge-secondary" style={{ fontSize: '0.68rem' }}>
                        {block.schedule}
                      </span>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Título / Nombre del Bloque:</label>
                      <input 
                        type="text"
                        className="form-control"
                        style={{ fontSize: '0.82rem', padding: '5px 8px' }}
                        value={block.title}
                        onChange={(e) => handleUpdateBlockField(idx, 'title', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.74rem' }}>Horario Visible:</label>
                        <input 
                          type="text"
                          className="form-control"
                          style={{ fontSize: '0.82rem', padding: '5px 8px' }}
                          placeholder="Ej: 15:00 - 16:00"
                          value={block.schedule}
                          onChange={(e) => handleUpdateBlockField(idx, 'schedule', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.74rem' }}>Horas (Inicio - Fin):</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            type="time" 
                            className="form-control" 
                            style={{ fontSize: '0.76rem', padding: '4px 6px' }}
                            value={block.startTime || ''} 
                            onChange={(e) => handleUpdateBlockField(idx, 'startTime', e.target.value)} 
                          />
                          <input 
                            type="time" 
                            className="form-control" 
                            style={{ fontSize: '0.76rem', padding: '4px 6px' }}
                            value={block.endTime || ''} 
                            onChange={(e) => handleUpdateBlockField(idx, 'endTime', e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Descripción / Plan de Acción:</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        style={{ fontSize: '0.8rem', padding: '6px 8px', resize: 'vertical' }}
                        value={block.description}
                        onChange={(e) => handleUpdateBlockField(idx, 'description', e.target.value)}
                        required
                      ></textarea>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleResetProtocolDefaults}
                  title="Restablece los textos originales del protocolo de 4 bloques"
                  style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={13} />
                  <span>Restablecer Rutina Original</span>
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseEditProtocol}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} />
                    <span>Guardar Protocolo</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
