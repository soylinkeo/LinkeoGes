import { createClient } from '@supabase/supabase-js';
export { mappers } from './mappers.js';
const rawUrl = import.meta.env?.VITE_SUPABASE_URL?.trim();
const key = import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim();
const url = rawUrl ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '') : '';
export const isSupabaseConfigured = Boolean(url?.startsWith('https://') && key && !url.includes('tu-proyecto'));
export const supabase = isSupabaseConfigured ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;
