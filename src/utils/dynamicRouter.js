/**
 * Router Dinámico & Analítica de Trazabilidad NFC / QR de Linkeo
 * Permite que cada tarjeta inteligente use un enlace dinámico único (/r/:cardId?src=nfc|qr)
 * para registrar cada toque o escaneo en tiempo real antes de redirigir a Google Reviews.
 */

/**
 * Parsea la ubicación actual del navegador para detectar si se está accediendo
 * a una ruta de redirección de tarjeta inteligente (/r/:cardId o #/r/:cardId).
 */
export function parseDynamicCardRoute(loc = typeof window !== 'undefined' ? window.location : null) {
  if (!loc) return null;

  const pathname = loc.pathname || '';
  const hash = loc.hash || '';
  const search = loc.search || '';

  // 1. Detectar en pathname: /r/:cardId
  const pathMatch = pathname.match(/\/r\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch) {
    const searchParams = new URLSearchParams(search);
    const srcParam = (searchParams.get('src') || 'nfc').toLowerCase();
    return {
      cardId: pathMatch[1],
      src: srcParam === 'qr' ? 'qr' : 'nfc'
    };
  }

  // 2. Detectar en hash (ideal para SPAs y hosting estático sin rewrites): #/r/:cardId?src=...
  const hashMatch = hash.match(/#\/r\/([a-zA-Z0-9_-]+)(?:\?(.*))?/i);
  if (hashMatch) {
    const hashParams = new URLSearchParams(hashMatch[2] || '');
    const srcParam = (hashParams.get('src') || 'nfc').toLowerCase();
    return {
      cardId: hashMatch[1],
      src: srcParam === 'qr' ? 'qr' : 'nfc'
    };
  }

  return null;
}

/**
 * Construye la URL dinámica para una tarjeta Linkeo
 * @param {string} cardId - Identificador único de la tarjeta (ej. LNK-508d9e5f)
 * @param {'nfc' | 'qr'} src - Canal de origen ('nfc' para chip, 'qr' para código QR)
 * @param {string} [customBaseUrl] - URL base opcional (ej. https://linkeo.pe o https://linkeocards.com)
 */
export function buildCardRedirectUrl(cardId, src = 'nfc', customBaseUrl = '') {
  if (!cardId) return '';
  const cleanSrc = src === 'qr' ? 'qr' : 'nfc';
  
  let base = customBaseUrl ? customBaseUrl.replace(/\/+$/, '') : '';
  if (!base && typeof window !== 'undefined' && window.location) {
    base = window.location.origin;
  }
  if (!base) base = 'https://linkeocards.com';

  // Usamos formato hash #/r/:cardId para máxima portabilidad en cualquier servidor web
  return `${base}/#/r/${cardId}?src=${cleanSrc}`;
}

/**
 * Formatea una fecha ISO a tiempo relativo amigable (ej: "Hace 15 min", "Hace 2 horas", "Ayer a las 14:00")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'Sin lecturas aún';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha no válida';
    
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSecs < 60) return 'Hace unos segundos';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return 'Fecha no disponible';
  }
}

/**
 * Evalúa la salud operativa y de uso post-venta de una tarjeta inteligente
 */
export function evaluateCardHealth(card) {
  if (!card) return { status: 'inactive', label: 'Sin datos', alertLevel: 'neutral', totalBips: 0, bipsNfc: 0, bipsQr: 0, daysInactive: null };

  const bipsNfc = Number(card.bipsNfc || 0);
  const bipsQr = Number(card.bipsQr || 0);
  const totalBips = Number(card.readCount ?? (bipsNfc + bipsQr));
  const bizName = card.businessName || 'su establecimiento';

  let daysInactive = null;
  if (card.lastReadAt) {
    const lastDate = new Date(card.lastReadAt);
    if (!isNaN(lastDate.getTime())) {
      daysInactive = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // 1. Tarjeta Inactiva: 0 lecturas o más de 7 días sin registrar bips
  if (totalBips === 0) {
    return {
      status: 'inactive',
      label: 'Alerta: Sin lecturas',
      alertLevel: 'danger',
      totalBips,
      bipsNfc,
      bipsQr,
      daysInactive,
      recommendation: 'Contactar al cliente para recomendar ubicarla en caja o mostrador y capacitar a su personal.',
      followUpMessage: `¡Hola al equipo de ${bizName}! Te saluda el equipo de Linkeo.

Notamos en nuestro sistema de monitoreo que su tarjeta inteligente Google NFC aún no registra lecturas de clientes.

Queríamos consultarles si necesitan algún apoyo con la ubicación de la tarjeta (recomendamos caja, mostrador o barra) o con la capacitación de sus colaboradores para invitar a los clientes satisfechos a acercar su celular y calificar con 5 estrellas.

¡Estamos a su completa disposición para asegurar el máximo éxito de su dispositivo!`
    };
  }

  if (daysInactive !== null && daysInactive >= 7) {
    return {
      status: 'inactive',
      label: `Inactiva (${daysInactive}d sin bips)`,
      alertLevel: 'warning',
      totalBips,
      bipsNfc,
      bipsQr,
      daysInactive,
      recommendation: `No registra lecturas desde hace ${daysInactive} días. Verificar si sigue en el mostrador.`,
      followUpMessage: `¡Hola al equipo de ${bizName}! Te saluda el equipo de Linkeo.

Esperamos que se encuentren muy bien. Al revisar el desempeño de su tarjeta inteligente Linkeo NFC en nuestro sistema, notamos que no registra lecturas desde hace ${daysInactive} días.

Queríamos verificar que todo esté en orden en su local y ofrecerles asesoría para revitalizar las reseñas de sus clientes. ¿Sigue la tarjeta visible en el área de pago o atención?

¡Quedamos atentos para apoyarlos en lo que necesiten!`
    };
  }

  // 2. Alto Rendimiento (+50 bips)
  if (totalBips >= 50) {
    return {
      status: 'high_performance',
      label: `Alto Rendimiento (${totalBips} bips)`,
      alertLevel: 'success',
      totalBips,
      bipsNfc,
      bipsQr,
      daysInactive,
      recommendation: 'Excelente tracción. Gran oportunidad para ofrecer tarjeta adicional para otra mesa o local.',
      followUpMessage: `¡Hola al equipo de ${bizName}! Te saluda el equipo de Linkeo.

¡Felicitaciones! Vemos en nuestro sistema que su tarjeta inteligente Linkeo ya superó ${totalBips} lecturas de clientes en su establecimiento.

Nos alegra muchísimo ver cómo multiplican su reputación y posicionamiento en Google Maps. Debido al alto flujo de clientes que tienen, queríamos consultarles si les gustaría evaluar una tarjeta o display adicional para otra área, barra o sede adicional.

¡Muchos éxitos y que sigan sumando reseñas positivas!`
    };
  }

  // 3. En Uso Regular (1 a 49 bips)
  return {
    status: 'active',
    label: `En Uso (${totalBips} bips)`,
    alertLevel: 'info',
    totalBips,
    bipsNfc,
    bipsQr,
    daysInactive,
    recommendation: 'La tarjeta está funcionando con normalidad y sumando reseñas continuas.',
    followUpMessage: `¡Hola al equipo de ${bizName}! Te saluda el equipo de Linkeo.

Esperamos que se encuentren muy bien. Nos alegra ver que su tarjeta inteligente Linkeo NFC ya cuenta con ${totalBips} lecturas registradas.

Seguimos a su disposición para cualquier consulta técnica o para proveerles nuevo material publicitario cuando lo requieran. ¡Un saludo cordial a todo el equipo!`
  };
}

/**
 * Limpia y extrae el identificador puro de Google Place ID,
 * ya sea que el usuario ingrese el ID directamente (ej. ChIJN1t_tDeuEmsRUsoyG83frY4)
 * o pegue una URL completa de Google Maps / Google Reviews.
 */
export function cleanGooglePlaceId(input) {
  if (!input) return '';
  const str = String(input).trim();
  
  // 1. Buscar coincidencia de placeid= o place_id= en querystrings o fragmentos
  const match = str.match(/place_?id=([a-zA-Z0-9_\-]+)/i);
  if (match && match[1]) {
    return match[1];
  }

  // 2. Si es una URL completa, verificar searchParams
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const url = new URL(str);
      const pid = url.searchParams.get('placeid') || url.searchParams.get('place_id');
      if (pid) return pid;
    } catch {
      // URL no válida estándar, continuar con fallback
    }
  }

  return str;
}

/**
 * Une el protocolo y dominio oficial de Google Reviews con el Place ID
 * garantizando el enlace directo de reseña de 5 estrellas.
 */
export function buildGoogleReviewUrl(placeId) {
  const cleanId = cleanGooglePlaceId(placeId);
  return cleanId ? `https://search.google.com/local/writereview?placeid=${cleanId}` : '';
}

/**
 * Determina si un prospecto (Lead de Kanban) y una tarjeta NFC
 * corresponden a la misma entidad comercial o negocio.
 */
export function areLeadAndCardLinked(lead, card) {
  if (!lead || !card) return false;
  if (card.leadId && lead.id && String(card.leadId) === String(lead.id)) return true;
  if (lead.cardId && card.id && String(lead.cardId) === String(card.id)) return true;
  if (lead.nfcCardId && card.id && String(lead.nfcCardId) === String(card.id)) return true;
  if (lead.businessName && card.businessName) {
    const normLead = lead.businessName.trim().toLowerCase();
    const normCard = card.businessName.trim().toLowerCase();
    if (normLead.length > 0 && normLead === normCard) return true;
  }
  return false;
}

