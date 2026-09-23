import { supabase } from './supabase';
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


export async function getAuthenticatedPartner() {
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: member, error: memberError } = await supabase.from('app_members').select('partner_id').eq('user_id', user.id).single();
  if (memberError || !member || !PARTNERS_INFO[member.partner_id]) return null;
  return { ...PARTNERS_INFO[member.partner_id], authId: user.id };
}
export async function verifyUserPassword(userId, password) {
  if (!supabase) throw new Error('Configura la conexión de Supabase antes de iniciar sesión.');
  const partner = PARTNERS_INFO[userId];
  if (!partner) return { isValid: false, user: null };
  const { error } = await supabase.auth.signInWithPassword({ email: partner.email, password });
  if (error) throw new Error('No se pudo iniciar sesión. Verifica tu contraseña y conexión.');
  const user = await getAuthenticatedPartner();
  if (!user || user.id !== userId) {
    await supabase.auth.signOut();
    throw new Error('La cuenta no tiene acceso al equipo Linkeo. Contacta al administrador.');
  }
  return { isValid: true, user };
}
export async function changeUserPassword(userId, currentPassword, newPassword) {
  if (newPassword.length < 12) throw new Error('La nueva contraseña debe tener al menos 12 caracteres.');
  const active = await getAuthenticatedPartner();
  if (!active || active.id !== userId) throw new Error('La sesión no es válida.');
  await verifyUserPassword(userId, currentPassword);
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  return { success: true, user: active };
}
