/**
 * Generador de mensajes personalizados para prospectos y clientes de Linkeo
 * Diferencia entre primera prospección en frío y prospectos visitados/avanzados
 */
export const buildLeadWhatsAppMessage = (lead) => {
  const stage = String(lead?.stage || '').toLowerCase().trim();
  const isProspect = !stage || stage === 'prospecto' || stage === 'contactado';
  const bizName = lead?.businessName ? lead.businessName.trim() : '';

  if (isProspect) {
    return (
`¡Hola! 👋 Te saluda el equipo de Linkeo.

Nos comunicamos con mucho entusiasmo para presentarles una solución que está ayudando a marcas y negocios destacados a multiplicar sus clientes y reseñas positivas de 5 estrellas en Google Maps de forma instantánea mediante tarjetas inteligentes NFC (un toque con el celular y directo a calificar). 🚀⭐

Nos encantaría compartirles cómo funciona y cómo podemos potenciar la reputación digital de su negocio:

🌐 Web oficial: https://linkeocards.com/
📸 Instagram: https://www.instagram.com/linkeo_pe/
🎵 TikTok: https://www.tiktok.com/@linkeocards

¿Les gustaría que les compartamos una breve demostración o catálogo? Quedamos a su entera disposición. ¡Que tengan un excelente día!`
    );
  }

  // Caso: Visitado y etapas comerciales avanzadas
  return (
`¡Hola al equipo de ${bizName || 'su prestigioso negocio'}! 👋 Te saluda el equipo de Linkeo.

Recientemente tuvimos el gusto de pasar a visitar su local y queremos felicitarlos por la excelente labor y el gran servicio que brindan. ✨

Queríamos acercarle a la gerencia y al equipo de dirección nuestra propuesta de tarjetas y displays inteligentes Linkeo NFC para Google Reviews, diseñada para que sus clientes satisfechos puedan dejar su calificación de 5 estrellas en segundos con un solo toque desde su smartphone. 📲⭐

Para que puedan conocer más sobre nosotros, ver cómo funcionan y revisar casos de éxito:

🌐 Web oficial: https://linkeocards.com/
📸 Instagram: https://www.instagram.com/linkeo_pe/
🎵 TikTok: https://www.tiktok.com/@linkeocards

¿Sería posible coordinar el envío de un catálogo o una muestra personalizada para ${bizName || 'su negocio'}? ¡Muchos éxitos y un saludo muy cordial!`
  );
};
