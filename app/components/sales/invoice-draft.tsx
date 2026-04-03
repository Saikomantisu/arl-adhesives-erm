import { SalesDocumentDraft } from '~/components/sales/sales-document-draft';
import { generateInvoice } from '~/services/invoice-service';
import { useSaleStore } from '~/store/sales-store';

export function InvoiceDraft() {
  return (
    <SalesDocumentDraft
      title="Invoice"
      submitLabel="Create Invoice"
      submitErrorTitle="Couldn’t create invoice"
      successPath="/sales"
      useDraftStore={useSaleStore}
      createDocument={(document, items) =>
        generateInvoice(
          {
            ...document,
            po_number: document.po_number ?? '',
          },
          items,
        )
      }
    />
  );
}
