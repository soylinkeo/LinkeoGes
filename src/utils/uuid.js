/**
 * Generador criptográficamente seguro de UUID v4 conforme a RFC 4122.
 * 
 * En contextos seguros (HTTPS o localhost), delega al nativo crypto.randomUUID().
 * En contextos no seguros (ej. HTTP sobre IP LAN como http://192.168.18.8:5175 en iPhone Safari),
 * la especificación W3C Web Cryptography API restringe crypto.randomUUID a [SecureContext].
 * 
 * Para resolver esto sin comprometer la seguridad ni usar generadores débiles como Math.random,
 * esta función utiliza crypto.getRandomValues() (que está disponible universalmente en contextos
 * no seguros en iOS Safari y Chromium) para generar UUIDs v4 con entropía criptográfica real de 128 bits.
 */
export function generateUuid() {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // RFC 4122 Versión 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 Variante 1
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  }
  throw new Error('Entorno criptográfico no disponible para generar identificadores seguros.');
}

/**
 * Instala un polyfill idempotente y seguro en window.crypto.randomUUID si no está disponible,
 * asegurando compatibilidad total con librerías externas o llamadas directas en HTTP LAN.
 */
export function ensureCryptoRandomUUID() {
  if (typeof window !== 'undefined' && typeof window.crypto !== 'undefined') {
    if (typeof window.crypto.randomUUID !== 'function' && typeof window.crypto.getRandomValues === 'function') {
      try {
        Object.defineProperty(window.crypto, 'randomUUID', {
          value: generateUuid,
          configurable: true,
          writable: true,
        });
      } catch {
        try {
          window.crypto.randomUUID = generateUuid;
        } catch { /* noop */ }
      }
    }
  }
}
