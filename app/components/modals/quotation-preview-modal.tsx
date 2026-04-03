import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import {
  type Customer,
  type Product,
  type Quotation,
  type QuotationItem,
} from '~/lib/data';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { convexApi } from '~/lib/convex';
import {
  formatPrintDocumentTitle,
  printHtmlDocument,
} from '~/lib/print/browser-print';
import { QuotationDocument } from '~/components/documents/quotation-document';

interface QuotationPreviewModalProps {
  quotation: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuotationPreviewModal({
  quotation,
  open,
  onOpenChange,
}: QuotationPreviewModalProps) {
  if (!quotation) return null;

  const itemsQuery = useQuery(
    convexQuery(
      convexApi.quotations.itemsByQuotation,
      quotation.id ? { quotationId: quotation.id } : 'skip',
    ),
  );
  const items = (itemsQuery.data ?? []) as QuotationItem[];

  const customerQuery = useQuery(
    convexQuery(
      convexApi.customers.get,
      quotation.customer_id ? { customerId: quotation.customer_id } : 'skip',
    ),
  );
  const customer = (customerQuery.data ?? null) as Customer | null;

  const productsQuery = useQuery(convexQuery(convexApi.products.list, {}));
  const products = (productsQuery.data ?? []) as Product[];
  const productCodeById = new Map(
    products.map((product) => [product.id, product.sku] as const),
  );

  const documentItems = items.map((item) => ({
    ...item,
    item_code: productCodeById.get(item.product_id),
  }));

  const documentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const containerWidth = wrapper.clientWidth - 32;
    const documentWidth = 794;
    const nextScale =
      containerWidth < documentWidth ? containerWidth / documentWidth : 1;
    setScale(nextScale);
  }, []);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(updateScale, 50);
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapper);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [open, updateScale]);

  const handlePrint = useCallback(() => {
    const element = documentRef.current;
    if (!element) return;

    printHtmlDocument({
      bodyHtml: element.outerHTML,
      title: formatPrintDocumentTitle('Quotation', quotation.number),
      extraCss: `
      .invoice-page {
        width: 210mm;
        min-height: 297mm;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 15mm 20mm !important;
      }
      `,
    });
  }, [quotation.number]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-full h-dvh rounded-none inset-0 top-0 left-0 translate-x-0 translate-y-0
          sm:max-w-5xl sm:max-h-[90vh] sm:rounded-2xl sm:top-1/2 sm:left-1/2
          sm:-translate-x-1/2 sm:-translate-y-1/2
          p-0 overflow-hidden border-none flex flex-col gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="sm:hidden p-1 -ml-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              aria-label="Close"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <DialogTitle className="text-sm sm:text-base font-semibold">
              Quotation Preview
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </Button>

            <button
              onClick={() => onOpenChange(false)}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </DialogHeader>

        <div
          ref={wrapperRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-zinc-100 dark:bg-zinc-950/50 p-4 sm:p-8 flex justify-center"
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              height: scale < 1 ? `calc(297mm * ${scale})` : undefined,
            }}
          >
            <QuotationDocument
              ref={documentRef}
              quotation={quotation}
              customer={customer}
              items={documentItems}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
