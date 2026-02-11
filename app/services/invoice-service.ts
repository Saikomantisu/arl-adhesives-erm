import { supabase } from '~/lib/supabase';
import type { Invoice } from '~/lib/data';

export const fetchInvoices = async (month?: Date): Promise<Invoice[]> => {
  let query = supabase.from('invoices').select('*');

  if (month !== undefined) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const start = new Date(year, monthIndex, 1).toISOString();
    const end = new Date(year, monthIndex + 1, 1).toISOString();

    query = query.gte('created_at', start).lt('created_at', end);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const fetchDueInvoices = async (month?: Date): Promise<Invoice[]> => {
  let query = supabase.from('invoices').select('*').or('status.eq.pending, status.eq.overdue');

  if (month !== undefined) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const start = new Date(year, monthIndex, 1).toISOString();
    const end = new Date(year, monthIndex + 1, 1).toISOString();

    query = query.gte('created_at', start).lt('created_at', end);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
};
