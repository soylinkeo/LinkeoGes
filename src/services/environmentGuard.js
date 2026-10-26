/**
 * Guardián de Aislamiento de Entornos para LINKEO Gestión
 * 
 * Protege la base de datos central de Supabase (ntzkjkvgtytlobvbplov) contra escrituras o mutaciones
 * accidentales originadas desde despliegues efímeros de Vercel Preview (ej. ramas secundarias o PRs).
 */

export function isPreviewEnvironment(customHostname) {
  // 1. Variable global o flag explícito
  if (typeof globalThis !== 'undefined') {
    if (globalThis.__VERCEL_ENV__ === 'preview' || globalThis.__LINKEO_PREVIEW__ === true) {
      return true;
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage?.getItem('linkeo_preview_simulation') === 'true') {
        return true;
      }
    } catch { /* ignore storage errors */ }
  }

  // 2. Vite env vars si existen
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_VERCEL_ENV === 'preview' || import.meta.env.VITE_PREVIEW_MODE === 'true') {
        return true;
      }
    }
  } catch { /* ignore */ }

  const hostname = customHostname !== undefined 
    ? customHostname 
    : (typeof window !== 'undefined' ? window.location?.hostname : '');

  if (!hostname) return false;
  
  // 3. Detectar subdominios de Preview en Vercel (subdominios de branch -git- o hashes temporales)
  const isVercelPreviewHost = (hostname.includes('-git-') || hostname.endsWith('.vercel.app')) &&
                              hostname !== 'linkeo-ges.vercel.app' &&
                              hostname !== 'localhost' &&
                              hostname !== '127.0.0.1';

  return Boolean(isVercelPreviewHost);
}

export function assertMutationAllowed(operationName = 'Esta operación') {
  if (isPreviewEnvironment()) {
    const errorMsg = `[BLOQUEO DE SEGURIDAD PREVIEW] ${operationName} no está permitida en entornos de Preview. La base de datos central de LINKEO está protegida técnicamente contra escrituras.`;
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }
}
