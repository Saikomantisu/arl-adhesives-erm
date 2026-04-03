import { convexApi, convexHttpClient } from '~/lib/convex';
import type { Quotation, QuotationItem, SalesLineItem } from '~/lib/data';

export const fetchQuotations = async (month?: Date): Promise<Quotation[]> => {
  try {
    return (await convexHttpClient.query(convexApi.quotations.list, {
      monthTimestamp: month?.getTime(),
    })) as Quotation[];
  } catch (err) {
    console.error('Convex fetchQuotations error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while fetching quotations');
  }
};

export const fetchQuotationItems = async (
  quotation_id: string | undefined,
): Promise<QuotationItem[]> => {
  if (!quotation_id) throw new Error('quotation_id is required');

  try {
    return (await convexHttpClient.query(
      convexApi.quotations.itemsByQuotation,
      {
        quotationId: quotation_id,
      },
    )) as QuotationItem[];
  } catch (err) {
    console.error('Convex fetchQuotationItems error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while fetching quotation items');
  }
};

export const generateQuotation = async (
  quotation: Quotation,
  quotation_items: SalesLineItem[],
): Promise<Quotation> => {
  if (!quotation) throw new Error('Quotation data is required');
  if (!quotation_items) throw new Error('Quotation items are required');

  try {
    if (!quotation.customer_id) throw new Error('customer_id is required');

    const insertedQuotation = await convexHttpClient.mutation(
      convexApi.quotations.create,
      {
        quotation: {
          customer_id: quotation.customer_id,
          po_number: quotation.po_number ?? undefined,
          subtotal: quotation.subtotal,
          tax: quotation.tax,
          total: quotation.total,
        },
        quotationItems: quotation_items,
      },
    );

    if (!insertedQuotation) {
      throw new Error('Quotation creation returned no data');
    }

    return insertedQuotation as Quotation;
  } catch (error) {
    console.error('Convex generateQuotation error:', error);
    throw error instanceof Error
      ? error
      : new Error('Unknown error while generating quotation');
  }
};
