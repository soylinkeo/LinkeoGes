import { localDate } from '../utils/dateUtils.js';
import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Kanban, 
  Plus, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Sparkles, 
  Trash2,
  Edit3,
  Mail,
  Check,
  ExternalLink,
  Search,
  MessageSquare,
  Copy,
  Send,
  Filter,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  AlertTriangle,
  X,
  ArrowRight,
  User,
  CreditCard,
  Zap
} from 'lucide-react';
import DistrictCombobox from './DistrictCombobox.jsx';
import { INITIAL_PRODUCTS } from '../data/initialData.js';

export const getRubroStyle = (rubro) => {
  const r = String(rubro || '').toLowerCase().trim();
  if (r.includes('restaurante') || r.includes('cafeter') || r.includes('comida') || r.includes('bar') || r.includes('gastronom')) {
    return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' };
  }
  if (r.includes('barber') || r.includes('estét') || r.includes('peluquer') || r.includes('belleza') || r.includes('spa')) {
    return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' };
  }
  if (r.includes('salud') || r.includes('clínic') || r.includes('dental') || r.includes('médic') || r.includes('odontolog')) {
    return { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.35)' };
  }
  if (r.includes('lavander')) {
    return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' };
  }
  if (r.includes('auto') || r.includes('conduc') || r.includes('taller') || r.includes('mecánic')) {
    return { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.35)' };
  }
  return { bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1', border: 'rgba(148, 163, 184, 0.28)' };
};

export const STAGES = [
  { id: 'prospecto', label: '1. Prospecto', color: '#64748b' },
  { id: 'visitado', label: '2. Visitado', color: '#3b82f6' },
  { id: 'negociacion', label: '3. Negociación', color: '#f59e0b' },
  { id: 'configurando', label: '4. Configurando NFC', color: '#8b5cf6' },
  { id: 'entregado', label: '5. Entregado y Cobrado (Ventas)', color: '#10b981' },
  { id: 'postventa', label: '6. Post-Venta', color: '#06b6d4' },
  { id: 'no_hecha_o_espera', label: '7. Venta no hecha o cliente en espera', color: '#f43f5e' }
];

export const normalizeLeadStage = (stage) => {
  if (!stage) return 'prospecto';
  const s = String(stage).toLowerCase().trim();
  if (s === 'contactado') return 'prospecto';
  if (s === 'esperando_info') return 'configurando';
  if (s === 'entregado_cobrado') return 'entregado';
  if (s === 'post_venta' || s === 'post-venta') return 'postventa';
  if (s === 'no_hecha' || s === 'espera' || s === 'no_hecha_o_espera' || s === 'cliente_espera' || s.includes('espera') || s.includes('no hecha')) return 'no_hecha_o_espera';
  if (STAGES.some(st => st.id === s)) return s;
  return 'prospecto';
};

export const getLeadAgeInDays = (lead) => {
  if (!lead) return 0;
  let dateMs = null;
  if (lead.createdAt) {
    const parsed = new Date(lead.createdAt).getTime();
    if (!isNaN(parsed)) dateMs = parsed;
  }
  if (!dateMs && lead.id && String(lead.id).startsWith('lead-')) {
    const rawNum = parseInt(lead.id.replace('lead-', ''), 10);
    if (!isNaN(rawNum) && rawNum > 1600000000000) {
      dateMs = rawNum;
    }
  }
  if (!dateMs && lead.nextStepDate) {
    const parsed = new Date(lead.nextStepDate).getTime();
    if (!isNaN(parsed)) dateMs = parsed;
  }
  if (!dateMs) return 0;
  const diffDays = Math.floor((Date.now() - dateMs) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const isLeadOverOneWeek = (lead) => {
  const stage = normalizeLeadStage(lead?.stage);
  if (stage === 'entregado' || stage === 'postventa' || stage === 'no_hecha_o_espera') {
    return false;
  }
  return getLeadAgeInDays(lead) >= 7;
};

import { buildLeadWhatsAppMessage, getLeadMessageVariants } from '../utils/leadMessages.js';
import { formatGoogleMapsUrl } from '../utils/mapsUtils.js';
export { buildLeadWhatsAppMessage, getLeadMessageVariants, formatGoogleMapsUrl };

export default function KanbanView({
  leads = [],
  sales = [],
  products = [],
  districts = [],
  onUpdateLeadStage,
  onUpdateLead,
  onAddNewLead,
  onConvertLeadToSale,
  onRequestDelete,
  showToast
}) {
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [mobileStageFilter, setMobileStageFilter] = useState('all');

  // Estado modal Speech de Ventas
  const [speechModalLead, setSpeechModalLead] = useState(null);
  const [selectedSpeechVariant, setSelectedSpeechVariant] = useState('vendible');
  const [customSpeechText, setCustomSpeechText] = useState('');
  const [speechCopied, setSpeechCopied] = useState(false);

  const handleOpenSpeechModal = (lead) => {
    setSpeechModalLead(lead);
    setSelectedSpeechVariant('vendible');
    setCustomSpeechText(buildLeadWhatsAppMessage(lead, 'vendible'));
    setSpeechCopied(false);
  };

  const handleCloseSpeechModal = () => {
    setSpeechModalLead(null);
    setSpeechCopied(false);
  };

  const handleSelectSpeechVariant = (variantId) => {
    setSelectedSpeechVariant(variantId);
    if (speechModalLead) {
      setCustomSpeechText(buildLeadWhatsAppMessage(speechModalLead, variantId));
    }
    setSpeechCopied(false);
  };

  const handleCopySpeech = () => {
    if (!customSpeechText) return;
    navigator.clipboard.writeText(customSpeechText);
    setSpeechCopied(true);
    if (showToast) showToast('¡Speech copiado al portapapeles!', 'success');
    setTimeout(() => setSpeechCopied(false), 2500);
  };

  // Catálogo garantizado de productos oficiales y registrados
  const catalogOptions = useMemo(() => {
    const map = new Map();
    INITIAL_PRODUCTS.forEach(p => {
      if (p && p.name) map.set(p.name.trim().toLowerCase(), p);
    });
    if (Array.isArray(products)) {
      products.forEach(p => {
        if (p && p.name && p.name.trim()) {
          map.set(p.name.trim().toLowerCase(), p);
        }
      });
    }
    return Array.from(map.values());
  }, [products]);

  // Estados de Búsqueda y Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeller, setFilterSeller] = useState('all');
  const [filterRubro, setFilterRubro] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterContacted, setFilterContacted] = useState('all');
  const [filterAge, setFilterAge] = useState('all');

  // Leads con más de 1 semana sin concretar en etapas activas
  const leadsOverOneWeek = useMemo(() => {
    return leads.filter(isLeadOverOneWeek);
  }, [leads]);

  const handleMoveOldLeadsToWait = () => {
    if (leadsOverOneWeek.length === 0) {
      if (showToast) showToast('No hay prospectos activos con más de 1 semana sin movimiento', 'info');
      return;
    }
    const count = leadsOverOneWeek.length;
    leadsOverOneWeek.forEach(l => {
      onUpdateLeadStage(l.id, 'no_hecha_o_espera');
    });
    if (showToast) {
      showToast(`⏰ Se trasladaron ${count} prospecto${count > 1 ? 's' : ''} a "7. Venta no hecha o cliente en espera"`, 'success');
    }
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 }
    });
  };

  // Opciones dinámicas para filtros de Rubro y Distrito
  const availableRubros = useMemo(() => {
    const set = new Set();
    leads.forEach(l => {
      if (l.rubro && l.rubro.trim()) set.add(l.rubro.trim());
    });
    return Array.from(set).sort();
  }, [leads]);

  const availableDistricts = useMemo(() => {
    const set = new Set();
    leads.forEach(l => {
      if (l.district && l.district.trim()) set.add(l.district.trim());
    });
    if (Array.isArray(districts)) {
      districts.forEach(d => { if (d && d.trim()) set.add(d.trim()); });
    }
    return Array.from(set).sort();
  }, [leads, districts]);

  // Leads filtrados en tiempo real
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const bName = String(lead.businessName || '').toLowerCase();
        const cName = String(lead.contactName || '').toLowerCase();
        const dist = String(lead.district || '').toLowerCase();
        const ph = String(lead.phone || '').toLowerCase();
        const em = String(lead.email || '').toLowerCase();
        const nt = String(lead.notes || '').toLowerCase();
        const prod = String(lead.interestedProduct || '').toLowerCase();
        const rub = String(lead.rubro || '').toLowerCase();

        const matches = bName.includes(query) ||
          cName.includes(query) ||
          dist.includes(query) ||
          ph.includes(query) ||
          em.includes(query) ||
          nt.includes(query) ||
          prod.includes(query) ||
          rub.includes(query);

        if (!matches) return false;
      }

      if (filterSeller !== 'all') {
        const seller = String(lead.assignedTo || '').toLowerCase();
        if (filterSeller === 'luis' && seller !== 'luis') return false;
        if (filterSeller === 'kevin' && seller !== 'kevin') return false;
      }

      if (filterRubro !== 'all') {
        if (String(lead.rubro || '').trim().toLowerCase() !== filterRubro.trim().toLowerCase()) {
          return false;
        }
      }

      if (filterDistrict !== 'all') {
        if (String(lead.district || '').trim().toLowerCase() !== filterDistrict.trim().toLowerCase()) {
          return false;
        }
      }

      if (filterContacted !== 'all') {
        if (filterContacted === 'contacted' && !lead.contacted) return false;
        if (filterContacted === 'not_contacted' && lead.contacted) return false;
      }

      if (filterAge !== 'all') {
        const isOld = isLeadOverOneWeek(lead);
        if (filterAge === 'over_7d' && !isOld) return false;
        if (filterAge === 'under_7d' && isOld) return false;
      }

      return true;
    });
  }, [leads, searchTerm, filterSeller, filterRubro, filterDistrict, filterContacted, filterAge]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || 
    filterSeller !== 'all' || 
    filterRubro !== 'all' || 
    filterDistrict !== 'all' || 
    filterContacted !== 'all' || 
    filterAge !== 'all'
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterSeller('all');
    setFilterRubro('all');
    setFilterDistrict('all');
    setFilterContacted('all');
    setFilterAge('all');
  };

  // Formulario editar lead
  const [editLeadForm, setEditLeadForm] = useState({
    id: '',
    businessName: '',
    rubro: 'Restaurante / Cafetería',
    district: 'Miraflores',
    address: '',
    googleMapsUrl: '',
    isMapsVerified: false,
    contactName: '',
    phone: '',
    email: '',
    stage: 'prospecto',
    contacted: false,
    interestedProduct: '',
    estimatedValue: 100.00,
    assignedTo: 'kevin',
    notes: '',
    nextStepNote: 'Enviar catálogo por WhatsApp',
    nextStepDate: localDate()
  });

  // Formulario nuevo lead
  const [newLeadForm, setNewLeadForm] = useState({
    businessName: '',
    rubro: 'Restaurante / Cafetería',
    district: 'Miraflores',
    address: '',
    googleMapsUrl: '',
    isMapsVerified: false,
    contactName: '',
    phone: '',
    email: '',
    contacted: false,
    interestedProduct: '',
    estimatedValue: 100.00,
    assignedTo: 'kevin',
    notes: '',
    nextStepNote: 'Enviar catálogo por WhatsApp',
    nextStepDate: localDate()
  });

  const handleCloseNewLeadModal = () => {
    setNewLeadForm({
      businessName: '',
      rubro: 'Restaurante / Cafetería',
      district: districts[0] || 'Miraflores',
      address: '',
      googleMapsUrl: '',
      isMapsVerified: false,
      contactName: '',
      phone: '',
      email: '',
      contacted: false,
      interestedProduct: '',
      estimatedValue: 100.00,
      assignedTo: 'kevin',
      notes: '',
      nextStepNote: 'Enviar catálogo por WhatsApp',
      nextStepDate: localDate()
    });
    setIsNewLeadModalOpen(false);
  };

  const handleCloseConvertModal = () => {
    setSelectedLead(null);
    setIsConvertModalOpen(false);
  };

  const handleOpenEditLead = (lead) => {
    setEditingLead(lead);
    const sanitizedMaps = lead.googleMapsUrl ? formatGoogleMapsUrl(lead.googleMapsUrl, {
      businessName: lead.businessName,
      address: lead.address,
      district: lead.district
    }) : '';
    const hasMapsUrl = Boolean(sanitizedMaps && sanitizedMaps.trim());
    const rawPhone = String(lead.phone || '').replace(/\D/g, '');
    const normalizedPhone = rawPhone.length === 11 && rawPhone.startsWith('51') ? rawPhone.slice(2) : rawPhone.slice(0, 9);
    setEditLeadForm({
      id: lead.id,
      businessName: lead.businessName || '',
      rubro: lead.rubro || 'Restaurante / Cafetería',
      district: lead.district || (districts[0] || 'Miraflores'),
      address: lead.address || '',
      googleMapsUrl: sanitizedMaps,
      isMapsVerified: hasMapsUrl,
      contactName: lead.contactName || '',
      phone: normalizedPhone,
      email: lead.email || '',
      stage: normalizeLeadStage(lead.stage),
      contacted: Boolean(lead.contacted),
      interestedProduct: lead.interestedProduct || '',
      estimatedValue: Number(lead.estimatedValue ?? 100),
      assignedTo: lead.assignedTo || 'kevin',
      notes: lead.notes || '',
      nextStepNote: lead.nextStepNote || 'Enviar catálogo por WhatsApp',
      nextStepDate: lead.nextStepDate || localDate()
    });
    setIsEditLeadModalOpen(true);
  };

  const handleCloseEditLeadModal = () => {
    setIsEditLeadModalOpen(false);
    setEditingLead(null);
  };

  // Validación y apertura inmediata de Google Maps al dar Check
  const handleCheckMapsUrl = (formType) => {
    const isNew = formType === 'new';
    const form = isNew ? newLeadForm : editLeadForm;
    const setForm = isNew ? setNewLeadForm : setEditLeadForm;

    const rawUrl = (form.googleMapsUrl || '').trim();
    const fallbackContext = {
      businessName: form.businessName,
      address: form.address,
      district: form.district
    };

    const formattedUrl = formatGoogleMapsUrl(rawUrl, fallbackContext);

    if (!formattedUrl) {
      if (showToast) showToast('Ingresa un enlace, una dirección física o el nombre del negocio para buscarlo.', 'warning');
      return;
    }

    setForm(prev => ({
      ...prev,
      googleMapsUrl: formattedUrl,
      isMapsVerified: true
    }));

    // Buscar y abrir al momento en nueva pestaña
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    if (showToast) {
      showToast('Enlace de Google Maps verificado y abierto al momento', 'success');
    }
  };

  // Botón rápido para buscar el local en Maps si aún no se tiene el enlace
  const handleSearchMapsNow = (formType) => {
    const isNew = formType === 'new';
    const form = isNew ? newLeadForm : editLeadForm;
    const setForm = isNew ? setNewLeadForm : setEditLeadForm;

    const fallbackContext = {
      businessName: form.businessName,
      address: form.address,
      district: form.district
    };

    const searchUrl = formatGoogleMapsUrl(form.googleMapsUrl || '', fallbackContext) || 'https://www.google.com/maps/search/?api=1&query=Lima%20Per%C3%BA';

    setForm(prev => ({ ...prev, googleMapsUrl: searchUrl, isMapsVerified: true }));
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    if (showToast) {
      showToast('Buscando negocio en Google Maps al momento...', 'info');
    }
  };

  const handleSaveEditLead = (e) => {
    e.preventDefault();
    if (!editingLead) return;

    const sanitizedMapsUrl = editLeadForm.googleMapsUrl?.trim()
      ? formatGoogleMapsUrl(editLeadForm.googleMapsUrl.trim(), {
          businessName: editLeadForm.businessName,
          address: editLeadForm.address,
          district: editLeadForm.district
        })
      : '';

    const updatedLead = {
      ...editingLead,
      businessName: editLeadForm.businessName.trim(),
      rubro: editLeadForm.rubro,
      district: editLeadForm.district.trim(),
      address: editLeadForm.address.trim(),
      googleMapsUrl: sanitizedMapsUrl,
      contactName: editLeadForm.contactName.trim(),
      phone: editLeadForm.phone.replace(/\D/g, '').slice(0, 9),
      email: editLeadForm.email.trim(),
      stage: normalizeLeadStage(editLeadForm.stage),
      contacted: Boolean(editLeadForm.contacted),
      interestedProduct: editLeadForm.interestedProduct,
      estimatedValue: Number(editLeadForm.estimatedValue) || 0,
      assignedTo: editLeadForm.assignedTo,
      notes: editLeadForm.notes.trim(),
      nextStepNote: editLeadForm.nextStepNote.trim(),
      nextStepDate: editLeadForm.nextStepDate
    };

    if (onUpdateLead) {
      onUpdateLead(updatedLead);
    }
    if (showToast) {
      showToast(`✏️ Prospecto "${updatedLead.businessName}" actualizado correctamente`, 'success');
    }
    handleCloseEditLeadModal();

    // Si pasa a Entregado y Cobrado, se considera automáticamente venta
    if (updatedLead.stage === 'entregado' && editingLead?.stage !== 'entregado') {
      const alreadyHasSale = sales.some(s => 
        (s.leadId && s.leadId === updatedLead.id) || 
        (s.clientName && updatedLead.businessName && s.clientName.trim().toLowerCase() === updatedLead.businessName.trim().toLowerCase())
      );
      if (!alreadyHasSale) {
        handleOpenConvert(updatedLead);
      }
    }
  };

  const handleStageChange = (leadId, newStage) => {
    const lead = leads.find(l => l.id === leadId);
    if (newStage === 'entregado' && lead) {
      const alreadyHasSale = sales.some(s => 
        (s.leadId && s.leadId === lead.id) || 
        (s.clientName && lead.businessName && s.clientName.trim().toLowerCase() === lead.businessName.trim().toLowerCase())
      );
      if (!alreadyHasSale) {
        // Al pasar a Entregado y Cobrado, se considera automáticamente venta
        handleOpenConvert(lead);
        return;
      }
    }

    onUpdateLeadStage(leadId, newStage);
    const stageObj = STAGES.find(s => s.id === newStage);
    if (showToast) {
      showToast(`Fase comercial: ${stageObj ? stageObj.label : newStage}`, 'info', 1800);
    }
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
    const sanitizedMapsUrl = newLeadForm.googleMapsUrl?.trim()
      ? formatGoogleMapsUrl(newLeadForm.googleMapsUrl.trim(), {
          businessName: newLeadForm.businessName,
          address: newLeadForm.address,
          district: newLeadForm.district
        })
      : '';

    const newLead = {
      id: `lead-${Date.now()}`,
      businessName: newLeadForm.businessName.trim(),
      rubro: newLeadForm.rubro,
      district: newLeadForm.district.trim(),
      address: newLeadForm.address.trim(),
      googleMapsUrl: sanitizedMapsUrl,
      contactName: newLeadForm.contactName.trim(),
      phone: newLeadForm.phone.replace(/\D/g, '').slice(0, 9),
      email: newLeadForm.email.trim(),
      stage: 'prospecto',
      contacted: Boolean(newLeadForm.contacted),
      interestedProduct: newLeadForm.interestedProduct,
      estimatedValue: Number(newLeadForm.estimatedValue) || 100,
      assignedTo: newLeadForm.assignedTo,
      notes: newLeadForm.notes.trim(),
      nextStepNote: newLeadForm.nextStepNote.trim(),
      nextStepDate: newLeadForm.nextStepDate
    };

    onAddNewLead(newLead);
    if (showToast) {
      showToast(`✅ Prospecto "${newLead.businessName}" añadido al embudo comercial`, 'success');
    }
    handleCloseNewLeadModal();
  };

  const handleOpenConvert = (lead) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvert = () => {
    if (!selectedLead) return;
    const name = selectedLead.businessName;
    const fallbackProduct = catalogOptions.find(p => Number(p.stock ?? 0) > 0)?.name || catalogOptions[0]?.name || 'Tarjeta Google NFC Cuadrado ESP';
    const leadToConvert = {
      ...selectedLead,
      interestedProduct: selectedLead.interestedProduct || fallbackProduct
    };
    if (onConvertLeadToSale(leadToConvert) === false) return;
    if (showToast) {
      showToast(`🎉 ¡Venta generada! Lead "${name}" conectado a Entregado y Cobrado`, 'success');
    }
    handleCloseConvertModal();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });
  };

  const totalPipelineValue = filteredLeads.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);

  return (
    <div className="kanban-view">
      {/* Header Compacto para maximizar espacio vertical */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Kanban size={22} color="var(--primary-600)" />
              <span>Pipeline B2B | Embudo de Ventas Linkeo</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
              7 fases comerciales • Prospectos y cuentas Linkeo B2B
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
              Pipeline: S/ {totalPipelineValue.toFixed(2)}
            </span>
            <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
              {filteredLeads.length} {hasActiveFilters ? `de ${leads.length}` : ''} Leads
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setIsNewLeadModalOpen(true)}>
            <Plus size={15} />
            <span>+ Nuevo Prospecto / Lead</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Multicriterio */}
      <div className="kanban-toolbar">
        {/* Buscador por Texto */}
        <div className="kanban-search-box">
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input 
            type="text"
            placeholder="Buscar por negocio, contacto, distrito, teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => setSearchTerm('')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              title="Borrar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtro Vendedor */}
        <select 
          className="kanban-filter-select"
          value={filterSeller}
          onChange={(e) => setFilterSeller(e.target.value)}
          title="Filtrar por vendedor asignado"
        >
          <option value="all">👤 Todos los vendedores</option>
          <option value="luis">👨‍💼 Luis Romero</option>
          <option value="kevin">🚀 Kevin Servat</option>
        </select>

        {/* Filtro Rubro */}
        <select 
          className="kanban-filter-select"
          value={filterRubro}
          onChange={(e) => setFilterRubro(e.target.value)}
          title="Filtrar por tipo de negocio / rubro"
        >
          <option value="all">🏢 Todos los rubros</option>
          {availableRubros.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Filtro Distrito */}
        <select 
          className="kanban-filter-select"
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          title="Filtrar por distrito"
        >
          <option value="all">📍 Todos los distritos</option>
          {availableDistricts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Filtro Contactado */}
        <select 
          className="kanban-filter-select"
          value={filterContacted}
          onChange={(e) => setFilterContacted(e.target.value)}
          title="Filtrar por estado de contacto"
        >
          <option value="all">🔔 Contacto: Todos</option>
          <option value="contacted">✅ Contactados</option>
          <option value="not_contacted">⏳ Sin contactar</option>
        </select>

        {/* Filtro Antigüedad */}
        <select 
          className="kanban-filter-select"
          value={filterAge}
          onChange={(e) => setFilterAge(e.target.value)}
          title="Filtrar por antigüedad del prospecto"
        >
          <option value="all">📅 Antigüedad: Todos</option>
          <option value="over_7d">⚠️ Inactivos (+1 semana)</option>
          <option value="under_7d">⚡ Recientes (&lt;1 semana)</option>
        </select>

        {/* Botón Limpiar Filtros */}
        {hasActiveFilters && (
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={handleClearFilters}
            style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCcw size={12} />
            <span>Limpiar filtros</span>
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Mostrando <strong>{filteredLeads.length}</strong> de <strong>{leads.length}</strong> leads</span>
        </div>
      </div>

      {/* Banner de Traslado Masivo por Regla de 1 Semana */}
      {leadsOverOneWeek.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '9px 14px',
          background: 'linear-gradient(90deg, rgba(244, 63, 94, 0.1) 0%, rgba(245, 158, 11, 0.08) 100%)',
          border: '1px solid rgba(244, 63, 94, 0.28)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>⏰</span>
            <span>
              <strong>Regla de 1 semana:</strong> Hay <strong>{leadsOverOneWeek.length}</strong> prospecto{leadsOverOneWeek.length > 1 ? 's' : ''} activo{leadsOverOneWeek.length > 1 ? 's' : ''} con más de 7 días sin avance comercial.
            </span>
          </div>

          <button 
            type="button"
            className="btn btn-sm"
            onClick={handleMoveOldLeadsToWait}
            style={{
              backgroundColor: '#f43f5e',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.75rem',
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(244, 63, 94, 0.35)'
            }}
          >
            <span>Enviar a "7. Venta no hecha o cliente en espera" ({leadsOverOneWeek.length})</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Selector Táctil de Fases en Móvil y Desktop */}
      <div className="kanban-stage-tabs">
        <button 
          type="button"
          className={`btn btn-sm ${mobileStageFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMobileStageFilter('all')}
          style={{ fontSize: '0.78rem', padding: '5px 12px', flexShrink: 0 }}
        >
          Todas las Fases ({filteredLeads.length})
        </button>
        {STAGES.map(stage => {
          const count = filteredLeads.filter(l => normalizeLeadStage(l.stage) === stage.id).length;
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

      {/* Tablero Kanban Full Width con Scroll Independiente por Columna */}
      <div className="kanban-board">
        {(mobileStageFilter === 'all' ? STAGES : STAGES.filter(s => s.id === mobileStageFilter)).map(stage => {
          const stageLeads = filteredLeads.filter(l => normalizeLeadStage(l.stage) === stage.id);
          const totalValue = stageLeads.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);
          const isSingleStage = mobileStageFilter !== 'all';

          return (
            <div key={stage.id} className={`kanban-column ${isSingleStage ? 'single-stage-view' : ''}`}>
              <div className="kanban-col-header">
                <div className="kanban-col-title">
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: stage.color, flexShrink: 0, boxShadow: `0 0 8px ${stage.color}88` }} />
                  <span>{stage.label}</span>
                </div>
                <span className="kanban-col-count">{stageLeads.length}</span>
              </div>

              <div className="kanban-col-subtotal">
                <span>Subtotal Fase:</span>
                <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>S/ {totalValue.toFixed(2)}</strong>
              </div>

              <div className="kanban-col-body">
                {stageLeads.length === 0 ? (
                  <div className="kanban-empty-state">
                    <div className="kanban-empty-icon">
                      <Sparkles size={18} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                      Sin prospectos en esta fase
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {stage.id === 'entregado' ? 'Aquí figurarán las ventas concretadas' : 'Usa el selector o añade un nuevo lead'}
                    </span>
                  </div>
                ) : (
                  stageLeads.map(lead => {
                    const associatedSale = sales.find(s => 
                      (s.leadId && s.leadId === lead.id) || 
                      (s.clientName && lead.businessName && s.clientName.trim().toLowerCase() === lead.businessName.trim().toLowerCase())
                    );
                    const rubroStyle = getRubroStyle(lead.rubro);
                    const mapsUrl = formatGoogleMapsUrl(lead.googleMapsUrl, {
                      businessName: lead.businessName,
                      address: lead.address,
                      district: lead.district
                    });

                    return (
                      <div 
                        key={lead.id} 
                        className="kanban-card"
                        onClick={() => handleOpenEditLead(lead)}
                        title="Clic para ver o editar información del prospecto"
                      >
                        {/* Fila 1: Rubro específico, Estado de Contacto y Monto Estimado */}
                        <div className="kanban-card-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                            <span 
                              className="kanban-rubro-badge"
                              style={{ 
                                backgroundColor: rubroStyle.bg, 
                                color: rubroStyle.text, 
                                border: `1px solid ${rubroStyle.border}` 
                              }}
                              title={`Rubro: ${lead.rubro || 'General'}`}
                            >
                              {lead.rubro || 'General'}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextContacted = !lead.contacted;
                                const updated = { ...lead, contacted: nextContacted };
                                if (onUpdateLead) onUpdateLead(updated);
                                if (showToast) {
                                  showToast(
                                    nextContacted 
                                      ? `✅ "${lead.businessName}" marcado como contactado` 
                                      : `⏳ "${lead.businessName}" marcado como pendiente de contacto`, 
                                    'info', 
                                    1400
                                  );
                                }
                              }}
                              className={`kanban-contact-pill ${lead.contacted ? 'contacted' : 'pending'}`}
                              title="Clic para alternar si se contactó o no"
                            >
                              {lead.contacted ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                              <span>{lead.contacted ? 'Contactado' : 'Sin contactar'}</span>
                            </button>
                          </div>

                          <span className="kanban-card-price">
                            S/ {Number(lead.estimatedValue || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Fila 2: Nombre del Negocio / Cliente en tipografía destacada */}
                        <h4 className="kanban-card-title" title={lead.businessName}>
                          {lead.businessName}
                        </h4>

                        {/* Fila 3: Ubicación específica con Distrito, Dirección y Enlace a Maps */}
                        <div className="kanban-info-row">
                          <MapPin size={12} className="kanban-info-icon" style={{ color: '#38bdf8' }} />
                          <span className="kanban-info-district">{lead.district || 'Lima'}</span>
                          {lead.address && (
                            <span className="kanban-info-address" title={lead.address}>
                              • {lead.address}
                            </span>
                          )}
                          {mapsUrl && (
                            <a 
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="kanban-maps-badge"
                              title="Abrir ubicación exacta en Google Maps"
                            >
                              <span>Mapa</span>
                              <ExternalLink size={9} />
                            </a>
                          )}
                        </div>

                        {/* Fila 4: Contacto / Encargado y Teléfono si existen */}
                        {(lead.contactName || lead.phone) && (
                          <div className="kanban-info-row">
                            <User size={12} className="kanban-info-icon" style={{ color: '#94a3b8' }} />
                            {lead.contactName && (
                              <span className="kanban-info-contact" title={`Contacto: ${lead.contactName}`}>
                                {lead.contactName}
                              </span>
                            )}
                            {lead.contactName && lead.phone && <span style={{ opacity: 0.4 }}>•</span>}
                            {lead.phone && (
                              <span className="kanban-info-phone" title={`Teléfono: ${lead.phone}`}>
                                {lead.phone}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Fila 5: Producto de Interés (si existe y no es genérico) */}
                        {lead.interestedProduct && lead.interestedProduct !== 'Por definir' && (
                          <div className="kanban-product-badge" title={`Producto solicitado: ${lead.interestedProduct}`}>
                            <CreditCard size={11} style={{ flexShrink: 0, color: '#a78bfa' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {lead.interestedProduct}
                            </span>
                          </div>
                        )}

                        {/* Fila 6: Próximo Paso Comercial / Nota de Seguimiento */}
                        {lead.nextStepNote && lead.nextStepNote !== 'Seguimiento comercial' && (
                          <div className="kanban-nextstep-badge" title={`Próximo paso: ${lead.nextStepNote}`}>
                            <Zap size={11} style={{ flexShrink: 0, color: '#fbbf24' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {lead.nextStepNote}
                            </span>
                          </div>
                        )}

                        {/* Alerta de Inactividad (+7 días) */}
                        {isLeadOverOneWeek(lead) && normalizeLeadStage(lead.stage) !== 'no_hecha_o_espera' && (
                          <div className="kanban-alert-overdue">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={11} color="#f43f5e" />
                              <span>+7 días sin avance</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStageChange(lead.id, 'no_hecha_o_espera');
                              }}
                              className="kanban-alert-btn"
                              title="Trasladar a 7. Venta no hecha o cliente en espera"
                            >
                              A Espera →
                            </button>
                          </div>
                        )}

                        {/* Footer con Vendedor, Acciones Rápidas y Selector de Fase Completo */}
                        <div className="kanban-card-footer">
                          <div className="kanban-card-footer-top">
                            <span className="kanban-seller-tag">
                              {lead.assignedTo === 'luis' ? '👨‍💼 Luis' : '🚀 Kevin'}
                            </span>

                            <div className="kanban-card-actions">
                              {/* WhatsApp directo */}
                              {lead.phone && (
                                <a 
                                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '').length === 9 ? '51' + lead.phone.replace(/[^0-9]/g, '') : lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(buildLeadWhatsAppMessage(lead, 'vendible'))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="kanban-action-btn whatsapp"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Abrir chat de WhatsApp con speech de ventas"
                                >
                                  <Phone size={12} />
                                </a>
                              )}

                              {/* Speech modal */}
                              <button 
                                type="button"
                                className="kanban-action-btn speech"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenSpeechModal(lead);
                                }}
                                title="Abrir generador de Speech de Ventas"
                              >
                                <MessageSquare size={12} />
                              </button>

                              {/* Botón o Estado de Venta */}
                              {associatedSale ? (
                                <span 
                                  className="kanban-sale-badge"
                                  title={`Venta registrada #${associatedSale.saleNumber || associatedSale.id}`}
                                >
                                  ✓ Venta
                                </span>
                              ) : normalizeLeadStage(lead.stage) !== 'postventa' ? (
                                <button 
                                  type="button"
                                  className="kanban-sale-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenConvert(lead);
                                  }}
                                  title="Convertir este prospecto en Venta Directa"
                                >
                                  <Sparkles size={10} />
                                  <span>+ Venta</span>
                                </button>
                              ) : null}

                              {/* Eliminar lead */}
                              <button 
                                type="button"
                                className="kanban-action-btn delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRequestDelete && onRequestDelete(lead, 'Lead');
                                }}
                                title="Eliminar prospecto"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Selector de Fase a Ancho Completo sin Cortes */}
                          <div className="kanban-card-stage-row" onClick={(e) => e.stopPropagation()}>
                            <span className="kanban-stage-row-label">Fase:</span>
                            <select 
                              className="kanban-card-stage-select"
                              value={normalizeLeadStage(lead.stage)}
                              onChange={(e) => handleStageChange(lead.id, e.target.value)}
                              title="Cambiar fase de este prospecto"
                            >
                              {STAGES.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Nuevo Prospecto */}
      {isNewLeadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Prospecto B2B</h3>
              <button className="close-btn" onClick={handleCloseNewLeadModal}>✕</button>
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

              {/* Check de Contactado */}
              <div className="form-group" style={{ backgroundColor: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox"
                    checked={newLeadForm.contacted}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contacted: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {newLeadForm.contacted ? <CheckCircle2 size={14} color="#10b981" /> : <XCircle size={14} color="#f87171" />}
                      ¿Negocio ya contactado?
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {newLeadForm.contacted ? 'Sí, ya se estableció contacto con el cliente' : 'No, prospecto en frío pendiente de contacto'}
                    </span>
                  </div>
                </label>
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
                  <DistrictCombobox 
                    value={newLeadForm.district}
                    onChange={(dist) => setNewLeadForm({ ...newLeadForm, district: dist })}
                    districts={districts}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección / Ubicación (Opcional):</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Av. Larco 123, Of. 401..."
                  value={newLeadForm.address}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, address: e.target.value })}
                />
              </div>

              {/* Enlace de Google Maps con Check y Búsqueda al momento */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <MapPin size={13} color="#3b82f6" />
                    <span>Enlace de Google Maps (Opcional):</span>
                  </label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleSearchMapsNow('new')}
                      title="Buscar este negocio en Google Maps al momento"
                    >
                      <Search size={11} />
                      <span>Buscar al momento</span>
                    </button>

                    {newLeadForm.googleMapsUrl && newLeadForm.isMapsVerified && (
                      <span 
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Check size={10} strokeWidth={3} />
                        <span>Link Verificado</span>
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Enlace (maps.app.goo.gl) o escribe la dirección física"
                    value={newLeadForm.googleMapsUrl}
                    onChange={(e) => setNewLeadForm({ 
                      ...newLeadForm, 
                      googleMapsUrl: e.target.value,
                      isMapsVerified: false 
                    })}
                    style={{ flex: 1 }}
                  />
                  
                  <button
                    type="button"
                    className={newLeadForm.isMapsVerified ? "btn btn-success" : "btn btn-primary"}
                    style={{
                      padding: '0 14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      backgroundColor: newLeadForm.isMapsVerified ? '#10b981' : undefined
                    }}
                    onClick={() => handleCheckMapsUrl('new')}
                    title="Dar check para validar el enlace o dirección y abrirlo en Google Maps"
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>{newLeadForm.isMapsVerified ? 'Verificado ✓' : 'Dar Check'}</span>
                  </button>
                </div>

                {newLeadForm.googleMapsUrl && (
                  <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', flexWrap: 'wrap', gap: '4px' }}>
                    <a 
                      href={formatGoogleMapsUrl(newLeadForm.googleMapsUrl, { businessName: newLeadForm.businessName, address: newLeadForm.address, district: newLeadForm.district })}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#3b82f6',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'underline',
                        maxWidth: '80%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title="Abrir ubicación en Google Maps"
                    >
                      <ExternalLink size={11} />
                      <span>Abrir en Google Maps: {newLeadForm.googleMapsUrl}</span>
                    </a>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {newLeadForm.isMapsVerified ? '✓ Listo para guardar' : 'Pendiente dar check'}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Persona de Contacto:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Gerencia / Nombre de Contacto"
                    value={newLeadForm.contactName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Teléfono WhatsApp:</label>
                    <span style={{ fontSize: '0.72rem', color: newLeadForm.phone?.length === 9 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                      {newLeadForm.phone?.length || 0}/9 dígitos
                    </span>
                  </div>
                  <input 
                    type="tel" 
                    className="form-control"
                    placeholder="987654321"
                    maxLength={9}
                    value={newLeadForm.phone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setNewLeadForm({ ...newLeadForm, phone: clean });
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} color="#ea4335" />
                  <span>Correo Electrónico / Gmail (Opcional):</span>
                </label>
                <input 
                  type="email" 
                  className="form-control"
                  placeholder="ejemplo@gmail.com o contacto@negocio.com"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Producto de Interés:</label>
                  <select 
                    className="form-control"
                    value={newLeadForm.interestedProduct}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selectedProd = catalogOptions.find(p => p.name === val || p.id === val);
                      const est = selectedProd ? Number(selectedProd.price) : 0;
                      setNewLeadForm({ 
                        ...newLeadForm, 
                        interestedProduct: val, 
                        estimatedValue: est > 0 ? est : newLeadForm.estimatedValue 
                      });
                    }}
                  >
                    <option value="">Por definir</option>
                    {catalogOptions.map(product => (
                      <option key={product.id || product.name} value={product.name}>
                        {product.name} — S/ {Number(product.price || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Valor Estimado (S/):</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={newLeadForm.estimatedValue}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedValue: e.target.value })}
                  />
                </div>
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
                <button type="button" className="btn btn-secondary" onClick={handleCloseNewLeadModal}>
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

      {/* MODAL: Editar Prospecto */}
      {isEditLeadModalOpen && editingLead && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="var(--primary-600)" />
                <span>Editar Prospecto: {editingLead.businessName}</span>
              </h3>
              <button className="close-btn" onClick={handleCloseEditLeadModal}>✕</button>
            </div>

            <form onSubmit={handleSaveEditLead}>
              <div className="form-group">
                <label className="form-label">Nombre del Negocio:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Barbería Don Tito, Pollería Roky's..."
                  value={editLeadForm.businessName}
                  onChange={(e) => setEditLeadForm({ ...editLeadForm, businessName: e.target.value })}
                  required
                />
              </div>

              {/* Check de Contactado */}
              <div className="form-group" style={{ backgroundColor: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox"
                    checked={editLeadForm.contacted}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, contacted: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {editLeadForm.contacted ? <CheckCircle2 size={14} color="#10b981" /> : <XCircle size={14} color="#f87171" />}
                      ¿Negocio ya contactado?
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {editLeadForm.contacted ? 'Sí, ya se estableció contacto con el cliente' : 'No, prospecto en frío pendiente de contacto'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rubro:</label>
                  <select 
                    className="form-control"
                    value={editLeadForm.rubro}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, rubro: e.target.value })}
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
                  <DistrictCombobox 
                    value={editLeadForm.district}
                    onChange={(dist) => setEditLeadForm({ ...editLeadForm, district: dist })}
                    districts={districts}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección / Ubicación (Opcional):</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Av. Larco 123, Of. 401..."
                  value={editLeadForm.address}
                  onChange={(e) => setEditLeadForm({ ...editLeadForm, address: e.target.value })}
                />
              </div>

              {/* Enlace de Google Maps con Check y Búsqueda al momento */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <MapPin size={13} color="#3b82f6" />
                    <span>Enlace de Google Maps (Opcional):</span>
                  </label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleSearchMapsNow('edit')}
                      title="Buscar este negocio en Google Maps al momento"
                    >
                      <Search size={11} />
                      <span>Buscar al momento</span>
                    </button>

                    {editLeadForm.googleMapsUrl && editLeadForm.isMapsVerified && (
                      <span 
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Check size={10} strokeWidth={3} />
                        <span>Link Verificado</span>
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Enlace (maps.app.goo.gl) o escribe la dirección física"
                    value={editLeadForm.googleMapsUrl}
                    onChange={(e) => setEditLeadForm({ 
                      ...editLeadForm, 
                      googleMapsUrl: e.target.value,
                      isMapsVerified: false 
                    })}
                    style={{ flex: 1 }}
                  />
                  
                  <button
                    type="button"
                    className={editLeadForm.isMapsVerified ? "btn btn-success" : "btn btn-primary"}
                    style={{
                      padding: '0 14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      backgroundColor: editLeadForm.isMapsVerified ? '#10b981' : undefined
                    }}
                    onClick={() => handleCheckMapsUrl('edit')}
                    title="Dar check para validar el enlace o dirección y abrirlo en Google Maps"
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>{editLeadForm.isMapsVerified ? 'Verificado ✓' : 'Dar Check'}</span>
                  </button>
                </div>

                {editLeadForm.googleMapsUrl && (
                  <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.73rem', flexWrap: 'wrap', gap: '4px' }}>
                    <a 
                      href={formatGoogleMapsUrl(editLeadForm.googleMapsUrl, { businessName: editLeadForm.businessName, address: editLeadForm.address, district: editLeadForm.district })}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#3b82f6',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'underline',
                        maxWidth: '80%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title="Abrir ubicación en Google Maps"
                    >
                      <ExternalLink size={11} />
                      <span>Abrir en Google Maps: {editLeadForm.googleMapsUrl}</span>
                    </a>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {editLeadForm.isMapsVerified ? '✓ Listo para guardar' : 'Pendiente dar check'}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Persona de Contacto:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Gerencia / Nombre de Contacto"
                    value={editLeadForm.contactName}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, contactName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Teléfono WhatsApp:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: editLeadForm.phone?.length === 9 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                        {editLeadForm.phone?.length || 0}/9 dígitos
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSpeechModal(editLeadForm)}
                        style={{
                          fontSize: '0.7rem',
                          color: '#3b82f6',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 600,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Ver variantes de speech de ventas y personalizar mensaje"
                      >
                        <MessageSquare size={11} />
                        <span>Ver Speech</span>
                      </button>
                      {editLeadForm.phone && (
                        <a
                          href={`https://wa.me/${editLeadForm.phone.replace(/[^0-9]/g, '').length === 9 ? '51' + editLeadForm.phone.replace(/[^0-9]/g, '') : editLeadForm.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(buildLeadWhatsAppMessage(editLeadForm, 'vendible'))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.7rem',
                            color: '#10b981',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                          title="Abrir chat en WhatsApp con el speech predeterminado"
                        >
                          <Phone size={10} />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <input 
                    type="tel" 
                    className="form-control"
                    placeholder="987654321"
                    maxLength={9}
                    value={editLeadForm.phone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setEditLeadForm({ ...editLeadForm, phone: clean });
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} color="#ea4335" />
                  <span>Correo Electrónico / Gmail (Opcional):</span>
                </label>
                <input 
                  type="email" 
                  className="form-control"
                  placeholder="ejemplo@gmail.com o contacto@negocio.com"
                  value={editLeadForm.email}
                  onChange={(e) => setEditLeadForm({ ...editLeadForm, email: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fase en el Embudo:</label>
                  <select 
                    className="form-control"
                    value={editLeadForm.stage}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, stage: e.target.value })}
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Asignado A:</label>
                  <select 
                    className="form-control"
                    value={editLeadForm.assignedTo}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, assignedTo: e.target.value })}
                  >
                    <option value="luis">👨‍💼 Luis Romero (Co-CEO)</option>
                    <option value="kevin">🚀 Kevin Servat (Co-CEO)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Producto de Interés:</label>
                  <select 
                    className="form-control"
                    value={editLeadForm.interestedProduct}
                    onChange={(e) => {
                      const val = e.target.value;
                      const prod = catalogOptions.find(p => p.name === val || p.id === val);
                      setEditLeadForm({ 
                        ...editLeadForm, 
                        interestedProduct: val, 
                        estimatedValue: prod ? Number(prod.price) : editLeadForm.estimatedValue 
                      });
                    }}
                  >
                    <option value="">Por definir</option>
                    {catalogOptions.map(product => (
                      <option key={product.id || product.name} value={product.name}>
                        {product.name} — S/ {Number(product.price || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Valor Estimado (S/):</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={editLeadForm.estimatedValue}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, estimatedValue: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Próximo Paso:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={editLeadForm.nextStepNote}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, nextStepNote: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha Próximo Paso:</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={editLeadForm.nextStepDate}
                    onChange={(e) => setEditLeadForm({ ...editLeadForm, nextStepDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas Adicionales:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  placeholder="Detalles de la conversación, objeciones, horarios preferidos..."
                  value={editLeadForm.notes}
                  onChange={(e) => setEditLeadForm({ ...editLeadForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    handleCloseEditLeadModal();
                    onRequestDelete && onRequestDelete(editingLead, 'Lead');
                  }}
                >
                  <Trash2 size={14} />
                  <span>Eliminar Prospecto</span>
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseEditLeadModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Conversión a Venta */}
      {isConvertModalOpen && selectedLead && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🎉 Convertir Prospecto en Venta Real</h3>
              <button className="close-btn" onClick={handleCloseConvertModal}>✕</button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              En Linkeo, <strong>todo lo que pasa a Entregado y Cobrado se considera automáticamente una venta concretada</strong>. 
              Esta acción registrará formalmente la venta de <strong>{selectedLead.businessName}</strong>, 
              sumará <strong>S/ {Number(selectedLead.estimatedValue || 0).toFixed(2)}</strong> a la facturación oficial del mes, 
              descontará el stock de almacén y generará la trazabilidad del chip NFC.
            </p>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Cliente:</span>
                <strong>{selectedLead.businessName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Producto:</span>
                <strong>{selectedLead.interestedProduct || catalogOptions[0]?.name || 'Tarjeta Google NFC Cuadrado ESP'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Monto Facturado:</span>
                <strong style={{ color: '#10b981' }}>S/ {Number(selectedLead.estimatedValue || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Vendedor:</span>
                <strong>{selectedLead.assignedTo === 'luis' ? 'Luis Romero' : 'Kevin Servat'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={handleCloseConvertModal}>
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

      {/* MODAL: Ver y Personalizar Speech de Ventas */}
      {speechModalLead && (
        <div className="modal-overlay" onClick={handleCloseSpeechModal}>
          <div className="modal-content" style={{ maxWidth: '640px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0, fontSize: '1.05rem' }}>
                    Speech de Ventas: {speechModalLead.businessName || 'Prospecto'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: STAGES.find(s => s.id === normalizeLeadStage(speechModalLead.stage))?.color || '#3b82f6', color: '#fff' }}>
                      {STAGES.find(s => s.id === normalizeLeadStage(speechModalLead.stage))?.label || speechModalLead.stage}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {speechModalLead.phone ? `WhatsApp: ${speechModalLead.phone}` : 'Sin teléfono'}
                    </span>
                  </div>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseSpeechModal}>✕</button>
            </div>

            <div style={{ marginTop: '12px', marginBottom: '12px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Variante de Enfoque Comercial:
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {getLeadMessageVariants(speechModalLead).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectSpeechVariant(v.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: selectedSpeechVariant === v.id ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                      backgroundColor: selectedSpeechVariant === v.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                      color: selectedSpeechVariant === v.id ? '#60a5fa' : 'var(--text-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{v.title}</span>
                    <span style={{ 
                      fontSize: '0.62rem', 
                      padding: '1px 5px', 
                      borderRadius: '4px', 
                      backgroundColor: v.badgeColor || '#3b82f6', 
                      color: '#fff' 
                    }}>
                      {v.badge}
                    </span>
                  </button>
                ))}
              </div>
              {getLeadMessageVariants(speechModalLead).find(v => v.id === selectedSpeechVariant)?.description && (
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '6px 0 0 2px', fontStyle: 'italic' }}>
                  ℹ️ {getLeadMessageVariants(speechModalLead).find(v => v.id === selectedSpeechVariant)?.description}
                </p>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '0.78rem' }}>
                  Texto listo para enviar (puedes editarlo o personalizarlo):
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {customSpeechText.length} caracteres
                </span>
              </div>
              <textarea
                className="form-control"
                rows={9}
                value={customSpeechText}
                onChange={(e) => setCustomSpeechText(e.target.value)}
                style={{
                  fontSize: '0.82rem',
                  lineHeight: '1.45',
                  fontFamily: 'monospace, inherit',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopySpeech}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  {speechCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{speechCopied ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {speechModalLead.email && (
                  <a
                    href={`mailto:${speechModalLead.email}?subject=${encodeURIComponent(
                      normalizeLeadStage(speechModalLead.stage) === 'prospecto'
                        ? 'Tarjetas Inteligentes Linkeo NFC para Google Reviews'
                        : `Propuesta de Tarjetas Inteligentes Linkeo NFC para ${speechModalLead.businessName}`
                    )}&body=${encodeURIComponent(customSpeechText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#ea4335' }}
                  >
                    <Mail size={14} />
                    <span>Correo</span>
                  </a>
                )}

                {speechModalLead.phone ? (
                  <a
                    href={`https://wa.me/${speechModalLead.phone.replace(/[^0-9]/g, '').length === 9 ? '51' + speechModalLead.phone.replace(/[^0-9]/g, '') : speechModalLead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(customSpeechText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Send size={14} />
                    <span>Abrir en WhatsApp</span>
                  </a>
                ) : (
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    (Agrega teléfono para enviar a WhatsApp)
                  </span>
                )}

                <button type="button" className="btn btn-secondary btn-sm" onClick={handleCloseSpeechModal}>
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
