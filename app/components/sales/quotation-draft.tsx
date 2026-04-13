import { useConvexMutation } from '@convex-dev/react-query';
import { SalesDocumentDraft } from '~/components/sales/sales-document-draft';
import { convexApi } from '~/lib/convex';
import { useQuotationStore } from '~/store/quotation-store';

export function QuotationDraft() {
  const createQuotation = useConvexMutation(convexApi.quotations.create);

  return (
    <SalesDocumentDraft
      title="Quotation"
      submitLabel="Create Quotation"
      submitErrorTitle="Couldn’t create quotation"
      successPath="/sales/quotation"
      successState={(id) => ({ previewQuotationId: id })}
      allowOverdueWarning={false}
      showPoNumber={false}
      useDraftStore={useQuotationStore}
      createDocument={(document, items) =>
        createQuotation({
          quotation: {
            customer_id: document.customer_id,
            po_number: document.po_number,
            subtotal: document.subtotal,
            tax: document.tax,
            total: document.total,
          },
          quotationItems: items,
        })
      }
    />
  );
}
