import { supabase } from '~/lib/supabase';
import type { Aod } from '~/lib/data';
import { createActivity } from '~/services/activity-service';

export const fetchAodByInvoiceId = async (invoice_id: string): Promise<Aod | null> => {
  if (!invoice_id) throw new Error('invoice_id is required');

  try {
    const { data, error } = await supabase
      .from('aods')
      .select('*')
      .eq('invoice_id', invoice_id)
      .maybeSingle();

    if (error) {
      console.error('Supabase fetchAodByInvoiceId error:', error);
      throw new Error(`Failed to fetch AOD: ${error.message}`);
    }

    return (data as Aod | null) ?? null;
  } catch (err) {
    console.error('Unexpected error in fetchAodByInvoiceId:', err);
    throw err instanceof Error ? err : new Error('Unknown error while fetching AOD');
  }
};

export const generateAod = async (invoice_id: string): Promise<Aod> => {
  if (!invoice_id) throw new Error('invoice_id is required');

  try {
    const existing = await fetchAodByInvoiceId(invoice_id);
    if (existing) return existing;

    const { data: invoiceRow, error: invoiceErr } = await supabase
      .from('invoices')
      .select('number, po_number, customer_id')
      .eq('id', invoice_id)
      .maybeSingle();

    if (invoiceErr) {
      console.error('Supabase generateAod invoice lookup error:', invoiceErr);
      throw new Error(`Failed to lookup invoice: ${invoiceErr.message}`);
    }

    if (!invoiceRow?.number) {
      throw new Error(`Invoice not found for id ${invoice_id}`);
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('aods')
      .insert({
        invoice_id,
        invoice_number: invoiceRow.number,
        po_number: invoiceRow.po_number ?? null,
      })
      .select('*')
      .maybeSingle();

    if (insertErr) {
      const isUniqueViolation =
        (insertErr as unknown as { code?: string }).code === '23505' ||
        /duplicate key/i.test(insertErr.message);

      if (isUniqueViolation) {
        const row = await fetchAodByInvoiceId(invoice_id);
        if (row) return row;
      }

      console.error('Supabase generateAod insert error:', insertErr);
      throw new Error(`Failed to create AOD: ${insertErr.message}`);
    }

    if (!inserted) throw new Error('AOD creation returned no data');

    await createActivity({
      customer_id: invoiceRow.customer_id,
      type: 'aod_generated',
      description: `AOD generated for invoice ${invoiceRow.number}`,
      ref_number: inserted.aod_number,
    });

    return inserted as Aod;
  } catch (err) {
    console.error('Unexpected error in generateAod:', err);
    throw err instanceof Error ? err : new Error('Unknown error while generating AOD');
  }
};
