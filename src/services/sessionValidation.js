// Bound startup even if the SDK is waiting for a refresh lock in another tab.
export function createSessionValidation({ read, onUser, onError, onSettled, timeoutMs = 12000 }) {
  let version = 0;
  let disposed = false;
  let timer;
  let cancel;
  async function refresh() {
    if (disposed) return;
    const attempt = ++version;
    cancel?.();
    clearTimeout(timer);
    try {
      const user = await Promise.race([
        Promise.resolve().then(read),
        new Promise((_, reject) => {
          cancel = () => reject(new Error('Validación reemplazada.'));
          timer = setTimeout(() => reject(new Error('La validación de sesión tardó demasiado. Comprueba tu conexión y vuelve a intentarlo. Si persiste, cierra las otras pestañas de Linkeo Ges y recarga esta página.')), timeoutMs);
        }),
      ]);
      if (!disposed && attempt === version) { onError(''); onUser(user); }
    } catch (error) {
      if (!disposed && attempt === version) onError(error.message || 'No se pudo validar la sesión.');
    } finally {
      if (attempt === version) {
        clearTimeout(timer);
        cancel = null;
        if (!disposed) onSettled();
      }
    }
  }
  function signedOut() {
    ++version; cancel?.(); clearTimeout(timer);
    if (!disposed) { onError(''); onUser(null); onSettled(); }
  }
  return { refresh, signedOut, dispose() { disposed = true; ++version; cancel?.(); clearTimeout(timer); } };
}
