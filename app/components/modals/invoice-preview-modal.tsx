import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Download, X } from 'lucide-react';
import { formatCurrency, getCustomer, type Invoice } from '~/lib/data';
import { motion } from 'framer-motion';

interface InvoicePreviewModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoicePreviewModal({ invoice, open, onOpenChange }: InvoicePreviewModalProps) {
  if (!invoice) return null;
  const customer = getCustomer(invoice.customer_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl p-0'>
        <DialogHeader className='flex flex-row items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800'>
          <DialogTitle className='text-base font-semibold'>{invoice.number} Preview</DialogTitle>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm'>
              <Download className='mr-1.5 h-3.5 w-3.5' />
              Export PDF
            </Button>
          </div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className='p-8'
        >
          {/* Invoice Paper */}
          <div
            className='rounded-lg border border-zinc-200 bg-white p-8
                dark:border-zinc-700 dark:bg-zinc-900'
          >
            {/* Header */}
            <div className='flex items-start justify-between'>
              <div>
                <h2 className='text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50'>
                  INVOICE
                </h2>
                <p className='mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-400'>
                  {invoice.number}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-semibold text-zinc-900 dark:text-zinc-50'>
                  Rav Enterprises
                </p>
                <p className='text-xs text-zinc-500'>Web Dev & Fitness Equipment</p>
                <p className='text-xs text-zinc-500'>Bangalore, India</p>
                <p className='text-xs text-zinc-500'>GSTIN: 29AADCR1234P1ZX</p>
              </div>
            </div>

            <Separator className='my-6' />

            {/* Bill To + Dates */}
            <div className='grid grid-cols-2 gap-8'>
              <div>
                <p className='text-[11px] font-medium uppercase tracking-wider text-zinc-400'>
                  Bill To
                </p>
                <p className='mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50'>
                  {customer?.name}
                </p>
                <p className='text-xs text-zinc-500'>{customer?.company}</p>
                <p className='text-xs text-zinc-500'>{customer?.address}</p>
                <p className='text-xs text-zinc-500'>GSTIN: {customer?.taxRegNo}</p>
              </div>
              <div className='text-right'>
                <div className='space-y-1'>
                  <div className='flex justify-end gap-3'>
                    <span className='text-xs text-zinc-400'>Date:</span>
                    <span className='text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                      {invoice.createdAt.toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className='flex justify-end gap-3'>
                    <span className='text-xs text-zinc-400'>Due:</span>
                    <span className='text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                      {invoice.dueDate.toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className='mt-8'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-zinc-200 dark:border-zinc-700'>
                    <th className='pb-2 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400'>
                      Item
                    </th>
                    <th className='pb-2 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400'>
                      Qty
                    </th>
                    <th className='pb-2 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400'>
                      Rate
                    </th>
                    <th className='pb-2 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-400'>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr
                      key={item.productId}
                      className='border-b border-zinc-100 dark:border-zinc-800'
                    >
                      <td className='py-3 text-sm text-zinc-800 dark:text-zinc-200'>{item.name}</td>
                      <td className='py-3 text-right text-sm text-zinc-600 dark:text-zinc-400'>
                        {item.quantity}
                      </td>
                      <td className='py-3 text-right text-sm text-zinc-600 dark:text-zinc-400'>
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className='py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50'>
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className='mt-6 flex justify-end'>
              <div className='w-56 space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-zinc-500'>Subtotal</span>
                  <span className='font-medium text-zinc-800 dark:text-zinc-200'>
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-zinc-500'>GST (18%)</span>
                  <span className='font-medium text-zinc-800 dark:text-zinc-200'>
                    {formatCurrency(invoice.tax)}
                  </span>
                </div>
                <Separator />
                <div className='flex justify-between text-sm'>
                  <span className='font-semibold text-zinc-900 dark:text-zinc-50'>Total</span>
                  <span className='font-bold text-indigo-600 dark:text-indigo-400'>
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
