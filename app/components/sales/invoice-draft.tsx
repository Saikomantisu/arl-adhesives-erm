import { useConvexMutation } from '@convex-dev/react-query';
import { SalesDocumentDraft } from '~/components/sales/sales-document-draft';
import { convexApi } from '~/lib/convex';
import { useSaleStore } from '~/store/sales-store';

export function InvoiceDraft() {
  const createInvoice = useConvexMutation(convexApi.invoices.create);

  return (
    <SalesDocumentDraft
      title="Invoice"
      submitLabel="Create Invoice"
      submitErrorTitle="Couldn’t create invoice"
      successPath="/sales"
      useDraftStore={useSaleStore}
      createDocument={(document, items) =>
        createInvoice({
          invoice: {
            customer_id: document.customer_id,
            po_number: document.po_number ?? '',
            subtotal: document.subtotal,
            tax: document.tax,
            total: document.total,
          },
          invoiceItems: items,
        })
      }
    />
  );
}
