/**
 * Generador de mensajes personalizados para prospectos y clientes de Linkeo
 * Adaptado con redacción estratégica para cada fase del embudo comercial:
 * 1. Prospecto (Frío / Introductorio)
 * 2. Visitado (Post-visita presencial a su local: objetivo, breve y con cierre a visita/demo)
 * 3. Negociación (Seguimiento comercial y cierre)
 * 4. Configurando NFC (Notificación de personalización técnica en taller)
 * 5. Entregado y Cobrado (Bienvenida, activación y recomendaciones de uso)
 * 6. Post-Venta (Seguimiento de métricas, soporte y recompra)
 * 
 * Formato 100% limpio y compatible sin emojis para evitar que aparezcan
 * símbolos corruptos o rombos con signo de interrogación en clientes de correo y WhatsApp.
 */

export const normalizeLeadStage = (stage) => {
  if (!stage) return 'prospecto';
  const s = String(stage).toLowerCase().trim();
  if (s === 'contactado') return 'prospecto';
  if (s === 'esperando_info') return 'configurando';
  if (s === 'entregado_cobrado') return 'entregado';
  if (s === 'post_venta' || s === 'post-venta') return 'postventa';
  return s;
};

export const SOCIAL_LINKS_BLOCK = `• Web oficial: https://linkeocards.com/
• Instagram: https://www.instagram.com/linkeo_pe/
• TikTok: https://www.tiktok.com/@linkeocards`;

export const buildLeadWhatsAppMessage = (lead, variant = 'vendible') => {
  const stage = normalizeLeadStage(lead?.stage);
  const bizName = lead?.businessName ? lead.businessName.trim() : '';
  const entityName = bizName || 'su prestigioso negocio';
  const socialLinksBlock = SOCIAL_LINKS_BLOCK;

  // 1. Prospecto (Primer contacto en frío / Prospección)
  if (stage === 'prospecto') {
    if (variant === 'express') {
      return (
`¡Hola al equipo de ${entityName}! Te saluda el equipo de Linkeo.

Les escribimos para presentarles una solución que ayuda a marcas y negocios a multiplicar sus clientes y reseñas de 5 estrellas en Google Maps con 1 solo toque desde el celular (displays y tarjetas inteligentes Linkeo NFC).

Casos de éxito y funcionamiento:
${socialLinksBlock}

¿Les gustaría que coordinemos una breve demostración rápida para ${entityName}? ¡Muchos éxitos y excelente día!`
      );
    }

    return (
`¡Hola! Te saluda el equipo de Linkeo.

Nos comunicamos con mucho entusiasmo para presentarles una solución que está ayudando a marcas y negocios destacados a multiplicar sus clientes y reseñas positivas de 5 estrellas en Google Maps de forma instantánea mediante tarjetas inteligentes NFC (un toque con el celular y directo a calificar).

Nos encantaría compartirles cómo funciona y cómo podemos potenciar la reputación digital de su negocio:

${socialLinksBlock}

¿Les gustaría que les compartamos una breve demostración o catálogo? Quedamos a su entera disposición. ¡Que tengan un excelente día!`
    );
  }

  // 2. Visitado (Tras visita presencial al local)
  if (stage === 'visitado') {
    // Variante Express: Ultra-breve para WhatsApp
    if (variant === 'express') {
      return (
`¡Hola al equipo de ${entityName}! Te saluda el equipo de Linkeo.

Pasamos por su local y nos encantó la excelente atención y servicio que brindan.

Queremos acercarles nuestras tarjetas y displays inteligentes Linkeo NFC para que sus clientes satisfechos dejen su reseña de 5 estrellas en Google Maps en solo 3 segundos con un toque desde su celular.

Pueden ver demostraciones y casos de éxito aquí:
${socialLinksBlock}

¿Les parecería bien que coordinemos una breve visita a ${entityName} para llevarles el producto directamente y hacer una prueba rápida? ¡Muchos éxitos!`
      );
    }

    // Variante Visita Directa Formal (Propuesta con consulta de interés)
    if (variant === 'visita_directa') {
      return (
`¡Hola al equipo de ${entityName}! Te saluda el equipo de Linkeo.

Recientemente tuvimos el gusto de pasar a visitar su local y queremos felicitarlos por la excelente labor y el gran servicio que brindan.

Queríamos acercarle a la gerencia y al equipo de dirección nuestra propuesta de tarjetas y displays inteligentes Linkeo NFC para Google Reviews, diseñada para que sus clientes satisfechos puedan dejar su calificación de 5 estrellas en segundos con un solo toque desde su smartphone.

Para que puedan conocer más sobre nosotros, ver cómo funcionan y revisar casos de éxito:

${socialLinksBlock}

Nos encantaría saber si esta propuesta les resulta interesante. Si es el caso, ¿les parecería bien que coordinemos una breve visita a ${entityName} para llevarles el producto directamente? ¡Muchos éxitos y un saludo muy cordial!`
      );
    }

    // Variante Catálogo / Muestra previa
    if (variant === 'catalogo') {
      return (
`¡Hola al equipo de ${entityName}! Te saluda el equipo de Linkeo.

Recientemente tuvimos el gusto de pasar a visitar su local y queremos felicitarlos por la excelente labor y el gran servicio que brindan.

Queríamos acercarle a la gerencia y al equipo de dirección nuestra propuesta de tarjetas y displays inteligentes Linkeo NFC para Google Reviews, diseñada para que sus clientes satisfechos puedan dejar su calificación de 5 estrellas en segundos con un solo toque desde su smartphone.

Para que puedan conocer más sobre nosotros, ver cómo funcionan y revisar casos de éxito:

${socialLinksBlock}

¿Sería posible coordinar el envío de un catálogo o una muestra personalizada para ${entityName}? ¡Muchos éxitos y un saludo muy cordial!`
      );
    }

    // Variante 'vendible' (Predeterminada): Breve, puntual, objetivo y con cierre de visita directa
    return (
`¡Hola al equipo de ${entityName}! Te saluda el equipo de Linkeo.

Recientemente tuvimos el gusto de pasar a visitar su local y queremos felicitarlos por la excelente labor y el gran servicio que brindan.

Queríamos acercarle a la gerencia y al equipo de dirección nuestra propuesta de tarjetas y displays inteligentes Linkeo NFC para Google Reviews, diseñada para que sus clientes satisfechos puedan dejar su calificación de 5 estrellas en segundos con un solo toque desde su smartphone.

Para que puedan conocer más sobre nosotros, ver cómo funcionan y revisar casos de éxito:

${socialLinksBlock}

¿Les parecería bien que coordinemos una breve visita a ${entityName} para llevarles el producto directamente y hacerles una demostración rápida de 2 minutos? ¡Muchos éxitos y un saludo muy cordial!`
    );
  }

  // 3. Negociación (Seguimiento comercial y cierre de propuesta)
  if (stage === 'negociacion') {
    if (variant === 'express') {
      return (
`¡Hola al equipo de ${entityName}! Te saluda el equipo de Linkeo.

Dando seguimiento a la implementación de sus tarjetas y displays Linkeo NFC para Google Reviews, queríamos coordinar para definir el modelo ideal (cuadrado o display de barra) y asegurar su entrega.

Demostraciones y catálogo:
${socialLinksBlock}

¿Tendrían 2 minutos hoy para revisar consultas y confirmar su pedido? ¡Con mucho gusto de apoyarlos!`
      );
    }

    return (
`¡Hola al equipo de ${entityName}! Te saluda el equipo de Linkeo.

Esperamos que se encuentren teniendo una excelente semana. Dando seguimiento a nuestra conversación sobre la implementación de las tarjetas y displays inteligentes Linkeo NFC para Google Reviews, queríamos coordinar con ustedes para definir el modelo ideal para sus instalaciones (formato cuadrado, circular o display para barra/caja) y afinar los detalles de su pedido.

Tener un perfil destacado en Google Maps multiplica la confianza de nuevos clientes todos los días. Pueden revisar nuestros modelos y videos demostrativos aquí:

${socialLinksBlock}

¿Tendrían unos minutos para revisar cualquier consulta y coordinar la confirmación de su pedido? ¡Quedamos atentos y con mucho gusto de asesorarlos!`
    );
  }

  // 4. Configurando NFC (Tarjeta en taller / vinculación técnica de chip)
  if (stage === 'configurando') {
    return (
`¡Hola al equipo de ${entityName}! Te saluda el equipo de Linkeo.

¡Excelentes noticias! Su tarjeta inteligente Linkeo NFC / QR ya se encuentra en nuestro taller en proceso de personalización técnica y vinculación directa a su perfil oficial de Google Maps.

Estamos configurando y validando cada detalle para asegurar que la experiencia de sus clientes sea 100% instantánea y fluida desde el primer toque con cualquier smartphone. Pueden ver más sobre nuestra tecnología aquí:

${socialLinksBlock}

Les estaremos informando en cuanto concluya la etapa de pruebas finales para coordinar la entrega física en su establecimiento. ¡Un saludo muy cordial a todo su equipo!`
    );
  }

  // 5. Entregado y Cobrado (Activación, bienvenida y tips de uso)
  if (stage === 'entregado') {
    return (
`¡Hola al equipo de ${entityName}! Te saluda el equipo de Linkeo.

¡Felicitaciones por la recepción de su tarjeta inteligente Linkeo NFC! Queremos confirmarles que su dispositivo ya se encuentra 100% activo y listo para empezar a captar reseñas de 5 estrellas en Google Maps.

Recomendación clave para maximizar resultados:
Coloquen la tarjeta o display en un punto de alta visibilidad (caja, mostrador o barra) e inviten a sus clientes satisfechos a acercar su celular o escanear el QR antes de retirarse. ¡El proceso les toma menos de 5 segundos!

Para cualquier soporte técnico o consulta sobre su dispositivo:

${socialLinksBlock}

¡Muchos éxitos y a seguir multiplicando esas reseñas positivas!`
    );
  }

  // 6. Post-Venta (Seguimiento de métricas, soporte y recompra)
  return (
`¡Hola al equipo de ${entityName}! Te saluda el equipo de Linkeo.

Esperamos que se encuentren muy bien. Nos comunicamos para hacer un seguimiento a la experiencia con su tarjeta inteligente Linkeo NFC y conocer cómo van sumando nuevas reseñas de 5 estrellas en Google Maps.

Queremos asegurarles nuestro acompañamiento continuo. Si necesitan soporte técnico, asesoría para que su equipo promueva más calificaciones o desean evaluar tarjetas adicionales para otras mesas o sedes, con gusto los asistimos.

Pueden seguir conectados con nuestras novedades y casos de éxito aquí:

${socialLinksBlock}

¿Cómo ha sido la experiencia de sus clientes hasta ahora? ¡Siempre a su entera disposición!`
  );
};

/**
 * Retorna las variantes de speech disponibles para un lead según su etapa actual.
 */
export const getLeadMessageVariants = (lead) => {
  const stage = normalizeLeadStage(lead?.stage);

  if (stage === 'visitado') {
    return [
      {
        id: 'vendible',
        title: '🎯 Breve & Vendible (Demostración de 2 min)',
        badge: 'Recomendado',
        badgeColor: '#10b981',
        description: 'Puntual y de alta conversión. Propone visita directa para llevar el producto con mínimo compromiso de tiempo.',
        message: buildLeadWhatsAppMessage(lead, 'vendible')
      },
      {
        id: 'visita_directa',
        title: '🤝 Propuesta de Visita Formal',
        badge: 'Completo',
        badgeColor: '#3b82f6',
        description: 'Tono cercano consultando si la propuesta les resulta interesante antes de coordinar la visita.',
        message: buildLeadWhatsAppMessage(lead, 'visita_directa')
      },
      {
        id: 'express',
        title: '⚡ Express Ultra-Corto',
        badge: 'Rápido',
        badgeColor: '#f59e0b',
        description: 'Directo al grano, ideal para WhatsApp rápido o dueños ocupados.',
        message: buildLeadWhatsAppMessage(lead, 'express')
      },
      {
        id: 'catalogo',
        title: '📄 Solicitud de Catálogo / Muestra',
        badge: 'Alternativo',
        badgeColor: '#64748b',
        description: 'Para prospectos que prefieren revisar un archivo digital antes de una visita física.',
        message: buildLeadWhatsAppMessage(lead, 'catalogo')
      }
    ];
  }

  if (stage === 'prospecto') {
    return [
      {
        id: 'vendible',
        title: '🎯 Prospección Completa',
        badge: 'Recomendado',
        badgeColor: '#10b981',
        description: 'Presentación de propuesta con enlaces y catálogo.',
        message: buildLeadWhatsAppMessage(lead, 'vendible')
      },
      {
        id: 'express',
        title: '⚡ Prospección Rápida',
        badge: 'Express',
        badgeColor: '#f59e0b',
        description: 'Mensaje de primer contacto conciso y dinámico.',
        message: buildLeadWhatsAppMessage(lead, 'express')
      }
    ];
  }

  if (stage === 'negociacion') {
    return [
      {
        id: 'vendible',
        title: '🎯 Cierre de Modelos y Pedido',
        badge: 'Recomendado',
        badgeColor: '#10b981',
        description: 'Seguimiento para definir formatos y concretar el pedido.',
        message: buildLeadWhatsAppMessage(lead, 'vendible')
      },
      {
        id: 'express',
        title: '⚡ Llamada Express de 2 min',
        badge: 'Rápido',
        badgeColor: '#f59e0b',
        description: 'Para agendar llamada de cierre inmediata.',
        message: buildLeadWhatsAppMessage(lead, 'express')
      }
    ];
  }

  // Resto de etapas (configurando, entregado, postventa)
  return [
    {
      id: 'vendible',
      title: '📋 Mensaje Estándar de la Fase',
      badge: 'Oficial',
      badgeColor: '#3b82f6',
      description: 'Mensaje predeterminado calibrado para esta etapa.',
      message: buildLeadWhatsAppMessage(lead, 'vendible')
    }
  ];
};
