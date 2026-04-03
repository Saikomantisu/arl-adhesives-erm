import { convexApi, convexHttpClient } from '~/lib/convex';
import type { Aod } from '~/lib/data';

export const fetchAodByInvoiceId = async (
  invoice_id: string,
): Promise<Aod | null> => {
  if (!invoice_id) throw new Error('invoice_id is required');

  try {
    return (await convexHttpClient.query(convexApi.aods.getByInvoice, {
      invoiceId: invoice_id,
    })) as Aod | null;
  } catch (err) {
    console.error('Convex fetchAodByInvoiceId error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while fetching AOD');
  }
};

export const generateAod = async (invoice_id: string): Promise<Aod> => {
  if (!invoice_id) throw new Error('invoice_id is required');

  try {
    const inserted = await convexHttpClient.mutation(
      convexApi.aods.createForInvoice,
      {
        invoiceId: invoice_id,
      },
    );
    if (!inserted) throw new Error('AOD creation returned no data');
    return inserted as Aod;
  } catch (err) {
    console.error('Convex generateAod error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while generating AOD');
  }
};
