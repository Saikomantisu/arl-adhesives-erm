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
  if (!invoice_id) throw new Error('invoice_id is required');

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

export const generateInvoice = async (
  invoice: Invoice,
  invoice_items: InvoiceItem[],
): Promise<Invoice> => {
  if (!invoice) throw new Error('Invoice data is required');
  if (!invoice_items) throw new Error('Invoice Items are required');

  console.log(invoice_items);

  try {
    if (!invoice.customer_id) throw new Error('customer_id is required');
    if (!invoice.po_number) throw new Error('po_number is required');

    const { data: insertedInvoice, error: invoiceError } = await supabase.rpc('generate_invoice', {
      p_customer_id: invoice.customer_id,
      p_po_number: invoice.po_number,
      p_subtotal: invoice.subtotal,
      p_tax: invoice.tax,
      p_total: invoice.total,
      p_items: invoice_items,
    });

    if (invoiceError) {
      console.error('Supabase generateInvoice rpc error:', invoiceError);
      throw new Error(`Failed to create Invoice: ${invoiceError?.message}`);
    }

    if (!insertedInvoice) throw new Error('Invoice creation returned no data');

    return insertedInvoice as Invoice;
  } catch (error) {
    console.error('Unexpected error in generateInvoice:', error);
    throw error instanceof Error ? error : new Error('Unknown error while generating invoice');
  }
};
