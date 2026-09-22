import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Servicio unificado de sincronización LinkeoGes
 * Permite alternar entre Supabase (Nube persistente compartida) y LocalStorage de manera fluida.
 */
export const dbService = {
  isCloudReady: () => isSupabaseConfigured,

  // Ventas
  async fetchSales() {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching sales from Supabase:', error);
      return null;
    }
    return data;
  },

  async insertSale(sale) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('sales').insert([sale]).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSale(id) {
    if (!isSupabaseConfigured) return null;
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Gastos
  async fetchExpenses() {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching expenses from Supabase:', error);
      return null;
    }
    return data;
  },

  async insertExpense(expense) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('expenses').insert([expense]).select().single();
    if (error) throw error;
    return data;
  },

  async deleteExpense(id) {
    if (!isSupabaseConfigured) return null;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Auditoría
  async insertAuditLog(log) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('audit_logs').insert([log]).select().single();
    if (error) console.warn('Supabase audit log error:', error);
    return data;
  }
};
