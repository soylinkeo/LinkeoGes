import { localDate } from '../utils/dateUtils.js';
import { 
  buildCardRedirectUrl, 
  formatRelativeTime, 
  evaluateCardHealth,
  cleanGooglePlaceId,
  buildGoogleReviewUrl,
  areLeadAndCardLinked
} from '../utils/dynamicRouter.js';
import DistrictCombobox from './DistrictCombobox.jsx';
import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Cpu, 
  Search, 
  Plus, 
  ExternalLink, 
  QrCode, 
  History, 
  Edit3, 
  Copy, 
  Check, 
  Smartphone,
  MapPin,
  Building,
  Trash2,
  Activity,
  Sparkles,
  MessageSquare,
  Play,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function NfcTraceabilityView({
  nfcCards = [],
  products = [],
  inventory = [],
  leads = [],
  districts: externalDistricts = [],
  onUpdateLead,
  onUpdateCard,
  onAddNewCard,
  onRecordBip,
  onRequestDelete,
  selectedCardModal,
  setSelectedCardModal,
  onUpdateInventoryStock,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHealth, setFilterHealth] = useState('all');
  const [activeModalCard, setActiveModalCard] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Obtener stock disponible de un producto/modelo
  const getProductStock = (productOrName) => {
    if (!productOrName) return 0;
    const prod = typeof productOrName === 'string'
      ? products.find(p => p.name === productOrName) || inventory.find(i => i.name === productOrName)
      : productOrName;

    if (!prod) {
      const matched = inventory.find(i => 
        i.name.toLowerCase().includes(String(productOrName).toLowerCase()) ||
        String(productOrName).toLowerCase().includes(i.name.toLowerCase())
      );
      if (matched) return Number(matched.quantity || 0);
      return 0;
    }

    const invItem = inventory.find(i => 
      (i.id === prod.inventoryId) || (i.sku && prod.sku && i.sku.toLowerCase() === prod.sku.toLowerCase()) ||
      (i.name && prod.name && i.name.toLowerCase().trim() === prod.name.toLowerCase().trim()) ||
      (i.name && prod.name && (i.name.toLowerCase().includes(prod.name.toLowerCase()) || prod.name.toLowerCase().includes(i.name.toLowerCase())))
    );
    if (invItem) {
      return Number(invItem.quantity || 0);
    }

    const rawChip = inventory.find(i => i.sku === 'SKU-NTAG215-RAW' || i.name.toLowerCase().includes('ntag215'));
    if (rawChip) {
      return Number(rawChip.quantity || 0);
    }

    return 0;
  };

  // Estados para modal de edición / soporte técnico
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [supportNote, setSupportNote] = useState('');

  // Estados para modal de nueva tarjeta vinculada a catálogo y stock
  const initialModel = products[0]?.name || (inventory[0]?.name || 'Tarjeta Google NFC Cuadrado');
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    model: initialModel,
    selectedProductId: products[0]?.id || '',
    businessName: '',
    category: 'Restaurante / Cafetería',
    district: 'Miraflores',
    address: '',
    contactName: '',
    contactPhone: '',
    placeId: '',
    chipUid: '',
    discountStock: true
  });

  const handleCloseEditModal = () => {
    setEditingCard(null);
    setSupportNote('');
    setIsEditModalOpen(false);
  };

  const handleCloseNewCardModal = () => {
    setNewCardForm({
      model: products[0]?.name || (inventory[0]?.name || 'Tarjeta Google NFC'),
      selectedProductId: products[0]?.id || '',
      businessName: '',
      category: 'Restaurante / Cafetería',
      district: 'Miraflores',
      address: '',
      contactName: '',
      contactPhone: '',
      placeId: '',
      chipUid: '',
      discountStock: true
    });
    setIsNewCardModalOpen(false);
  };

  useEffect(() => {
    if (selectedCardModal) {
      setActiveModalCard(selectedCardModal);
    }
  }, [selectedCardModal]);

  // Generar QR dinámico (con enrutador inteligente y contador de bips) cuando se abre el modal
  useEffect(() => {
    if (activeModalCard) {
      const dynamicQrUrl = buildCardRedirectUrl(activeModalCard.id, 'qr');
      QRCode.toDataURL(dynamicQrUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#002d9c',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error(err));
    }
  }, [activeModalCard]);

  // Mantener la tarjeta activa sincronizada si cambian sus contadores o estado
  useEffect(() => {
    if (activeModalCard) {
      const fresh = nfcCards.find(c => c.id === activeModalCard.id);
      if (fresh && (fresh.readCount !== activeModalCard.readCount || fresh.bipsNfc !== activeModalCard.bipsNfc || fresh.bipsQr !== activeModalCard.bipsQr || fresh.lastReadAt !== activeModalCard.lastReadAt)) {
        setActiveModalCard(fresh);
      }
    }
  }, [nfcCards, activeModalCard]);

  const handleSimulateBip = (cardId, src = 'nfc') => {
    if (onRecordBip) {
      onRecordBip(cardId, src);
      if (showToast) {
        showToast(`⚡ ¡Bip ${src.toUpperCase()} simulado! +1 a ${src === 'nfc' ? 'Chip NFC' : 'Código QR'}`, 'success');
      }
    }
  };

  // Filtros
  const filteredCards = nfcCards.filter(card => {
    const matchesSearch = 
      card.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.placeId && card.placeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.chipUid && card.chipUid.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDistrict = filterDistrict === 'all' || card.district === filterDistrict;
    const matchesStatus = filterStatus === 'all' || card.status === filterStatus;
    const matchesHealth = filterHealth === 'all' || (() => {
      const h = evaluateCardHealth(card);
      return h.status === filterHealth;
    })();

    return matchesSearch && matchesDistrict && matchesStatus && matchesHealth;
  });

  // Distritos únicos combinando maestros y tarjetas existentes
  const districts = useMemo(() => {
    const combined = [
      ...(Array.isArray(externalDistricts) ? externalDistricts : []),
      ...nfcCards.map(c => c.district).filter(Boolean),
      ...leads.map(l => l.district).filter(Boolean)
    ];
    return Array.from(new Set(combined));
  }, [externalDistricts, nfcCards, leads]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenEdit = (card) => {
    // Buscar si existe un prospecto en Kanban coincidente por leadId o por nombre de negocio
    const matchingLead = (leads || []).find(l => areLeadAndCardLinked(l, card));

    // Si el lead en Kanban tiene distrito, sincronizar y asegurar coincidencia
    const resolvedDistrict = card.district || matchingLead?.district || 'Miraflores';

    setEditingCard({
      ...card,
      leadId: card.leadId || matchingLead?.id || null,
      district: resolvedDistrict
    });
    setSupportNote('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingCard) return;

    // Recalcular URL si el Place ID cambió (usando cleanGooglePlaceId y buildGoogleReviewUrl)
    const cleanPlaceId = cleanGooglePlaceId(editingCard.placeId);
    const updatedReviewUrl = buildGoogleReviewUrl(cleanPlaceId) || editingCard.reviewUrl;

    const updatedHistory = [
      ...(editingCard.history || []),
      {
        date: new Date().toLocaleString('es-PE'),
        author: 'Admin Linkeo',
        action: supportNote.trim() || `Actualización de Place ID / Distrito (${editingCard.district}) en soporte técnico.`
      }
    ];

    const cardToSave = {
      ...editingCard,
      placeId: cleanPlaceId,
      reviewUrl: updatedReviewUrl,
      history: updatedHistory
    };

    onUpdateCard(cardToSave);

    // Sincronizar directamente con el prospecto correspondiente en Kanban
    if (onUpdateLead) {
      const targetLead = (leads || []).find(l => areLeadAndCardLinked(l, cardToSave));
      if (targetLead && targetLead.district !== cardToSave.district) {
        onUpdateLead({
          ...targetLead,
          district: cardToSave.district
        });
      }
    }

    if (showToast) {
      showToast(`✅ Tarjeta "${editingCard.id}" actualizada exitosamente`, 'success');
    }

    if (activeModalCard && activeModalCard.id === editingCard.id) {
      setActiveModalCard(cardToSave);
    }

    handleCloseEditModal();
  };

  const handleCreateNewCard = (e) => {
    e.preventDefault();
    const nextNum = nfcCards.length + 101;
    const newId = `LNK-${crypto.randomUUID()}`;
    const generatedUrl = newCardForm.placeId.trim() 
      ? `https://search.google.com/local/writereview?placeid=${newCardForm.placeId.trim()}`
      : 'https://linkeocards.com/';

    const selectedProd = products.find(p => p.name === newCardForm.model) || inventory.find(i => i.name === newCardForm.model);

    const newCard = {
      id: newId,
      chipUid: newCardForm.chipUid.trim(),
      model: newCardForm.model,
      productId: selectedProd?.id || null,
      productSku: selectedProd?.sku || null,
      discountStock: newCardForm.discountStock,
      businessName: newCardForm.businessName,
      category: newCardForm.category,
      district: newCardForm.district,
      address: newCardForm.address || `Distrito de ${newCardForm.district}, Lima`,
      contactName: newCardForm.contactName,
      contactPhone: newCardForm.contactPhone,
      placeId: newCardForm.placeId.trim(),
      reviewUrl: generatedUrl,
      fallbackShortUrl: `https://linkeocards.com/r/${newCardForm.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      assignedDate: localDate(),
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'Configurada / Por Entregar',
      history: [
        {
          date: new Date().toLocaleString('es-PE'),
          author: 'Luis Romero / Kevin Servat',
          action: `Alta y vinculación física de tarjeta NFC (${newCardForm.model}).`
        }
      ]
    };

    if (onAddNewCard(newCard) === false) return;
    if (showToast) {
      showToast(`✅ Tarjeta ${newId} (${newCard.businessName}) vinculada y registrada`, 'success');
    }
    handleCloseNewCardModal();
  };

  return (
    <div className="nfc-traceability-view">
      {/* Cabecera del Módulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ background: 'rgba(0, 102, 255, 0.12)', padding: '8px', borderRadius: 'var(--radius-md)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={24} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
              Trazabilidad de Chips y Enlaces (Core NFC)
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
            Vinculación de ID físico de tarjeta, Place ID de Google, código QR y bitácora de soporte técnico.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setIsNewCardModalOpen(true)}
        >
          <Plus size={16} />
          <span>Vincular Nueva Tarjeta NFC</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por ID, Negocio, Place ID..."
              style={{ paddingLeft: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select 
              className="form-control"
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
            >
              <option value="all">📍 Todos los Distritos</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <select 
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">⚡ Todos los Estados</option>
              <option value="Activa">Activa</option>
              <option value="Configurada / Por Entregar">Configurada / Por Entregar</option>
              <option value="En Soporte">En Soporte / Mantenimiento</option>
            </select>
          </div>

          <div>
            <select 
              className="form-control"
              value={filterHealth}
              onChange={(e) => setFilterHealth(e.target.value)}
            >
              <option value="all">🩺 Toda la Salud Operativa</option>
              <option value="high_performance">🟢 Alto Rendimiento (+50 bips)</option>
              <option value="active">🟡 En Uso Regular</option>
              <option value="inactive">🔴 Alerta: Inactivas (0 bips / 7d+)</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            Mostrando <strong>{filteredCards.length}</strong> de {nfcCards.length} tarjetas
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas NFC */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
        {filteredCards.map(card => {
          const health = evaluateCardHealth(card);
          const dynamicNfcUrl = buildCardRedirectUrl(card.id, 'nfc');

          return (
            <div 
              key={card.id} 
              className="card"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                {/* Header de la tarjeta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="code-mono" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                      {card.id}
                    </span>
                    <span className={`badge ${card.status === 'Activa' ? 'badge-green' : 'badge-yellow'}`}>
                      {card.status}
                    </span>
                    <span 
                      className={`badge ${health.alertLevel === 'success' ? 'badge-green' : health.alertLevel === 'danger' ? 'badge-red' : health.alertLevel === 'warning' ? 'badge-yellow' : 'badge-blue'}`}
                      style={{ fontSize: '0.68rem', padding: '2px 6px', fontWeight: 700 }}
                    >
                      {health.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn-icon" 
                      style={{ width: '30px', height: '30px' }}
                      onClick={() => handleOpenEdit(card)}
                      title="Editar o registrar soporte técnico"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      className="btn-icon" 
                      style={{ width: '30px', height: '30px', color: '#ef4444' }}
                      onClick={() => onRequestDelete && onRequestDelete(card, 'Tarjeta NFC')}
                      title="Eliminar tarjeta NFC (Auditoría)"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Nombre del Negocio */}
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '4px' }}>
                  {card.businessName}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <Building size={14} />
                  <span>{card.category}</span>
                  <span>•</span>
                  <MapPin size={14} />
                  <span>{card.district}</span>
                </div>

                {/* Métricas de Tráfico Dinámico (Bips NFC vs QR) */}
                <div 
                  style={{
                    backgroundColor: 'rgba(0, 102, 255, 0.05)',
                    border: '1px solid rgba(0, 102, 255, 0.18)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Activity size={13} />
                      <span>Tráfico & Bips Dinámicos</span>
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Último: <strong style={{ color: card.lastReadAt ? '#38bdf8' : 'var(--text-muted)' }}>{formatRelativeTime(card.lastReadAt)}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
                    <div style={{ backgroundColor: 'var(--bg-input)', padding: '6px 4px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{health.totalBips}</div>
                      <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Total Bips</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-input)', padding: '6px 4px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0066FF' }}>{health.bipsNfc}</div>
                      <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>📲 NFC</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-input)', padding: '6px 4px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>{health.bipsQr}</div>
                      <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>📷 QR</div>
                    </div>
                  </div>

                  {/* Acciones Post-Venta según salud */}
                  {health.status === 'inactive' && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#f87171', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} />
                        <span>{health.recommendation}</span>
                      </div>
                      {card.contactPhone && (
                        <a
                          href={`https://wa.me/${card.contactPhone.replace(/[^0-9]/g, '').length === 9 ? '51' + card.contactPhone.replace(/[^0-9]/g, '') : card.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(health.followUpMessage)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            fontSize: '0.72rem',
                            padding: '4px 8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            textDecoration: 'none',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700
                          }}
                        >
                          <MessageSquare size={12} />
                          <span>Escribir Soporte Post-Venta (WhatsApp)</span>
                        </a>
                      )}
                    </div>
                  )}

                  {health.status === 'high_performance' && card.contactPhone && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} />
                        <span>{health.recommendation}</span>
                      </div>
                      <a
                        href={`https://wa.me/${card.contactPhone.replace(/[^0-9]/g, '').length === 9 ? '51' + card.contactPhone.replace(/[^0-9]/g, '') : card.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(health.followUpMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          fontSize: '0.72rem',
                          padding: '4px 8px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#34d399',
                          textDecoration: 'none',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Ofrecer Recompra / Tarjeta Adicional</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Detalles Técnicos */}
                <div 
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Modelo:</span>
                    <span style={{ fontWeight: 600 }}>{card.model}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>UID Chip NFC:</span>
                    <span className="code-mono" style={{ fontSize: '0.75rem' }}>{card.chipUid || 'No asignado'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Google Place ID:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="code-mono" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {card.placeId || 'Pendiente'}
                      </span>
                      {card.placeId && (
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          onClick={() => handleCopy(card.placeId, `pid-${card.id}`)}
                          title="Copiar Place ID"
                        >
                          {copiedId === `pid-${card.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Vencimiento Anual:</span>
                    <span style={{ color: '#38bdf8' }}>{card.renewalDate || '15/09/2027'}</span>
                  </div>
                </div>
              </div>

              {/* Acciones de la Tarjeta */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <a 
                  href={card.reviewUrl || (card.placeId ? `https://search.google.com/local/writereview?placeid=${card.placeId}` : 'https://linkeocards.com/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, textDecoration: 'none' }}
                  title="Probar que el enlace abre las reseñas de Google directamente"
                >
                  <ExternalLink size={14} />
                  <span>Probar Enlace</span>
                </a>

                <button 
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setActiveModalCard(card)}
                >
                  <QrCode size={14} />
                  <span>Ver QR & NFC</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Visor QR, Payload NFC y Bitácora de Soporte */}
      {activeModalCard && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="code-mono" style={{ fontSize: '1rem' }}>{activeModalCard.id}</span>
                <h3 className="modal-title">{activeModalCard.businessName}</h3>
              </div>
              <button className="close-btn" onClick={() => setActiveModalCard(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
              {/* Código QR Vectorial */}
              <div style={{ textAlign: 'center', background: 'white', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" style={{ width: '100%', maxWidth: '200px', display: 'block', margin: '0 auto' }} />
                ) : (
                  <div>Generando QR...</div>
                )}
                <div style={{ color: '#002d9c', fontSize: '0.75rem', fontWeight: 700, marginTop: '8px' }}>
                  Escanea para probar reseña Google
                </div>
              </div>

              {/* Datos de Grabación NFC NDEF & Analítica Dinámica */}
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={16} color="var(--primary-600)" />
                  <span>Enrutador Dinámico para Chip NFC & QR (Linkeo)</span>
                </h4>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                    URL Inteligente para Chip NFC (?src=nfc):
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text" 
                      className="form-control code-mono" 
                      style={{ fontSize: '0.72rem' }} 
                      value={buildCardRedirectUrl(activeModalCard.id, 'nfc')} 
                      readOnly 
                    />
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopy(buildCardRedirectUrl(activeModalCard.id, 'nfc'), 'modal-nfc-url')}
                      title="Copiar URL para NFC Tools"
                    >
                      {copiedId === 'modal-nfc-url' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                    URL Inteligente para Código QR (?src=qr):
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text" 
                      className="form-control code-mono" 
                      style={{ fontSize: '0.72rem' }} 
                      value={buildCardRedirectUrl(activeModalCard.id, 'qr')} 
                      readOnly 
                    />
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopy(buildCardRedirectUrl(activeModalCard.id, 'qr'), 'modal-qr-url')}
                      title="Copiar URL para QR"
                    >
                      {copiedId === 'modal-qr-url' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Simulador de Bips & Analítica en Vivo */}
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(0, 102, 255, 0.25)',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={13} />
                      <span>Simulador de Bips en Vivo</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Última: <strong style={{ color: activeModalCard.lastReadAt ? '#38bdf8' : 'var(--text-muted)' }}>{formatRelativeTime(activeModalCard.lastReadAt)}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800 }}>{Number(activeModalCard.readCount || 0)}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Total Bips</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0066FF' }}>{Number(activeModalCard.bipsNfc || 0)}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>📲 NFC</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>{Number(activeModalCard.bipsQr || 0)}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>📷 QR</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '0.72rem', padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      onClick={() => handleSimulateBip(activeModalCard.id, 'nfc')}
                      title="Probar incremento de bip NFC"
                    >
                      <Smartphone size={12} color="#0066FF" />
                      <span>Simular Bip NFC</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '0.72rem', padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      onClick={() => handleSimulateBip(activeModalCard.id, 'qr')}
                      title="Probar incremento de escaneo QR"
                    >
                      <QrCode size={12} color="#10b981" />
                      <span>Simular Bip QR</span>
                    </button>
                  </div>
                </div>

                <a 
                  href={activeModalCard.reviewUrl || (activeModalCard.placeId ? `https://search.google.com/local/writereview?placeid=${activeModalCard.placeId}` : 'https://linkeocards.com/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success btn-sm"
                  style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} />
                  <span>Probar Destino Final en Google Maps</span>
                </a>
              </div>
            </div>

            {/* Bitácora de Soporte Técnico e Historial */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <History size={15} color="var(--primary-600)" />
                  <span>Bitácora de Soporte Técnico y Cambios</span>
                </h4>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => {
                    handleOpenEdit(activeModalCard);
                  }}
                >
                  <Edit3 size={13} />
                  <span>Registrar Soporte</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {(activeModalCard.history || []).map((h, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-subtle)', marginBottom: '2px' }}>
                      <span><strong>{h.author}</strong></span>
                      <span>{h.date}</span>
                    </div>
                    <div>{h.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Editar Enlace / Soporte Técnico */}
      {isEditModalOpen && editingCard && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Gestión de Enlace & Soporte: {editingCard.id}</h3>
              <button className="close-btn" onClick={handleCloseEditModal}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Nombre del Negocio:</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editingCard.businessName}
                  onChange={(e) => setEditingCard({ ...editingCard, businessName: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Distrito:</label>
                    {(() => {
                      const matchingLead = (leads || []).find(l => areLeadAndCardLinked(l, editingCard));
                      return matchingLead ? (
                        <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }} title="Sincronizado bidireccionalmente con el prospecto en Kanban">
                          <CheckCircle2 size={12} />
                          <span>🔗 Sincronizado con Kanban</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                          (Sincroniza con Kanban por negocio)
                        </span>
                      );
                    })()}
                  </div>
                  <DistrictCombobox 
                    value={editingCard.district}
                    onChange={(dist) => setEditingCard({ ...editingCard, district: dist })}
                    districts={districts}
                    placeholder="Seleccionar o escribir distrito..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado:</label>
                  <select 
                    className="form-control"
                    value={editingCard.status}
                    onChange={(e) => setEditingCard({ ...editingCard, status: e.target.value })}
                  >
                    <option value="Activa">Activa</option>
                    <option value="Configurada / Por Entregar">Configurada / Por Entregar</option>
                    <option value="En Soporte">En Soporte</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Google Place ID (Actualizable si el cliente se muda):</label>
                  {editingCard.placeId?.trim() && (
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ ID: {cleanGooglePlaceId(editingCard.placeId)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    value={editingCard.placeId}
                    onChange={(e) => {
                      const cleaned = cleanGooglePlaceId(e.target.value);
                      setEditingCard({ ...editingCard, placeId: cleaned });
                    }}
                    placeholder="Ej: ChIJN1t_tDeuEmsRUsoyG83frY4"
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const id = cleanGooglePlaceId(editingCard.placeId);
                      if (!id) {
                        if (showToast) showToast('Ingresa primero el Google Place ID', 'warning');
                        return;
                      }
                      const url = buildGoogleReviewUrl(id);
                      window.open(url, '_blank');
                    }}
                    disabled={!editingCard.placeId?.trim()}
                    title="Abrir enlace redirigido uniendo https://search.google.com/local/writereview?placeid= con el ID"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      fontWeight: 700,
                      padding: '0 16px',
                      cursor: editingCard.placeId?.trim() ? 'pointer' : 'not-allowed',
                      opacity: editingCard.placeId?.trim() ? 1 : 0.6
                    }}
                  >
                    <ExternalLink size={15} />
                    <span>Enlace redirigido</span>
                  </button>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  Al ingresar el ID, el botón <strong>Enlace redirigido</strong> une <code>https://search.google.com/local/writereview?placeid=</code> con el Place ID.
                </span>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>URL de Reseña Generada:</label>
                  {cleanGooglePlaceId(editingCard.placeId) && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary-400)', fontWeight: 600 }}>
                      ✓ https://search.google.com/local/writereview?placeid= + ID
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    value={buildGoogleReviewUrl(editingCard.placeId) || `https://search.google.com/local/writereview?placeid=`}
                    readOnly
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const url = buildGoogleReviewUrl(editingCard.placeId);
                      if (url) {
                        handleCopy(url, 'modal-review-url');
                      } else {
                        if (showToast) showToast('Ingresa un Place ID para copiar la URL', 'warning');
                      }
                    }}
                    title="Copiar URL generada"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedId === 'modal-review-url' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    <span style={{ fontSize: '0.8rem' }}>Copiar</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      const url = buildGoogleReviewUrl(editingCard.placeId);
                      if (url) {
                        window.open(url, '_blank');
                      }
                    }}
                    disabled={!cleanGooglePlaceId(editingCard.placeId)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    title="Abrir enlace redirigido en nueva pestaña"
                  >
                    <ExternalLink size={14} />
                    <span>Enlace redirigido</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nota de Soporte Técnico (Quedará registrada en la bitácora):</label>
                <textarea 
                  className="form-control"
                  rows="3"
                  placeholder="Motivo del cambio: El restaurante cambió de nombre / local, se reconfiguró el chip..."
                  value={supportNote}
                  onChange={(e) => setSupportNote(e.target.value)}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseEditModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar y Registrar Soporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Vincular Nueva Tarjeta NFC */}
      {isNewCardModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Vincular Nueva Tarjeta NFC</h3>
              <button className="close-btn" onClick={handleCloseNewCardModal}>✕</button>
            </div>

            <form onSubmit={handleCreateNewCard}>
              <div className="form-row">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Modelo de Tarjeta / Producto de Almacén:
                    </label>
                    {(() => {
                      const matched = products.find(p => p.name === newCardForm.model) || inventory.find(i => i.name === newCardForm.model);
                      const stock = getProductStock(matched || newCardForm.model);
                      return (
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: stock > 0 ? '#10b981' : '#ef4444' }}>
                          {stock > 0 ? `✓ En Stock: ${stock} uds` : '⚠️ Agotado (0 uds)'}
                        </span>
                      );
                    })()}
                  </div>
                  <select 
                    className="form-control"
                    value={newCardForm.model}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const matched = products.find(p => p.name === selectedName) || inventory.find(i => i.name === selectedName);
                      setNewCardForm({ 
                        ...newCardForm, 
                        model: selectedName,
                        selectedProductId: matched?.id || ''
                      });
                    }}
                    required
                  >
                    {products.length === 0 && inventory.length === 0 ? (
                      <option value="">(Sin productos en Almacén — Agrega en Catálogo)</option>
                    ) : (
                      <>
                        {products.map(p => {
                          const stock = getProductStock(p);
                          const inStock = stock > 0;
                          return (
                            <option key={p.id} value={p.name}>
                              📦 {p.name} {p.price ? `(S/ ${Number(p.price).toFixed(2)})` : ''} — {inStock ? `✅ En Stock: ${stock} uds` : `⚠️ AGOTADO (0 uds)`}
                            </option>
                          );
                        })}
                        {inventory.filter(i => !products.some(p => p.name === i.name)).map(i => {
                          const stock = Number(i.quantity || 0);
                          const inStock = stock > 0;
                          return (
                            <option key={i.id} value={i.name}>
                              🏷️ {i.name} — {inStock ? `✅ En Stock: ${stock} uds` : `⚠️ AGOTADO (0 uds)`}
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>

                  {/* Tarjeta de Disponibilidad de Stock */}
                  {(() => {
                    const matched = products.find(p => p.name === newCardForm.model) || inventory.find(i => i.name === newCardForm.model);
                    const stock = getProductStock(matched || newCardForm.model);
                    return (
                      <div 
                        style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: stock > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          border: `1px solid ${stock > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.78rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.05rem' }}>{stock > 0 ? '📦' : '⚠️'}</span>
                          <div>
                            <strong style={{ color: stock > 0 ? '#10b981' : '#ef4444' }}>
                              {stock > 0 ? `Stock Disponible: ${stock} unidades en almacén` : 'Sin unidades en almacén (Agotado)'}
                            </strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {matched?.sku ? `SKU: ${matched.sku} • ` : ''}
                              {matched?.price ? `Precio: S/ ${Number(matched.price).toFixed(2)} • ` : ''}
                              {matched?.cost ? `Costo: S/ ${Number(matched.cost).toFixed(2)}` : ''}
                            </div>
                          </div>
                        </div>
                        <span className={`badge ${stock > 0 ? 'badge-green' : 'badge-red'}`}>
                          {stock > 0 ? 'Disponible' : 'Sin Stock'}
                        </span>
                      </div>
                    );
                  })()}

                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <input 
                      type="checkbox"
                      id="discountStockCard"
                      checked={newCardForm.discountStock}
                      onChange={(e) => setNewCardForm({ ...newCardForm, discountStock: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="discountStockCard" style={{ cursor: 'pointer', marginBottom: 0 }}>
                      Descontar automáticamente 1 unidad del inventario al vincular
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">UID Chip Físico (Opcional):</label>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    placeholder="04:XX:XX:XX:XX:XX"
                    value={newCardForm.chipUid}
                    onChange={(e) => setNewCardForm({ ...newCardForm, chipUid: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Negocio / Cliente:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Barbería New Look, Sushi Bar..."
                  value={newCardForm.businessName}
                  onChange={(e) => setNewCardForm({ ...newCardForm, businessName: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rubro:</label>
                  <select 
                    className="form-control"
                    value={newCardForm.category}
                    onChange={(e) => setNewCardForm({ ...newCardForm, category: e.target.value })}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Distrito de Lima:</label>
                    {(() => {
                      const matchingLead = (leads || []).find(l => areLeadAndCardLinked(l, newCardForm));
                      return matchingLead ? (
                        <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={12} />
                          <span>🔗 Vinculado a Kanban ({matchingLead.district || 'Sin distrito'})</span>
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <DistrictCombobox 
                    value={newCardForm.district}
                    onChange={(dist) => setNewCardForm({ ...newCardForm, district: dist })}
                    districts={districts}
                    placeholder="Miraflores, San Isidro, Surco..."
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Google Place ID del Negocio:</label>
                  {newCardForm.placeId?.trim() && (
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ ID: {cleanGooglePlaceId(newCardForm.placeId)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    placeholder="Ej: ChIJN1t_tDeuEmsRUsoyG83frY4"
                    value={newCardForm.placeId}
                    onChange={(e) => {
                      const cleaned = cleanGooglePlaceId(e.target.value);
                      setNewCardForm({ ...newCardForm, placeId: cleaned });
                    }}
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const id = cleanGooglePlaceId(newCardForm.placeId);
                      if (!id) {
                        if (showToast) showToast('Ingresa primero el Google Place ID', 'warning');
                        return;
                      }
                      const url = buildGoogleReviewUrl(id);
                      window.open(url, '_blank');
                    }}
                    disabled={!newCardForm.placeId?.trim()}
                    title="Abrir enlace redirigido uniendo https://search.google.com/local/writereview?placeid= con el ID"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      fontWeight: 700,
                      padding: '0 16px',
                      cursor: newCardForm.placeId?.trim() ? 'pointer' : 'not-allowed',
                      opacity: newCardForm.placeId?.trim() ? 1 : 0.6
                    }}
                  >
                    <ExternalLink size={15} />
                    <span>Enlace redirigido</span>
                  </button>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  {newCardForm.placeId?.trim()
                    ? `URL unida: ${buildGoogleReviewUrl(newCardForm.placeId)}`
                    : 'Al colocar el ID, el botón "Enlace redirigido" une https://search.google.com/local/writereview?placeid= con el ID.'
                  }
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Persona de Contacto:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Nombre del dueño o encargado"
                    value={newCardForm.contactName}
                    onChange={(e) => setNewCardForm({ ...newCardForm, contactName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Teléfono WhatsApp:</label>
                    <span style={{ fontSize: '0.72rem', color: newCardForm.contactPhone?.length === 9 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                      {newCardForm.contactPhone?.length || 0}/9 dígitos
                    </span>
                  </div>
                  <input 
                    type="tel" 
                    className="form-control"
                    placeholder="987654321"
                    maxLength={9}
                    value={newCardForm.contactPhone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setNewCardForm({ ...newCardForm, contactPhone: clean });
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseNewCardModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Vincular y Generar QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
