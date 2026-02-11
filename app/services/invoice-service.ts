import { supabase } from '~/lib/supabase';
import type { Invoice, InvoiceItem } from '~/lib/data';

export const fetchInvoices = async (month?: Date): Promise<Invoice[]> => {
  try {
    let query = supabase.from('invoices').select('*');

    if (month !== undefined) {
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      const start = new Date(year, monthIndex, 1).toISOString();
      const end = new Date(year, monthIndex + 1, 1).toISOString();

      query = query.gte('created_at', start).lt('created_at', end);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchInvoices error:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return data ?? [];
  } catch (err) {
    console.error('Unexpected error in fetchInvoices:', err);
    throw err instanceof Error ? err : new Error('Unknown error while fetching invoices');
  }
};

export const fetchDueInvoices = async (month?: Date): Promise<Invoice[]> => {
  try {
    let query = supabase.from('invoices').select('*').or('status.eq.pending, status.eq.overdue');

    if (month !== undefined) {
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      const start = new Date(year, monthIndex, 1).toISOString();
      const end = new Date(year, monthIndex + 1, 1).toISOString();

      query = query.gte('created_at', start).lt('created_at', end);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchDueInvoices error:', error);
      throw new Error(`Failed to fetch due invoices: ${error.message}`);
    }

    return data ?? [];
  } catch (err) {
    console.error('Unexpected error in fetchDueInvoices:', err);
    throw err instanceof Error ? err : new Error('Unknown error while fetching due invoices');
  }
};

export const fetchInvoiceItems = async (invoice_id: string | undefined): Promise<InvoiceItem[]> => {
  if (!invoice_id) {
    throw new Error('invoice_id is required');
  }

  try {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchInvoiceItems error:', error);
      throw new Error(`Failed to fetch invoice items: ${error.message}`);
    }

    return data ?? [];
  } catch (err) {
    console.error('Unexpected error in fetchInvoiceItems:', err);
    throw err instanceof Error ? err : new Error('Unknown error while fetching invoice items');
  }
};
