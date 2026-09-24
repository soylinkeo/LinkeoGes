import { localDate } from '../utils/dateUtils.js';
import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';

export default function NfcTraceabilityView({
  nfcCards = [],
  products = [],
  inventory = [],
  onUpdateCard,
  onAddNewCard,
  onRequestDelete,
  selectedCardModal,
  setSelectedCardModal,
  onUpdateInventoryStock,
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

  // Generar QR dinámico cuando se abre el modal de una tarjeta
  useEffect(() => {
    if (activeModalCard && activeModalCard.reviewUrl) {
      QRCode.toDataURL(activeModalCard.reviewUrl, {
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

  // Filtros
  const filteredCards = nfcCards.filter(card => {
    const matchesSearch = 
      card.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.placeId && card.placeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.chipUid && card.chipUid.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDistrict = filterDistrict === 'all' || card.district === filterDistrict;
    const matchesStatus = filterStatus === 'all' || card.status === filterStatus;

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  // Distritos únicos
  const districts = Array.from(new Set(nfcCards.map(c => c.district).filter(Boolean)));

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenEdit = (card) => {
    setEditingCard({ ...card });
    setSupportNote('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingCard) return;

    // Recalcular URL si el Place ID cambió
    let updatedReviewUrl = editingCard.reviewUrl;
    if (editingCard.placeId && !editingCard.reviewUrl.includes(editingCard.placeId)) {
      updatedReviewUrl = `https://search.google.com/local/writereview?placeid=${editingCard.placeId}`;
    }

    const updatedHistory = [
      ...(editingCard.history || []),
      {
        date: new Date().toLocaleString('es-PE'),
        author: 'Admin Linkeo',
        action: supportNote.trim() || 'Actualización de datos / Place ID en soporte técnico.'
      }
    ];

    onUpdateCard({
      ...editingCard,
      reviewUrl: updatedReviewUrl,
      history: updatedHistory
    });

    if (showToast) {
      showToast(`✅ Tarjeta "${editingCard.id}" actualizada exitosamente`, 'success');
    }

    if (activeModalCard && activeModalCard.id === editingCard.id) {
      setActiveModalCard({
        ...editingCard,
        reviewUrl: updatedReviewUrl,
        history: updatedHistory
      });
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

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            Mostrando <strong>{filteredCards.length}</strong> de {nfcCards.length} tarjetas
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas NFC */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
        {filteredCards.map(card => (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="code-mono" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    {card.id}
                  </span>
                  <span className={`badge ${card.status === 'Activa' ? 'badge-green' : 'badge-yellow'}`}>
                    {card.status}
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
                href={card.reviewUrl}
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
        ))}
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

              {/* Datos de Grabación NFC NDEF */}
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={16} color="var(--primary-600)" />
                  <span>Payload para Grabar en Chip NFC</span>
                </h4>

                <div className="form-group">
                  <label className="form-label">Tipo de Registro NDEF:</label>
                  <input type="text" className="form-control" value="URI Record (https://)" readOnly />
                </div>

                <div className="form-group">
                  <label className="form-label">URL Completa a Escribir en Chip:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text" 
                      className="form-control code-mono" 
                      style={{ fontSize: '0.75rem' }} 
                      value={activeModalCard.reviewUrl} 
                      readOnly 
                    />
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopy(activeModalCard.reviewUrl, 'modal-url')}
                      title="Copiar URL para NFC Tools"
                    >
                      {copiedId === 'modal-url' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <a 
                  href={activeModalCard.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success btn-sm"
                  style={{ width: '100%', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>Abrir Reseña en Google Maps</span>
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
                  <label className="form-label">Distrito:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={editingCard.district}
                    onChange={(e) => setEditingCard({ ...editingCard, district: e.target.value })}
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
                <label className="form-label">Google Place ID (Actualizable si el cliente se muda):</label>
                <input 
                  type="text" 
                  className="form-control code-mono"
                  value={editingCard.placeId}
                  onChange={(e) => setEditingCard({ ...editingCard, placeId: e.target.value })}
                  placeholder="Ej: ChIJN1t_tDeuEmsRUsoyG83frY4"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL de Reseña Generada:</label>
                <input 
                  type="text" 
                  className="form-control code-mono"
                  value={`https://search.google.com/local/writereview?placeid=${editingCard.placeId || ''}`}
                  readOnly
                />
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
                  <label className="form-label">Distrito de Lima:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Miraflores, San Isidro, Surco..."
                    value={newCardForm.district}
                    onChange={(e) => setNewCardForm({ ...newCardForm, district: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Google Place ID del Negocio:</label>
                <input 
                  type="text" 
                  className="form-control code-mono"
                  placeholder="Ej: ChIJN1t_tDeuEmsRUsoyG83frY4"
                  value={newCardForm.placeId}
                  onChange={(e) => setNewCardForm({ ...newCardForm, placeId: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                  El Place ID se obtiene de Google Maps Place ID Finder. Generará automáticamente la URL directa de 5 estrellas.
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
                  <label className="form-label">Teléfono WhatsApp:</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="+51 987 654 321"
                    value={newCardForm.contactPhone}
                    onChange={(e) => setNewCardForm({ ...newCardForm, contactPhone: e.target.value })}
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
