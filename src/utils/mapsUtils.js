/**
 * Utilidades para sanitización, validación y formateo de URLs y direcciones de Google Maps.
 * Garantiza que cualquier entrada (enlace corto, enlace completo, dirección física,
 * o texto con "https://" prefijado por error) se convierta en una URL funcional de Google Maps,
 * evitando errores DNS_PROBE_FINISHED_NXDOMAIN.
 */

export const formatGoogleMapsUrl = (rawInput, fallbackContext = {}) => {
  const input = String(rawInput || '').trim();

  // Si está completamente vacío, usar el contexto disponible para armar una búsqueda
  if (!input) {
    const { businessName, address, district } = fallbackContext;
    const parts = [businessName, address, district, 'Lima, Perú'].filter(Boolean);
    const query = parts.join(' ').trim();
    if (!query) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  const hasProtocol = /^https?:\/\//i.test(input);
  // Retirar el protocolo para inspeccionar el contenido real
  const stripped = input.replace(/^https?:\/\//i, '').trim();

  if (!stripped) {
    return '';
  }

  // Si ya es un enlace explícito a Google Maps o Waze
  const isExplicitMaps = /^(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps|waze\.com)/i.test(stripped);
  if (isExplicitMaps) {
    return hasProtocol ? input : `https://${stripped}`;
  }

  // Comprobar si parece una URL web legítima (sin espacios ni comas, con estructura de dominio)
  const hasSpacesOrCommas = /[\s,]/.test(stripped);
  const startsWithAddressKeyword = /^(av\.?|avenida|calle|jr\.?|jiron|jirón|psje\.?|pasaje|mz\.?|lote|c\.c\.?|centro comercial)\b/i.test(stripped);
  const looksLikeValidDomain = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/.test(stripped);

  if (!hasSpacesOrCommas && !startsWithAddressKeyword && looksLikeValidDomain) {
    return hasProtocol ? input : `https://${stripped}`;
  }

  // De lo contrario, es una dirección física o término de búsqueda (ej. "Av. Caminos del Inca 2974, Lima 15039")
  // Limpiar cualquier protocolo erróneo y construir URL de búsqueda oficial de Google Maps
  const cleanAddress = stripped;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`;
};
