import { localDate } from '../utils/dateUtils.js';
import { 
  buildCardRedirectUrl, 
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
  CheckCircle2, 
  AlertTriangle, 
  Link2,
  SlidersHorizontal,
  FileText
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
  onRequestDelete,
  selectedCardModal,
  setSelectedCardModal,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
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
    reviewUrl: '',
    placeId: '',
    chipUid: '',
    qrControlUrl: '',
    status: 'Activa',
    notes: '',
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
      reviewUrl: '',
      placeId: '',
      chipUid: '',
      qrControlUrl: '',
      status: 'Activa',
      notes: '',
      discountStock: true
    });
    setIsNewCardModalOpen(false);
  };

  useEffect(() => {
    if (selectedCardModal) {
      setActiveModalCard(selectedCardModal);
    }
  }, [selectedCardModal]);

  // Generar QR cuando se abre el modal 1
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

  // Mantener la tarjeta activa sincronizada si cambian sus propiedades
  useEffect(() => {
    if (activeModalCard) {
      const fresh = nfcCards.find(c => c.id === activeModalCard.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(activeModalCard)) {
        setActiveModalCard(fresh);
      }
    }
  }, [nfcCards, activeModalCard]);

  // Filtros
  const filteredCards = nfcCards.filter(card => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      card.id.toLowerCase().includes(term) ||
      (card.businessName && card.businessName.toLowerCase().includes(term)) ||
      (card.placeId && card.placeId.toLowerCase().includes(term)) ||
      (card.reviewUrl && card.reviewUrl.toLowerCase().includes(term)) ||
      (card.address && card.address.toLowerCase().includes(term)) ||
      (card.chipUid && card.chipUid.toLowerCase().includes(term));

    const matchesDistrict = filterDistrict === 'all' || card.district === filterDistrict;
    const matchesStatus = filterStatus === 'all' || card.status === filterStatus;

    return matchesSearch && matchesDistrict && matchesStatus;
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

    // Sincronizar distrito y dirección con Kanban
    const resolvedDistrict = card.district || matchingLead?.district || 'Miraflores';
    const resolvedAddress = card.address !== undefined ? card.address : (matchingLead?.address || '');

    setEditingCard({
      ...card,
      leadId: card.leadId || matchingLead?.id || null,
      district: resolvedDistrict,
      address: resolvedAddress,
      notes: card.notes || card.supportNotes || '',
      reviewUrl: card.reviewUrl || (card.placeId ? buildGoogleReviewUrl(card.placeId) : ''),
      qrControlUrl: card.qrControlUrl || '',
      chipUid: card.chipUid || '',
      status: card.status || 'Activa'
    });
    setSupportNote('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingCard) return;

    // Determinar URL de reseña y Place ID
    let finalReviewUrl = (editingCard.reviewUrl || '').trim();
    let finalPlaceId = cleanGooglePlaceId(editingCard.placeId || '');

    // Si pegó una URL que contiene placeid, extraerlo si no tenía Place ID
    if (finalReviewUrl && !finalPlaceId) {
      const extracted = cleanGooglePlaceId(finalReviewUrl);
      if (extracted && extracted !== finalReviewUrl) {
        finalPlaceId = extracted;
      }
    }
    // Si no puso URL pero sí Place ID, autoconstruir la URL
    if (!finalReviewUrl && finalPlaceId) {
      finalReviewUrl = buildGoogleReviewUrl(finalPlaceId);
    }

    const newHistoryEntry = supportNote.trim() ? {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: new Date().toLocaleString('es-PE'),
      author: 'Admin Linkeo',
      action: supportNote.trim()
    } : null;

    const updatedHistory = newHistoryEntry 
      ? [...(editingCard.history || []), newHistoryEntry]
      : (editingCard.history || []);

    const cardToSave = {
      ...editingCard,
      placeId: finalPlaceId,
      reviewUrl: finalReviewUrl,
      notes: (editingCard.notes || '').trim(),
      supportNotes: (editingCard.notes || '').trim(),
      history: updatedHistory
    };

    onUpdateCard(cardToSave);

    // Sincronizar bidireccionalmente distrito, dirección y nombre con el prospecto correspondiente en Kanban
    if (onUpdateLead) {
      const targetLead = (leads || []).find(l => areLeadAndCardLinked(l, cardToSave));
      if (targetLead) {
        const needsUpdate = 
          targetLead.district !== cardToSave.district || 
          targetLead.address !== cardToSave.address ||
          (cardToSave.businessName && targetLead.businessName !== cardToSave.businessName);
        if (needsUpdate) {
          onUpdateLead({
            ...targetLead,
            businessName: cardToSave.businessName || targetLead.businessName,
            district: cardToSave.district || targetLead.district,
            address: cardToSave.address !== undefined ? cardToSave.address : targetLead.address
          });
        }
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

  const handleDeleteHistoryEntry = (card, index) => {
    if (!card || !Array.isArray(card.history) || !card.history[index]) return;
    const entry = card.history[index];
    
    if (onRequestDelete) {
      onRequestDelete({
        ...entry,
        cardId: card.id,
        cardName: card.businessName,
        historyIndex: index
      }, 'Entrada de Bitácora');
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar este registro de la bitácora?\n"${entry.action}"`)) {
      const updatedHistory = card.history.filter((_, idx) => idx !== index);
      const updatedCard = { ...card, history: updatedHistory };
      onUpdateCard(updatedCard);
      if (editingCard && editingCard.id === card.id) {
        setEditingCard(updatedCard);
      }
      if (activeModalCard && activeModalCard.id === card.id) {
        setActiveModalCard(updatedCard);
      }
      if (showToast) showToast('Registro eliminado de la bitácora', 'info');
    }
  };

  const handleCreateNewCard = (e) => {
    e.preventDefault();
    const newId = `LNK-${crypto.randomUUID()}`;

    let finalReviewUrl = newCardForm.reviewUrl.trim();
    let finalPlaceId = cleanGooglePlaceId(newCardForm.placeId.trim());

    if (finalReviewUrl && !finalPlaceId) {
      const extracted = cleanGooglePlaceId(finalReviewUrl);
      if (extracted && extracted !== finalReviewUrl) {
        finalPlaceId = extracted;
      }
    }
    if (!finalReviewUrl && finalPlaceId) {
      finalReviewUrl = buildGoogleReviewUrl(finalPlaceId);
    }
    if (!finalReviewUrl) {
      finalReviewUrl = 'https://linkeocards.com/';
    }

    const selectedProd = products.find(p => p.name === newCardForm.model) || inventory.find(i => i.name === newCardForm.model);

    // Estado inteligente: Si tiene enlace o place ID y negocio, está lista para estar Activa
    const initialStatus = newCardForm.status || ((finalReviewUrl && finalReviewUrl !== 'https://linkeocards.com/') ? 'Activa' : 'Pendiente de Configuración');

    const newCard = {
      id: newId,
      chipUid: newCardForm.chipUid.trim(),
      qrControlUrl: newCardForm.qrControlUrl.trim(),
      model: newCardForm.model,
      productId: selectedProd?.id || null,
      productSku: selectedProd?.sku || null,
      discountStock: newCardForm.discountStock,
      businessName: newCardForm.businessName.trim(),
      category: newCardForm.category,
      district: newCardForm.district,
      address: newCardForm.address.trim() || `Distrito de ${newCardForm.district}, Lima`,
      contactName: newCardForm.contactName.trim(),
      contactPhone: newCardForm.contactPhone.trim(),
      placeId: finalPlaceId,
      reviewUrl: finalReviewUrl,
      notes: newCardForm.notes.trim(),
      supportNotes: newCardForm.notes.trim(),
      fallbackShortUrl: `https://linkeocards.com/r/${newCardForm.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      assignedDate: localDate(),
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: initialStatus,
      history: [
        {
          id: `hist-${Date.now()}`,
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
            Vinculación de ID físico de tarjeta, URL de Google Reviews, panel QR dinámico y bitácora de soporte técnico.
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
              placeholder="Buscar por ID, Negocio, Place ID, URL..."
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
              <option value="Activa">🟢 Activa</option>
              <option value="Configurada / Por Entregar">🔵 Configurada / Por Entregar</option>
              <option value="Pendiente de Configuración">🟡 Pendiente de Configuración</option>
              <option value="En Soporte">🟣 En Soporte</option>
              <option value="Inactiva">⚪ Inactiva</option>
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
          const targetReviewUrl = card.reviewUrl || (card.placeId ? buildGoogleReviewUrl(card.placeId) : '');
          const isConfigured = Boolean(targetReviewUrl && card.businessName);

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
                    <span className={`badge ${
                      card.status === 'Activa' 
                        ? 'badge-green' 
                        : card.status === 'Configurada / Por Entregar' 
                          ? 'badge-blue' 
                          : card.status === 'En Soporte' 
                            ? 'badge-purple' 
                            : card.status === 'Pendiente de Configuración' 
                              ? 'badge-yellow' 
                              : 'badge-gray'
                    }`}>
                      {card.status === 'Activa' && '● Activa'}
                      {card.status === 'Configurada / Por Entregar' && '● Por Entregar'}
                      {card.status === 'Pendiente de Configuración' && '● Por Configurar'}
                      {card.status === 'En Soporte' && '● En Soporte'}
                      {card.status !== 'Activa' && card.status !== 'Configurada / Por Entregar' && card.status !== 'Pendiente de Configuración' && card.status !== 'En Soporte' && card.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn-icon" 
                      style={{ width: '30px', height: '30px' }}
                      onClick={() => handleOpenEdit(card)}
                      title="Editar enlace, dirección o registrar soporte técnico"
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
                  {card.businessName || '(Negocio no asignado)'}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <Building size={14} />
                  <span>{card.category || 'General'}</span>
                  <span>•</span>
                  <MapPin size={14} />
                  <span title={card.address ? `${card.address} (${card.district})` : card.district}>
                    {card.district} {card.address ? `— ${card.address}` : ''}
                  </span>
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
                    gap: '7px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Modelo:</span>
                    <span style={{ fontWeight: 600 }}>{card.model}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>UID Chip NFC:</span>
                    <span className="code-mono" style={{ fontSize: '0.75rem', fontWeight: card.chipUid ? 700 : 400 }}>
                      {card.chipUid || 'No asignado'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Panel Control QR:</span>
                    {card.qrControlUrl ? (
                      <a 
                        href={card.qrControlUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: 'var(--primary-400)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
                        title="Abrir enlace del panel de control para modificar el QR"
                      >
                        <ExternalLink size={12} />
                        <span>Abrir Panel ↗</span>
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No configurado</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Enlace Reseñas:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {targetReviewUrl ? (
                        <>
                          <span 
                            className="code-mono" 
                            style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#10b981', fontWeight: 600 }}
                            title={targetReviewUrl}
                          >
                            {targetReviewUrl.replace('https://', '')}
                          </span>
                          <button 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                            onClick={() => handleCopy(targetReviewUrl, `url-${card.id}`)}
                            title="Copiar enlace de reseña"
                          >
                            {copiedId === `url-${card.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                        </>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '0.74rem', fontWeight: 600 }}>⚠️ Sin configurar</span>
                      )}
                    </div>
                  </div>

                  {card.placeId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Google Place ID:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="code-mono" style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={card.placeId}>
                          {card.placeId}
                        </span>
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          onClick={() => handleCopy(card.placeId, `pid-${card.id}`)}
                          title="Copiar Place ID"
                        >
                          {copiedId === `pid-${card.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Vencimiento Anual:</span>
                    <span style={{ color: '#38bdf8' }}>{card.renewalDate || '15/09/2027'}</span>
                  </div>
                </div>

                {/* Nota de Soporte Técnico Permanente */}
                {card.notes && (
                  <div style={{ 
                    marginBottom: '12px',
                    padding: '8px 10px', 
                    backgroundColor: 'rgba(0, 102, 255, 0.08)', 
                    borderRadius: 'var(--radius-sm)', 
                    borderLeft: '3px solid #0066FF', 
                    fontSize: '0.76rem' 
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-400)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Edit3 size={11} />
                      <span>Nota de Soporte Técnico:</span>
                    </div>
                    <div style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{card.notes}</div>
                  </div>
                )}
              </div>

              {/* Acciones de la Tarjeta */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    const url = card.reviewUrl || (card.placeId ? buildGoogleReviewUrl(card.placeId) : '');
                    if (!url) {
                      if (showToast) showToast('Ingresa primero la URL de reseña en el soporte técnico', 'warning');
                      handleOpenEdit(card);
                      return;
                    }
                    window.open(url, '_blank');
                  }}
                  title="Abrir enlace de reseñas de Google directamente"
                >
                  <ExternalLink size={14} />
                  <span>Probar Enlace</span>
                </button>

                <button 
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setActiveModalCard(card)}
                  title="Ver código QR, enrutador y bitácora"
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
        <div className="modal-overlay" onClick={() => { setActiveModalCard(null); if (setSelectedCardModal) setSelectedCardModal(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="code-mono" style={{ fontSize: '1rem' }}>{activeModalCard.id}</span>
                <h3 className="modal-title">{activeModalCard.businessName || 'Tarjeta Linkeo'}</h3>
              </div>
              <button className="close-btn" onClick={() => { setActiveModalCard(null); if (setSelectedCardModal) setSelectedCardModal(null); }}>✕</button>
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

              {/* Datos de Grabación NFC NDEF & Panel */}
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={16} color="var(--primary-600)" />
                  <span>Configuración para Chip NFC & QR</span>
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

                {activeModalCard.qrControlUrl && (
                  <div style={{ marginBottom: '12px', padding: '8px 10px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Enlace Panel de Control para Modificar QR:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="code-mono" style={{ fontSize: '0.72rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activeModalCard.qrControlUrl}
                      </span>
                      <a 
                        href={activeModalCard.qrControlUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ExternalLink size={12} />
                        <span>Abrir Panel</span>
                      </a>
                    </div>
                  </div>
                )}

                <button 
                  type="button"
                  className="btn btn-success btn-sm"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => {
                    const url = activeModalCard.reviewUrl || (activeModalCard.placeId ? buildGoogleReviewUrl(activeModalCard.placeId) : '');
                    if (!url) {
                      if (showToast) showToast('Ingresa primero la URL de reseña en el soporte técnico', 'warning');
                      return;
                    }
                    window.open(url, '_blank');
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Probar Destino Final en Google Reviews</span>
                </button>
              </div>
            </div>

            {/* Bitácora de Soporte Técnico e Historial con Eliminación bajo Auditoría */}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {(activeModalCard.history || []).length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Sin registros en la bitácora aún.
                  </div>
                ) : (
                  (activeModalCard.history || []).map((h, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-subtle)', marginBottom: '2px', fontSize: '0.72rem' }}>
                          <span><strong>{h.author}</strong></span>
                          <span>{h.date}</span>
                        </div>
                        <div>{h.action}</div>
                      </div>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '24px', height: '24px', color: '#ef4444', padding: 0, flexShrink: 0 }}
                        onClick={() => handleDeleteHistoryEntry(activeModalCard, idx)}
                        title="Eliminar este registro de la bitácora (Bajo Auditoría)"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
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
                  <label className="form-label">Dirección del Local / Negocio:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ej: Av. Caminos del Inca 3271, Santiago de Surco"
                    value={editingCard.address || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Estado de la Tarjeta:</label>
                <select 
                  className="form-control"
                  value={editingCard.status || 'Activa'}
                  onChange={(e) => setEditingCard({ ...editingCard, status: e.target.value })}
                >
                  <option value="Activa">🟢 Activa (Lista para uso en producción)</option>
                  <option value="Configurada / Por Entregar">🔵 Configurada / Por Entregar (Lista, pendiente entrega)</option>
                  <option value="Pendiente de Configuración">🟡 Pendiente de Configuración (Falta URL o chip)</option>
                  <option value="En Soporte">🟣 En Soporte (Mantenimiento / actualización)</option>
                  <option value="Inactiva">⚪ Inactiva (Retirada o baja)</option>
                </select>
                <span style={{ fontSize: '0.72rem', marginTop: '4px', display: 'block', color: (editingCard.reviewUrl?.trim() || editingCard.placeId?.trim()) ? '#10b981' : '#f59e0b' }}>
                  {(editingCard.reviewUrl?.trim() || editingCard.placeId?.trim()) 
                    ? '✓ Datos completos: La tarjeta tiene destino configurado y puede estar Activa.' 
                    : '⚠️ Falta ingresar URL de Reseña o Place ID para considerarla configurada.'
                  }
                </span>
              </div>

              {/* URL Directa de Reseña de Google / Destino */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    URL Directa de Reseña de Google / Destino:
                  </label>
                  {editingCard.reviewUrl?.trim() && (
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ URL Configurada
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    placeholder="Pega aquí el enlace: https://search.google.com/local/writereview?placeid=... o https://g.page/r/.../review"
                    value={editingCard.reviewUrl || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      let pid = cleanGooglePlaceId(val);
                      setEditingCard({ 
                        ...editingCard, 
                        reviewUrl: val,
                        placeId: (pid && pid !== val) ? pid : editingCard.placeId 
                      });
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const url = editingCard.reviewUrl?.trim() || (editingCard.placeId?.trim() ? buildGoogleReviewUrl(editingCard.placeId) : '');
                      if (!url) {
                        if (showToast) showToast('Ingresa primero la URL de reseña o el Place ID', 'warning');
                        return;
                      }
                      window.open(url, '_blank');
                    }}
                    disabled={!editingCard.reviewUrl?.trim() && !editingCard.placeId?.trim()}
                    title="Abrir enlace de reseña directamente en nueva pestaña"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      fontWeight: 700,
                      padding: '0 16px'
                    }}
                  >
                    <ExternalLink size={15} />
                    <span>Enlace redirigido</span>
                  </button>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  Pega aquí el enlace directo de reseñas de Google Maps, el enlace corto de tu perfil de negocio o la URL con <code>#lrd</code>.
                </span>
              </div>

              {/* Google Place ID (Opcional si ya se colocó la URL) */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Google Place ID (Opcional si ya colocaste la URL arriba):
                  </label>
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
                    value={editingCard.placeId || ''}
                    onChange={(e) => {
                      const cleaned = cleanGooglePlaceId(e.target.value);
                      const autoUrl = !editingCard.reviewUrl?.trim() && cleaned ? buildGoogleReviewUrl(cleaned) : editingCard.reviewUrl;
                      setEditingCard({ ...editingCard, placeId: cleaned, reviewUrl: autoUrl });
                    }}
                    placeholder="Ej: ChIJN1t_tDeuEmsRUsoyG83frY4"
                    style={{ flex: 1 }}
                  />
                  {editingCard.placeId?.trim() && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const url = buildGoogleReviewUrl(editingCard.placeId);
                        setEditingCard({ ...editingCard, reviewUrl: url });
                        if (showToast) showToast('URL de reseña generada desde el Place ID', 'info');
                      }}
                      title="Generar URL con writereview?placeid="
                      style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}
                    >
                      Generar URL
                    </button>
                  )}
                </div>
              </div>

              {/* UID Chip NFC & Panel de Control QR */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">UID Chip NFC:</label>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    placeholder="04:XX:XX:XX:XX:XX"
                    value={editingCard.chipUid || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, chipUid: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Panel de Control (Modificar QR):</label>
                    {editingCard.qrControlUrl?.trim() && (
                      <a 
                        href={editingCard.qrControlUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ fontSize: '0.72rem', color: 'var(--primary-400)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        <ExternalLink size={12} />
                        <span>Abrir Panel</span>
                      </a>
                    )}
                  </div>
                  <input 
                    type="url" 
                    className="form-control code-mono"
                    placeholder="https://panel.linkeocards.com/... o portal del QR"
                    value={editingCard.qrControlUrl || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, qrControlUrl: e.target.value })}
                  />
                </div>
              </div>

              {/* Notas de Soporte Técnico Permanentes */}
              <div className="form-group">
                <label className="form-label">Notas de Soporte Técnico / Diagnóstico Actual:</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  placeholder="Diagnóstico permanente del chip, modelo o requerimiento especial del cliente..."
                  value={editingCard.notes || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, notes: e.target.value })}
                ></textarea>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  Esta nota se mantendrá guardada permanentemente en la ficha de la tarjeta y será visible en el módulo.
                </span>
              </div>

              {/* Nueva entrada a la Bitácora */}
              <div className="form-group">
                <label className="form-label">Agregar Nueva Entrada a la Bitácora de Cambios (Opcional):</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Cambio de Place ID a Surco, reconfiguración de chip exitosa..."
                  value={supportNote}
                  onChange={(e) => setSupportNote(e.target.value)}
                />
              </div>

              {/* Historial de la Bitácora con Eliminación bajo Auditoría */}
              {(editingCard.history || []).length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <History size={14} color="var(--primary-600)" />
                    <span>Historial de la Bitácora ({editingCard.history.length} registros):</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {editingCard.history.map((h, idx) => (
                      <div 
                        key={idx}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.76rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-subtle)', marginBottom: '2px', fontSize: '0.70rem' }}>
                            <span><strong>{h.author}</strong></span>
                            <span>{h.date}</span>
                          </div>
                          <div>{h.action}</div>
                        </div>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: '22px', height: '22px', color: '#ef4444', padding: 0, flexShrink: 0 }}
                          onClick={() => handleDeleteHistoryEntry(editingCard, idx)}
                          title="Eliminar este registro de la bitácora (Bajo Auditoría)"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Panel de Control para Modificar QR */}
              <div className="form-group">
                <label className="form-label">Enlace del Panel de Control (para modificar el QR):</label>
                <input 
                  type="url" 
                  className="form-control code-mono"
                  placeholder="https://panel.linkeocards.com/... o portal del QR"
                  value={newCardForm.qrControlUrl}
                  onChange={(e) => setNewCardForm({ ...newCardForm, qrControlUrl: e.target.value })}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  Enlace para administrar o reconfigurar el código QR dinámico impreso en la tarjeta física.
                </span>
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
                <label className="form-label">Dirección del Local / Establecimiento:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Av. Caminos del Inca 3271, Santiago de Surco 15039"
                  value={newCardForm.address}
                  onChange={(e) => setNewCardForm({ ...newCardForm, address: e.target.value })}
                />
              </div>

              {/* URL Directa de Reseña de Google / Destino */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    URL Directa de Reseña de Google / Destino:
                  </label>
                  {newCardForm.reviewUrl?.trim() && (
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ URL ingresada
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <input 
                    type="text" 
                    className="form-control code-mono"
                    placeholder="Pega aquí el enlace: https://search.google.com/local/writereview?placeid=... o enlace de reseñas"
                    value={newCardForm.reviewUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      let pid = cleanGooglePlaceId(val);
                      setNewCardForm({ 
                        ...newCardForm, 
                        reviewUrl: val,
                        placeId: (pid && pid !== val) ? pid : newCardForm.placeId 
                      });
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const url = newCardForm.reviewUrl?.trim() || (newCardForm.placeId?.trim() ? buildGoogleReviewUrl(newCardForm.placeId) : '');
                      if (!url) {
                        if (showToast) showToast('Ingresa primero la URL de reseña o el Place ID', 'warning');
                        return;
                      }
                      window.open(url, '_blank');
                    }}
                    disabled={!newCardForm.reviewUrl?.trim() && !newCardForm.placeId?.trim()}
                    title="Abrir enlace de reseña directamente"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      fontWeight: 700,
                      padding: '0 16px'
                    }}
                  >
                    <ExternalLink size={15} />
                    <span>Enlace redirigido</span>
                  </button>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  Pega aquí el enlace exacto de reseñas de Google Maps o el enlace de tu ficha de negocio.
                </span>
              </div>

              {/* Google Place ID del Negocio (Opcional si ya se colocó la URL) */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Google Place ID del Negocio (Opcional):</label>
                  {newCardForm.placeId?.trim() && (
                    <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ ID: {cleanGooglePlaceId(newCardForm.placeId)}
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  className="form-control code-mono"
                  placeholder="Ej: ChIJN1t_tDeuEmsRUsoyG83frY4"
                  value={newCardForm.placeId}
                  onChange={(e) => {
                    const cleaned = cleanGooglePlaceId(e.target.value);
                    const autoUrl = !newCardForm.reviewUrl?.trim() && cleaned ? buildGoogleReviewUrl(cleaned) : newCardForm.reviewUrl;
                    setNewCardForm({ ...newCardForm, placeId: cleaned, reviewUrl: autoUrl });
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado Inicial:</label>
                <select 
                  className="form-control"
                  value={newCardForm.status}
                  onChange={(e) => setNewCardForm({ ...newCardForm, status: e.target.value })}
                >
                  <option value="Activa">🟢 Activa (Lista y en producción)</option>
                  <option value="Configurada / Por Entregar">🔵 Configurada / Por Entregar (Lista para entrega)</option>
                  <option value="Pendiente de Configuración">🟡 Pendiente de Configuración (Falta URL o chip)</option>
                </select>
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

              <div className="form-group">
                <label className="form-label">Notas Iniciales de Soporte Técnico (Opcional):</label>
                <textarea 
                  className="form-control"
                  rows="2"
                  placeholder="Detalles sobre entrega física, requerimientos especiales o configuración..."
                  value={newCardForm.notes}
                  onChange={(e) => setNewCardForm({ ...newCardForm, notes: e.target.value })}
                ></textarea>
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
