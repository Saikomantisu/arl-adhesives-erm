import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Printer, ArrowLeft, FileText } from 'lucide-react';
import {
  type Aod,
  type Customer,
  type Invoice,
  type InvoiceItem,
} from '~/lib/data';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { generateAod } from '~/services/aod-service';
import { buildAodHtml } from '~/lib/print/aod-template';
import { convexApi } from '~/lib/convex';
import { SalesDocumentTemplate } from '~/components/documents/sales-document-template';

interface InvoicePreviewModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoicePreviewModal({
  invoice,
  open,
  onOpenChange,
}: InvoicePreviewModalProps) {
  if (!invoice) return null;

  const itemsQuery = useQuery(
    convexQuery(
      convexApi.invoices.itemsByInvoice,
      invoice.id ? { invoiceId: invoice.id } : 'skip',
    ),
  );
  const items = (itemsQuery.data ?? []) as InvoiceItem[];

  const customerQuery = useQuery(
    convexQuery(
      convexApi.customers.get,
      invoice.customer_id ? { customerId: invoice.customer_id } : 'skip',
    ),
  );
  const customer = (customerQuery.data ?? null) as Customer | null;

  const aodQuery = useQuery(
    convexQuery(
      convexApi.aods.getByInvoice,
      invoice.id ? { invoiceId: invoice.id } : 'skip',
    ),
  );
  const aod = (aodQuery.data ?? null) as Aod | null;

  const generateAodMutation = useMutation({
    mutationFn: () => generateAod(invoice.id!),
  });

  const invoiceRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const containerWidth = wrapper.clientWidth - 32;
    const invoiceWidth = 794;
    const nextScale =
      containerWidth < invoiceWidth ? containerWidth / invoiceWidth : 1;
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

  const printHtml = useCallback((bodyHtml: string, extraCss: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const stylesheets = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          if (sheet.href) {
            return `<link rel="stylesheet" href="${sheet.href}" />`;
          }
          const rules = Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
          return `<style>${rules}</style>`;
        } catch {
          return sheet.href
            ? `<link rel="stylesheet" href="${sheet.href}" />`
            : '';
        }
      })
      .join('\n');

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    ${stylesheets}
    <style>
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; background: white; }
      ${extraCss}
    </style>
  </head>
  <body>${bodyHtml}</body>
</html>`);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 1000);
      }, 250);
    };
  }, []);

  const handlePrint = useCallback(() => {
    const invoiceEl = invoiceRef.current;
    if (!invoiceEl) return;

    printHtml(
      invoiceEl.outerHTML,
      `
      .invoice-page {
        width: 210mm;
        min-height: 297mm;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 10mm 15mm !important;
      }
      `,
    );
  }, [printHtml]);

  const handlePrintAod = useCallback(async () => {
    if (!invoice.id) return;

    const row = aod ?? (await generateAodMutation.mutateAsync());
    const { html, extraCss } = buildAodHtml({
      aod: row,
      invoice,
      customer,
      items,
    });

    printHtml(html, extraCss);
  }, [aod, customer, generateAodMutation, invoice, items, printHtml]);

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
              Invoice Preview
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
            </Button>

            <Button
              onClick={handlePrintAod}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              disabled={!invoice.id || generateAodMutation.isPending}
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {aod ? 'Print AOD' : 'Generate & Print AOD'}
              </span>
              <span className="sm:hidden">{aod ? 'AOD' : 'Gen AOD'}</span>
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
            <SalesDocumentTemplate
              ref={invoiceRef}
              documentTitle="TAX - INVOICE"
              numberLabel="Invoice No"
              number={invoice.number}
              createdAt={invoice.created_at}
              poNumber={invoice.po_number}
              customer={customer}
              items={items}
              subtotal={invoice.subtotal}
              tax={invoice.tax}
              total={invoice.total}
              extraRows={[
                {
                  label: 'A.O.D. No',
                  value: aod?.aod_number ?? '—',
                },
              ]}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
