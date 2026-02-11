import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useSaleStore } from '~/store/sales-store';
import { Separator } from '~/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCustomerById, fetchCustomers } from '~/services/customer-service';
import { Trash2, Minus, Plus, AlertTriangle } from 'lucide-react';
import { formatCurrency, getCustomer } from '~/lib/data';

export function InvoiceDraft() {
  const {
    customer_id,
    items,
    setCustomer,
    removeItem,
    updateQuantity,
    clearSale,
    subtotal,
    tax,
    total,
  } = useSaleStore();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: selectedCustomer } = useQuery({
    queryKey: ['customers', customer_id],
    queryFn: () => fetchCustomerById(customer_id!),
    enabled: !!customer_id,
  });

  const isOverdue = selectedCustomer?.status === 'overdue';

  return (
    <div className='flex h-full flex-col p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h2 className='text-sm font-semibold text-zinc-900 dark:text-zinc-50'>Invoice Draft</h2>
          <p className='text-xs text-zinc-500'>
            {items.length} item{items.length !== 1 && 's'}
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant='ghost'
            size='sm'
            className='text-xs text-zinc-500 hover:text-rose-600'
            onClick={clearSale}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Customer Selector */}
      <div className='mb-4'>
        <label className='mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-400'>
          Customer
        </label>
        <Select
          value={selectedCustomer?.company ?? ''}
          onValueChange={(val) => setCustomer(val || null)}
        >
          <SelectTrigger
            className={cn('w-full', isOverdue && 'border-rose-300 dark:border-rose-700')}
          >
            <SelectValue placeholder='Select a customer…' />
          </SelectTrigger>

          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <div className='flex items-center gap-2'>
                  <span>{c.company}</span>
                  {c.status === 'overdue' && <AlertTriangle className='h-3 w-3 text-rose-500' />}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isOverdue && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className='mt-1.5 flex items-center gap-1 text-xs text-rose-600'
          >
            <AlertTriangle className='h-3 w-3' />
            This customer has overdue payments
          </motion.p>
        )}
      </div>

      <Separator className='mb-4' />

      {/* Line Items */}
      <div className='flex-1 space-y-2 overflow-y-auto'>
        <AnimatePresence mode='popLayout'>
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='flex flex-col items-center justify-center py-16 text-center'
            >
              <p className='text-sm text-zinc-400'>Click products on the left to add items</p>
            </motion.div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.product_id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className='rounded-lg border border-zinc-200 bg-white p-3
                  dark:border-zinc-700 dark:bg-zinc-800'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-zinc-900 dark:text-zinc-50'>
                      {item.name}
                    </p>
                    <p className='text-xs text-zinc-500'>
                      {formatCurrency(item.product_price)} / unit
                    </p>
                    <p className='text-xs text-zinc-500'>{item.total_weight_kg} kg</p>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7 text-zinc-400 hover:text-rose-600'
                    onClick={() => removeItem(item.product_id)}
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </div>
                <div className='mt-2 flex items-center justify-between'>
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-7 w-7'
                      onClick={() =>
                        updateQuantity(item.product_id, Math.max(1, item.quantity - 1))
                      }
                    >
                      <Minus className='h-3 w-3' />
                    </Button>
                    <span className='w-8 text-center text-sm font-medium text-zinc-900 dark:text-zinc-50'>
                      {item.quantity}
                    </span>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-7 w-7'
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    >
                      <Plus className='h-3 w-3' />
                    </Button>
                  </div>
                  <span className='text-sm font-semibold text-zinc-900 dark:text-zinc-50'>
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className='mt-4 space-y-3 border-t border-zinc-200 pt-4
            dark:border-zinc-700'
        >
          <div className='flex justify-between text-sm'>
            <span className='text-zinc-500'>Subtotal</span>
            <span className='font-medium text-zinc-800 dark:text-zinc-200'>
              {formatCurrency(subtotal())}
            </span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-zinc-500'>Tax (18%)</span>
            <span className='font-medium text-zinc-800 dark:text-zinc-200'>
              {formatCurrency(tax())}
            </span>
          </div>
          <Separator />
          <div className='flex justify-between'>
            <span className='text-sm font-semibold text-zinc-900 dark:text-zinc-50'>
              Grand Total
            </span>
            <span className='text-lg font-bold text-indigo-600 dark:text-indigo-400'>
              {formatCurrency(total())}
            </span>
          </div>

          <Button className='mt-2 w-full bg-indigo-600 hover:bg-indigo-700' disabled={!customer_id}>
            Create Invoice
          </Button>
          {!customer_id && (
            <p className='text-center text-xs text-zinc-400'>Select a customer to finalize</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
