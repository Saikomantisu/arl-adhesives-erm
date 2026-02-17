import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Printer, ArrowLeft, FileText } from 'lucide-react';
import { invoiceFormatCurrency, type Invoice } from '~/lib/data';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInvoiceItems } from '~/services/invoice-service';
import { fetchCustomerById } from '~/services/customer-service';
import { fetchAodByInvoiceId, generateAod } from '~/services/aod-service';
import { buildAodHtml } from '~/lib/print/aod-template';

interface InvoicePreviewModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoicePreviewModal({ invoice, open, onOpenChange }: InvoicePreviewModalProps) {
  if (!invoice) return null;

  const { data: items } = useQuery({
    queryKey: ['invoice_items', invoice.id],
    queryFn: () => fetchInvoiceItems(invoice.id),
    enabled: !!invoice.id,
  });

  const { data: customer } = useQuery({
    queryKey: ['customers', invoice.customer_id],
    queryFn: () => fetchCustomerById(invoice.customer_id),
    enabled: !!invoice.customer_id,
  });

  const { data: aod } = useQuery({
    queryKey: ['aod', invoice.id],
    queryFn: () => fetchAodByInvoiceId(invoice.id!),
    enabled: !!invoice.id,
  });

  const queryClient = useQueryClient();

  const generateAodMutation = useMutation({
    mutationFn: () => generateAod(invoice.id!),
    onSuccess: (row) => {
      queryClient.setQueryData(['aod', invoice.id], row);
    },
  });

  const invoiceRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const containerWidth = wrapper.clientWidth - 32; // subtract padding (16px each side)
    const invoiceWidth = 794; // 210mm at 96dpi
    const newScale = containerWidth < invoiceWidth ? containerWidth / invoiceWidth : 1;
    setScale(newScale);
  }, []);

  useEffect(() => {
    if (!open) return;

    // Initial calc after dialog opens
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

    // Collect all stylesheets from the host page so Tailwind classes resolve
    const stylesheets = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          if (sheet.href) return `<link rel="stylesheet" href="${sheet.href}" />`;
          const rules = Array.from(sheet.cssRules)
            .map((r) => r.cssText)
            .join('\n');
          return `<style>${rules}</style>`;
        } catch {
          // CORS-blocked sheets — skip
          return sheet.href ? `<link rel="stylesheet" href="${sheet.href}" />` : '';
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

  // Iframe-based print: prints only the invoice, zero side-effects on the main page
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
    const { html, extraCss } = buildAodHtml({ aod: row, invoice, customer, items });

    printHtml(html, extraCss);
  }, [aod, customer, generateAodMutation, invoice, items, printHtml]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='max-w-full h-dvh rounded-none inset-0 top-0 left-0 translate-x-0 translate-y-0
          sm:max-w-5xl sm:max-h-[90vh] sm:rounded-2xl sm:top-1/2 sm:left-1/2
          sm:-translate-x-1/2 sm:-translate-y-1/2
          p-0 overflow-hidden border-none flex flex-col gap-0'
        showCloseButton={false}
      >
        {/* Header toolbar */}
        <DialogHeader className='flex flex-row items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0'>
          <div className='flex items-center gap-3'>
            {/* Back arrow on mobile, hidden on desktop */}
            <button
              onClick={() => onOpenChange(false)}
              className='sm:hidden p-1 -ml-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors'
              aria-label='Close'
            >
              <ArrowLeft className='h-5 w-5' />
            </button>

            <DialogTitle className='text-sm sm:text-base font-semibold'>
              Invoice Preview
            </DialogTitle>
          </div>

          <div className='flex items-center gap-2'>
            <Button onClick={handlePrint} variant='outline' size='sm' className='h-8 gap-1.5'>
              <Printer className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>Print</span>
            </Button>

            <Button
              onClick={handlePrintAod}
              variant='outline'
              size='sm'
              className='h-8 gap-1.5'
              disabled={!invoice.id || generateAodMutation.isPending}
            >
              <FileText className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>{aod ? 'Print AOD' : 'Generate & Print AOD'}</span>
              <span className='sm:hidden'>{aod ? 'AOD' : 'Gen AOD'}</span>
            </Button>

            {/* Desktop close button */}
            <button
              onClick={() => onOpenChange(false)}
              className='hidden sm:flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors'
              aria-label='Close'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <line x1='18' y1='6' x2='6' y2='18' />
                <line x1='6' y1='6' x2='18' y2='18' />
              </svg>
            </button>
          </div>
        </DialogHeader>

        {/* Scrollable invoice area */}
        <div
          ref={wrapperRef}
          className='flex-1 overflow-y-auto overflow-x-hidden bg-zinc-100 dark:bg-zinc-950/50 p-4 sm:p-8 flex justify-center'
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              // Reserve the scaled height so the scroll container knows the real size
              height: scale < 1 ? `calc(297mm * ${scale})` : undefined,
            }}
          >
            {/* ===== INVOICE TEMPLATE — DO NOT EDIT BELOW THIS LINE ===== */}
            <div
              ref={invoiceRef}
              className='invoice-page bg-white p-[15mm_20mm] shadow-sm text-black font-serif'
            >
              {/* Company Header */}
              <header className='mb-4'>
                <h1 className='text-[26px] font-bold text-[#2a5f8f] underline leading-tight'>
                  ARL Adhesives
                </h1>
                <div className='text-[13px] italic text-[#2a5f8f] leading-normal'>
                  No.3/6A, Edirigoda Road, Nugegoda, Sri Lanka.
                  <br />
                  Phone : +94 777 767260, +94 777 766006
                  <br />
                  Email : arl.adhesives@gmail.com
                </div>
                <div className='text-[13px] italic text-[#2a5f8f] mt-1'>
                  VAT Registration Number: 103506638 - 7000
                </div>
              </header>

              <div className='text-right italic text-sm mb-2'>Customer Copy</div>

              <h2 className='text-center text-2xl font-bold mb-8'>TAX- INVOICE</h2>

              {/* Info Section */}
              <div className='flex justify-between mb-8 text-sm'>
                <div className='max-w-[50%]'>
                  <h3 className='font-bold underline mb-1 uppercase text-xs'>Consignee:</h3>
                  <p className='leading-relaxed'>{customer?.company},</p>

                  <p className='leading-relaxed w-[200px]'>{customer?.address!}</p>

                  <p className='leading-relaxed'>VAT Registration No: {customer?.vat_reg_no}</p>
                </div>

                <div className='text-sm'>
                  <table className='border-collapse'>
                    <tbody>
                      <tr>
                        <td className='font-bold pr-2 py-0.5 whitespace-nowrap'>Invoice No</td>
                        <td>: {invoice.number}</td>
                      </tr>
                      <tr>
                        <td className='font-bold pr-2 py-0.5 whitespace-nowrap'>Date</td>
                        <td>
                          {new Date(invoice.created_at!).toLocaleDateString('en-UK', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </td>
                      </tr>
                      <tr>
                        <td className='font-bold pr-2 py-0.5 whitespace-nowrap'>P.O. No</td>
                        <td>: {invoice.po_number}</td>
                      </tr>
                      <tr>
                        <td className='font-bold pr-2 py-0.5 whitespace-nowrap'>A.O.D. No</td>
                        <td>: {aod?.aod_number ?? '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Items Table */}
              <table className='w-full border-collapse border border-black text-sm mb-8'>
                <thead>
                  <tr className='font-bold text-center'>
                    <th className='border border-black p-2 w-[12%]'>Item Code</th>
                    <th className='border border-black p-2 w-[36%] text-left'>Description</th>
                    <th className='border border-black p-2 w-[12%]'>Qty KGS</th>
                    <th className='border border-black p-2 w-[18%]'>Unit Price /SLR</th>
                    <th className='border border-black p-2 w-[22%]'>Total Value SLR</th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map((item) => (
                    <tr className='h-24 align-top text-center'>
                      <td className='border border-black p-2'></td>
                      <td className='border border-black p-2 text-left'>
                        {item.name}
                        <br />
                        Make : Malayasia
                        <br />
                        Brand : Adtek
                      </td>
                      <td className='border border-black p-2'>{item.total_weight_kg}</td>
                      <td className='border border-black p-2'>
                        {invoiceFormatCurrency(item.price_per_kg)}
                      </td>
                      <td className='border border-black p-2 text-right font-medium'>
                        {invoiceFormatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}

                  {/* Totals */}
                  <tr>
                    <td colSpan={3} className='border-none'></td>
                    <td className='border border-black p-2 text-center font-bold'>Sub Total</td>
                    <td className='border border-black p-2 text-right'>
                      {invoiceFormatCurrency(invoice.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className='border-none'></td>
                    <td className='border border-black p-2 text-center font-bold'>VAT 18%</td>
                    <td className='border border-black p-2 text-right'>
                      {invoiceFormatCurrency(invoice.tax)}
                    </td>
                  </tr>
                  <tr className='font-bold'>
                    <td colSpan={3} className='border-none'></td>
                    <td className='border border-black p-2 text-center'>Total :</td>
                    <td className='border border-black p-2 text-right'>
                      {invoiceFormatCurrency(invoice.total)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Note */}
              <div className='text-sm leading-relaxed mt-8'>
                Draw the cheque in favour of <strong>{customer?.payee}</strong>, A/C payee only.
              </div>

              {/* Signature */}
              <div className='flex flex-col items-end mt-20'>
                <div className='w-48 border-b border-black border-dotted mb-1'></div>
                <span className='text-[13px] pr-8'>Checked & Issued by</span>
              </div>

              {/* Footer pushes to bottom of A4 if content is small */}
              <div className='mt-20'>
                <hr className='border-t-2 border-dashed border-black mb-3' />
                <div className='text-center text-[10px] text-zinc-600'>
                  No. 3/6A, Edirigoda Road, Nugegoda. Tel. +94 777 766006, 777 767260 Email:
                  arl.adhesives@gmail.com
                </div>
              </div>
            </div>
            {/* ===== INVOICE TEMPLATE — DO NOT EDIT ABOVE THIS LINE ===== */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
