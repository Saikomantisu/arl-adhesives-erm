import { convexApi, convexHttpClient } from '~/lib/convex';
import type { Invoice, InvoiceItem, InvoiceStatus } from '~/lib/data';

export const fetchInvoices = async (month?: Date): Promise<Invoice[]> => {
  try {
    return (await convexHttpClient.query(convexApi.invoices.list, {
      monthTimestamp: month?.getTime(),
    })) as Invoice[];
  } catch (err) {
    console.error('Convex fetchInvoices error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while fetching invoices');
  }
};

export const fetchDueInvoices = async (month?: Date): Promise<Invoice[]> => {
  try {
    return (await convexHttpClient.query(convexApi.invoices.listDue, {
      monthTimestamp: month?.getTime(),
    })) as Invoice[];
  } catch (err) {
    console.error('Convex fetchDueInvoices error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while fetching due invoices');
  }
};

export const fetchInvoiceItems = async (
  invoice_id: string | undefined,
): Promise<InvoiceItem[]> => {
  if (!invoice_id) throw new Error('invoice_id is required');

  try {
    return (await convexHttpClient.query(convexApi.invoices.itemsByInvoice, {
      invoiceId: invoice_id,
    })) as InvoiceItem[];
  } catch (err) {
    console.error('Convex fetchInvoiceItems error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while fetching invoice items');
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

    const insertedInvoice = await convexHttpClient.mutation(
      convexApi.invoices.create,
      {
        invoice: {
          customer_id: invoice.customer_id,
          po_number: invoice.po_number,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
        },
        invoiceItems: invoice_items,
      },
    );

    if (!insertedInvoice) throw new Error('Invoice creation returned no data');

    return insertedInvoice as Invoice;
  } catch (error) {
    console.error('Convex generateInvoice error:', error);
    throw error instanceof Error
      ? error
      : new Error('Unknown error while generating invoice');
  }
};

export const updateInvoiceStatus = async (
  invoice_id: string,
  new_status: InvoiceStatus,
): Promise<Invoice> => {
  if (!invoice_id) throw new Error('invoice_id is required');
  if (!new_status) throw new Error('new_status is required');

  try {
    const updated = await convexHttpClient.mutation(
      convexApi.invoices.updateStatus,
      {
        invoiceId: invoice_id,
        status: new_status,
      },
    );
    if (!updated) throw new Error('Status update returned no data');
    return updated as Invoice;
  } catch (error) {
    console.error('Convex updateInvoiceStatus error:', error);
    throw error instanceof Error
      ? error
      : new Error('Unknown error while updating invoice');
  }
};
