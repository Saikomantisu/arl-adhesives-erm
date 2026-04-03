import { SalesDocumentDraft } from '~/components/sales/sales-document-draft';
import { generateQuotation } from '~/services/quotation-service';
import { useQuotationStore } from '~/store/quotation-store';

export function QuotationDraft() {
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
      createDocument={generateQuotation}
    />
  );
}
