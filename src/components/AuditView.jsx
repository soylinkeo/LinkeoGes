import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  RotateCcw, 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  User, 
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  PlusCircle,
  Edit3
} from 'lucide-react';

export default function AuditView({
  auditLogs = [],
  onRestoreItem
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterPartner, setFilterPartner] = useState('all');
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // Filtros
  const filteredLogs = auditLogs.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (log.entityName || '').toLowerCase().includes(term) ||
      (log.reason || '').toLowerCase().includes(term) ||
      (log.entityId || '').toLowerCase().includes(term);

    const matchesType = filterType === 'all' || log.entityType === filterType;
    const matchesAction = filterAction === 'all' || (log.actionType || 'Eliminación') === filterAction;
    const matchesPartner = filterPartner === 'all' || log.deletedBy === filterPartner || log.author === filterPartner;

    return matchesSearch && matchesType && matchesAction && matchesPartner;
  });

  const countDeletions = auditLogs.filter(l => (l.actionType || 'Eliminación') === 'Eliminación').length;
  const countModifications = auditLogs.filter(l => l.actionType === 'Modificación').length;
  const countCreations = auditLogs.filter(l => l.actionType === 'Creación').length;

  return (
    <div className="audit-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={24} color="var(--primary-600)" />
            <span>Bitácora Universal de Auditoría & Control ERP</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Registro histórico inmutable de creaciones, modificaciones y eliminaciones con autoría de socios y trazabilidad de datos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            🛡️ Auditoría Empresarial Activa
          </span>
        </div>
      </div>

      {/* Métricas de Auditoría */}
      <div className="metrics-grid" style={{ marginBottom: '20px' }}>
        <div className="kpi-card kpi-red">
          <div className="kpi-header">
            <span className="kpi-label">Eliminaciones Auditadas</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <Trash2 size={18} />
            </div>
          </div>
          <div className="kpi-value">{countDeletions}</div>
          <div className="kpi-subtext">Bajas registradas con justificación</div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-header">
            <span className="kpi-label">Modificaciones / Ediciones</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Edit3 size={18} />
            </div>
          </div>
          <div className="kpi-value">{countModifications}</div>
          <div className="kpi-subtext">Cambios de estado, fechas o datos</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-header">
            <span className="kpi-label">Creaciones Registradas</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <PlusCircle size={18} />
            </div>
          </div>
          <div className="kpi-value">{countCreations}</div>
          <div className="kpi-subtext">Altas en el sistema</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por nombre, ID o motivo..."
              style={{ paddingLeft: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select 
              className="form-control"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="all">⚡ Todas las Acciones</option>
              <option value="Eliminación">🗑️ Solo Eliminaciones</option>
              <option value="Modificación">✏️ Solo Modificaciones</option>
              <option value="Creación">➕ Solo Creaciones</option>
            </select>
          </div>

          <div>
            <select 
              className="form-control"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">📦 Todos los Tipos de Datos</option>
              <option value="Inversión Inicial">Inversión Inicial</option>
              <option value="Gasto Fijo">Gastos Fijos</option>
              <option value="Mix Producto">Mix de Productos</option>
              <option value="Costos Variables">Costos Variables</option>
              <option value="Embudo de Ventas">Embudo de Ventas</option>
              <option value="Plan 30 Días">Plan 30 Días</option>
              <option value="Parámetros Proyección">Parámetros de Negocio</option>
              <option value="Producto">Productos / Packs</option>
              <option value="Gasto">Gastos Operativos</option>
              <option value="Venta">Ventas</option>
              <option value="Lead">Leads / Prospectos</option>
              <option value="Tarjeta NFC">Chips / Tarjetas NFC</option>
              <option value="Insumo">Insumos de Inventario</option>
              <option value="Evento">Citas / Eventos</option>
              <option value="Distrito">Distrito Maestro</option>
              <option value="Entregable">Hito de Proyecto</option>
            </select>
          </div>

          <div>
            <select 
              className="form-control"
              value={filterPartner}
              onChange={(e) => setFilterPartner(e.target.value)}
            >
              <option value="all">👥 Todos los Co-CEOs</option>
              <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
              <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '10px' }}>
          Mostrando <strong>{filteredLogs.length}</strong> de {auditLogs.length} registros auditados
        </div>
      </div>

      {/* Tabla de Auditoría */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Acción</th>
                <th>Tipo de Dato</th>
                <th>Elemento Afectado</th>
                <th>Autor / Socio</th>
                <th>Detalle / Justificación</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No hay registros de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const action = log.actionType || 'Eliminación';
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {log.timestamp}
                      </td>
                      <td>
                        <span className={`badge ${
                          action === 'Eliminación' ? 'badge-red' :
                          action === 'Modificación' ? 'badge-blue' : 'badge-green'
                        }`}>
                          {action === 'Eliminación' ? '🗑️ Baja' : action === 'Modificación' ? '✏️ Edición' : '➕ Alta'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-purple">
                          {log.entityType}
                        </span>
                      </td>
                      <td>
                        <strong>{log.entityName}</strong>
                        {log.entityId && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ID: <span className="code-mono">{log.entityId}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {log.authorName 
                            ? (log.authorName.includes('Kevin') ? `🚀 ${log.authorName} (Co-CEO)` : `👨‍💼 ${log.authorName} (Co-CEO)`)
                            : (log.deletedBy === 'luis' || log.author === 'luis') ? '👨‍💼 Luis Romero (Co-CEO)' : '🚀 Kevin Servat (Co-CEO)'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-main)', maxWidth: '320px' }}>
                        {log.reason}
                        {log.diff && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {log.diff}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {log.snapshot && (
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                              onClick={() => setSelectedSnapshot(log)}
                              title="Ver datos del elemento"
                            >
                              <Eye size={13} />
                              <span>Datos</span>
                            </button>
                          )}
                          {log.restorable && (
                            <button 
                              className="btn btn-success btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                              onClick={() => onRestoreItem(log)}
                              title="Restaurar elemento a la colección activa"
                            >
                              <RotateCcw size={13} />
                              <span>Restaurar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Snapshot de Datos */}
      {selectedSnapshot && (
        <div className="modal-overlay" onClick={() => setSelectedSnapshot(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Detalles Auditados del Registro</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedSnapshot.entityType} • {selectedSnapshot.entityName}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedSnapshot(null)}>✕</button>
            </div>

            <div style={{ padding: '10px 0' }}>
              <div 
                style={{
                  backgroundColor: 'var(--bg-input)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  fontSize: '0.82rem'
                }}
              >
                <div><strong>Fecha de Acción:</strong> {selectedSnapshot.timestamp}</div>
                <div><strong>Tipo de Acción:</strong> {selectedSnapshot.actionType || 'Eliminación'}</div>
                <div><strong>Autor:</strong> {selectedSnapshot.authorName ? `${selectedSnapshot.authorName} (Co-CEO)` : ((selectedSnapshot.deletedBy === 'luis' || selectedSnapshot.author === 'luis') ? 'Luis Romero (Co-CEO)' : 'Kevin Servat (Co-CEO)')}</div>
                <div><strong>Motivo / Nota:</strong> {selectedSnapshot.reason}</div>
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Datos en Formato Estructurado (JSON):
              </div>

              <pre 
                style={{
                  backgroundColor: '#0a0f1d',
                  color: '#38bdf8',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.78rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {JSON.stringify(selectedSnapshot.snapshot, null, 2)}
              </pre>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={() => setSelectedSnapshot(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
