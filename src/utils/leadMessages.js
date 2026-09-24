/**
 * Generador de mensajes personalizados para prospectos y clientes de Linkeo
 * Adaptado con redacción estratégica para cada fase del embudo comercial:
 * 1. Prospecto (Frío / Introductorio)
 * 2. Visitado (Post-visita presencial a su local)
 * 3. Negociación (Seguimiento comercial y cierre)
 * 4. Configurando NFC (Notificación de personalización técnica en taller)
 * 5. Entregado y Cobrado (Bienvenida, activación y recomendaciones de uso)
 * 6. Post-Venta (Seguimiento de métricas, soporte y recompra)
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

export const buildLeadWhatsAppMessage = (lead) => {
  const stage = normalizeLeadStage(lead?.stage);
  const bizName = lead?.businessName ? lead.businessName.trim() : '';
  const entityName = bizName || 'su prestigioso negocio';

  const socialLinksBlock = `🌐 Web oficial: https://linkeocards.com/
📸 Instagram: https://www.instagram.com/linkeo_pe/
🎵 TikTok: https://www.tiktok.com/@linkeocards`;

  // 1. Prospecto (Primer contacto en frío / Prospección)
  if (stage === 'prospecto') {
    return (
`¡Hola! 👋 Te saluda el equipo de Linkeo.

Nos comunicamos con mucho entusiasmo para presentarles una solución que está ayudando a marcas y negocios destacados a multiplicar sus clientes y reseñas positivas de 5 estrellas en Google Maps de forma instantánea mediante tarjetas inteligentes NFC (un toque con el celular y directo a calificar). 🚀⭐

Nos encantaría compartirles cómo funciona y cómo podemos potenciar la reputación digital de su negocio:

${socialLinksBlock}

¿Les gustaría que les compartamos una breve demostración o catálogo? Quedamos a su entera disposición. ¡Que tengan un excelente día!`
    );
  }

  // 2. Visitado (Tras visita presencial al local)
  if (stage === 'visitado') {
    return (
`¡Hola al equipo de ${entityName}! 👋 Te saluda el equipo de Linkeo.

Recientemente tuvimos el gusto de pasar a visitar su local y queremos felicitarlos por la excelente labor y el gran servicio que brindan. ✨

Queríamos acercarle a la gerencia y al equipo de dirección nuestra propuesta de tarjetas y displays inteligentes Linkeo NFC para Google Reviews, diseñada para que sus clientes satisfechos puedan dejar su calificación de 5 estrellas en segundos con un solo toque desde su smartphone. 📲⭐

Para que puedan conocer más sobre nosotros, ver cómo funcionan y revisar casos de éxito:

${socialLinksBlock}

¿Sería posible coordinar el envío de un catálogo o una muestra personalizada para ${entityName}? ¡Muchos éxitos y un saludo muy cordial!`
    );
  }

  // 3. Negociación (Seguimiento comercial y cierre de propuesta)
  if (stage === 'negociacion') {
    return (
`¡Hola al equipo de ${entityName}! 👋 Te saluda el equipo de Linkeo.

Esperamos que se encuentren teniendo una excelente semana. Dando seguimiento a nuestra conversación sobre la implementación de las tarjetas y displays inteligentes Linkeo NFC para Google Reviews 📲⭐, queríamos coordinar con ustedes para definir el modelo ideal para sus instalaciones (formato cuadrado, circular o display para barra/caja) y afinar los detalles de su pedido.

Tener un perfil destacado en Google Maps multiplica la confianza de nuevos clientes todos los días. Pueden revisar nuestros modelos y videos demostrativos aquí:

${socialLinksBlock}

¿Tendrían unos minutos para revisar cualquier consulta y coordinar la confirmación de su pedido? ¡Quedamos atentos y con mucho gusto de asesorarlos!`
    );
  }

  // 4. Configurando NFC (Tarjeta en taller / vinculación técnica de chip)
  if (stage === 'configurando') {
    return (
`¡Hola al equipo de ${entityName}! 👋 Te saluda el equipo de Linkeo.

¡Excelentes noticias! Su tarjeta inteligente Linkeo NFC / QR ya se encuentra en nuestro taller en proceso de personalización técnica y vinculación directa a su perfil oficial de Google Maps 🛠️📲.

Estamos configurando y validando cada detalle para asegurar que la experiencia de sus clientes sea 100% instantánea y fluida desde el primer toque con cualquier smartphone. Pueden ver más sobre nuestra tecnología aquí:

${socialLinksBlock}

Les estaremos informando en cuanto concluya la etapa de pruebas finales para coordinar la entrega física en su establecimiento. ¡Un saludo muy cordial a todo su equipo!`
    );
  }

  // 5. Entregado y Cobrado (Activación, bienvenida y tips de uso)
  if (stage === 'entregado') {
    return (
`¡Hola al equipo de ${entityName}! 👋 Te saluda el equipo de Linkeo.

¡Felicitaciones por la recepción de su tarjeta inteligente Linkeo NFC! 🎉⭐ Queremos confirmarles que su dispositivo ya se encuentra 100% activo y listo para empezar a captar reseñas de 5 estrellas en Google Maps.

💡 Recomendación clave para maximizar resultados:
Coloquen la tarjeta o display en un punto de alta visibilidad (caja, mostrador o barra) e inviten a sus clientes satisfechos a acercar su celular o escanear el QR antes de retirarse. ¡El proceso les toma menos de 5 segundos!

Para cualquier soporte técnico o consulta sobre su dispositivo:

${socialLinksBlock}

¡Muchos éxitos y a seguir multiplicando esas reseñas positivas!`
    );
  }

  // 6. Post-Venta (Seguimiento de métricas, soporte y recompra)
  return (
`¡Hola al equipo de ${entityName}! 👋 Te saluda el equipo de Linkeo.

Esperamos que se encuentren muy bien. Nos comunicamos para hacer un seguimiento a la experiencia con su tarjeta inteligente Linkeo NFC y conocer cómo van sumando nuevas reseñas de 5 estrellas en Google Maps 📈⭐.

Queremos asegurarles nuestro acompañamiento continuo. Si necesitan soporte técnico, asesoría para que su equipo promueva más calificaciones o desean evaluar tarjetas adicionales para otras mesas o sedes, con gusto los asistimos.

Pueden seguir conectados con nuestras novedades y casos de éxito aquí:

${socialLinksBlock}

¿Cómo ha sido la experiencia de sus clientes hasta ahora? ¡Siempre a su entera disposición!`
  );
};
