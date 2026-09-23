import { supabase, isSupabaseConfigured } from './supabase';

export const DEFAULT_SALT = 'linkeo_ges_salt_2026';
// Hash SHA-256 de '2109' con salt 'linkeo_ges_salt_2026'
export const DEFAULT_HASH = '0a7704cc2445a4d5987138e2196db1f8f575488e8f994c70c3c851295e512ada';

export const PARTNERS_INFO = {
  luis: {
    id: 'luis',
    name: 'Luis Romero',
    role: 'Co-Fundador & Co-CEO | Dirección General (Comercial & Operaciones)',
    avatar: '👨‍💼',
    badge: 'Co-CEO / Socio 50%',
    email: 'luis@linkeocards.com'
  },
  kevin: {
    id: 'kevin',
    name: 'Kevin Servat',
    role: 'Co-Fundador & Co-CEO | Dirección General (Comercial & Operaciones)',
    avatar: '🚀',
    badge: 'Co-CEO / Socio 50%',
    email: 'kevin@linkeocards.com'
  }
};

/**
 * Genera el hash criptográfico SHA-256 con salt usando la Web Crypto API nativa
 */
export async function hashPassword(password, salt = DEFAULT_SALT) {
  const normalized = String(password).trim();
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder();
    const data = enc.encode(`${normalized}:${salt}`);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback seguro en entornos sin crypto.subtle
  let h = 0x811c9dc5;
  const str = `${normalized}:${salt}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0).toString(16);
}

/**
 * Obtiene las credenciales del usuario desde Supabase o desde caché local
 */
export async function getUserCredentials(userId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data && data.password_hash) {
        return data;
      }
    } catch (err) {
      console.warn('Error al consultar user_credentials en Supabase:', err);
    }
  }

  // Fallback en localStorage
  try {
    const cached = JSON.parse(localStorage.getItem('linkeoges_credentials') || '{}');
    if (cached[userId]) {
      return cached[userId];
    }
  } catch (e) {}

  // Credencial por defecto (2109)
  return {
    id: userId,
    name: PARTNERS_INFO[userId]?.name || userId,
    role: PARTNERS_INFO[userId]?.role || 'Co-CEO',
    password_hash: DEFAULT_HASH,
    salt: DEFAULT_SALT
  };
}

/**
 * Verifica la contraseña ingresada contra el hash en la base de datos
 */
export async function verifyUserPassword(userId, password) {
  try {
    const cred = await getUserCredentials(userId);
    const salt = cred.salt || DEFAULT_SALT;
    const computedHash = await hashPassword(password, salt);
    const isValid = (computedHash === cred.password_hash);

    return {
      isValid,
      user: PARTNERS_INFO[userId]
    };
  } catch (err) {
    console.warn('Error en verifyUserPassword:', err);
    return {
      isValid: false,
      user: null
    };
  }
}

/**
 * Cambia la contraseña del usuario, la hashea y la guarda en Supabase y localmente
 */
export async function changeUserPassword(userId, currentPassword, newPassword) {
  const check = await verifyUserPassword(userId, currentPassword);
  if (!check.isValid) {
    throw new Error('La contraseña actual es incorrecta.');
  }

  const cleanNew = String(newPassword).trim();
  if (cleanNew.length < 4) {
    throw new Error('La nueva contraseña debe tener al menos 4 caracteres.');
  }

  const salt = DEFAULT_SALT;
  const newHash = await hashPassword(cleanNew, salt);
  const partner = PARTNERS_INFO[userId];

  let supabaseSuccess = false;
  let supabaseError = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('user_credentials')
        .upsert({
          id: userId,
          name: partner?.name || userId,
          role: partner?.role || 'Co-CEO',
          password_hash: newHash,
          salt,
          updated_at: new Date().toISOString()
        });

      if (error) {
        supabaseError = error;
        console.warn('Error al guardar credencial en Supabase:', error);
      } else {
        supabaseSuccess = true;
      }
    } catch (e) {
      supabaseError = e;
      console.warn('Excepción al guardar credencial en Supabase:', e);
    }
  }

  // Guardar en caché local segura
  try {
    const cached = JSON.parse(localStorage.getItem('linkeoges_credentials') || '{}');
    cached[userId] = {
      id: userId,
      name: partner?.name || userId,
      password_hash: newHash,
      salt,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem('linkeoges_credentials', JSON.stringify(cached));
  } catch (e) {}

  return {
    success: true,
    supabaseSuccess,
    supabaseError
  };
}
