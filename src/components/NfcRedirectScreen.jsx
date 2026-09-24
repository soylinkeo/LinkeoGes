import React, { useEffect, useState, useRef } from 'react';
import { Smartphone, QrCode, Sparkles, ExternalLink, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function NfcRedirectScreen({ 
  cardId, 
  src = 'nfc', 
  nfcCards = [], 
  onRecordBip 
}) {
  const [card, setCard] = useState(() => {
    return nfcCards.find(c => c.id === cardId) || null;
  });
  const [bipRecorded, setBipRecorded] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(300);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Buscar la tarjeta en memoria o en localStorage si aún no se ha resuelto
    let targetCard = card;
    if (!targetCard) {
      targetCard = nfcCards.find(c => c.id === cardId);
      if (!targetCard && typeof window !== 'undefined') {
        try {
          const localCards = JSON.parse(localStorage.getItem('linkeo_nfc_cards') || '[]');
          targetCard = localCards.find(c => c.id === cardId);
        } catch (e) {}
      }
      if (targetCard) setCard(targetCard);
    }

    // Determinar URL de destino final
    let targetUrl = 'https://linkeocards.com/';
    if (targetCard) {
      if (targetCard.reviewUrl && targetCard.reviewUrl.trim()) {
        targetUrl = targetCard.reviewUrl.trim();
      } else if (targetCard.placeId && targetCard.placeId.trim()) {
        targetUrl = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(targetCard.placeId.trim())}`;
      }
    }
    setRedirectUrl(targetUrl);

    // Registrar el bip una única vez
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      if (onRecordBip) {
        onRecordBip(cardId, src);
      }
      setBipRecorded(true);

      // Redireccionar automáticamente después de una breve animación fluida
      const timer = setTimeout(() => {
        if (targetUrl) {
          window.location.replace(targetUrl);
        }
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [cardId, src, nfcCards, onRecordBip]);

  const handleManualRedirect = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  const handleReturnToApp = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      window.location.pathname = '/';
    }
  };

  const bizName = card?.businessName || 'Negocio Linkeo';
  const isNfc = src === 'nfc';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#080d1a',
      color: '#f8fafc',
      fontFamily: "'Outfit', 'DM Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Fondo con brillo dinámico */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(0, 102, 255, 0.25) 0%, rgba(8, 13, 26, 0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(0, 102, 255, 0.25)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '36px 28px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo Linkeo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#0066FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 102, 255, 0.5)'
          }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Linkeo<span style={{ color: '#0066FF' }}>Cards</span>
          </span>
        </div>

        {/* Icono de Lectura Inteligente Animado */}
        <div style={{ position: 'relative', width: '88px', height: '88px', margin: '0 auto 24px' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            backgroundColor: isNfc ? 'rgba(0, 102, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `2px solid ${isNfc ? '#0066FF' : '#10b981'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.8s infinite'
          }}>
            {isNfc ? <Smartphone size={40} color="#0066FF" /> : <QrCode size={40} color="#10b981" />}
          </div>
        </div>

        {/* Badge de Detección */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          backgroundColor: isNfc ? 'rgba(0, 102, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          color: isNfc ? '#60a5fa' : '#34d399',
          fontSize: '0.78rem',
          fontWeight: 700,
          marginBottom: '16px'
        }}>
          <CheckCircle2 size={13} />
          <span>{isNfc ? 'Lectura por Chip NFC' : 'Lectura por Código QR'}</span>
        </div>

        {/* Título y Establecimiento */}
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.3 }}>
          {bizName}
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 24px', lineHeight: 1.4 }}>
          Conectando con la pantalla oficial de reseñas de <strong>5 estrellas</strong> en Google Maps... ⭐⭐⭐⭐⭐
        </p>

        {/* Barra de progreso */}
        <div style={{
          height: '4px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <div style={{
            height: '100%',
            width: '100%',
            backgroundColor: isNfc ? '#0066FF' : '#10b981',
            borderRadius: '999px',
            animation: 'progressBar 0.35s ease-out forwards'
          }} />
        </div>

        {/* Botón de apertura manual por si el navegador bloquea redirecciones */}
        <button
          type="button"
          onClick={handleManualRedirect}
          style={{
            width: '100%',
            padding: '12px 18px',
            backgroundColor: isNfc ? '#0066FF' : '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            marginBottom: '12px',
            transition: 'transform 0.15s ease'
          }}
        >
          <span>Abrir Reseñas en Google</span>
          <ExternalLink size={16} />
        </button>

        {/* Botón Volver al ERP */}
        <button
          type="button"
          onClick={handleReturnToApp}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px'
          }}
        >
          <ArrowLeft size={13} />
          <span>Volver al sistema LinkeoGes</span>
        </button>
      </div>

      {/* Estilos CSS para animaciones fluidas */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(0, 102, 255, 0.4); }
          70% { transform: scale(1.02); box-shadow: 0 0 0 14px rgba(0, 102, 255, 0); }
          100% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(0, 102, 255, 0); }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}} />
    </div>
  );
}
