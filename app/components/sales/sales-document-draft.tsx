import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { Separator } from '~/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { convexApi } from '~/lib/convex';
import { Trash2, Minus, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { formatCurrency, type Customer, type SalesLineItem } from '~/lib/data';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import type { SalesDraftStore } from '~/store/create-sales-draft-store';

interface SalesDocumentDraftProps {
  title: string;
  submitLabel: string;
  submitErrorTitle: string;
  successPath: string;
  successState?: (id: string) => unknown;
  allowOverdueWarning?: boolean;
  showPoNumber?: boolean;
  useDraftStore: SalesDraftStore;
  createDocument: (
    document: {
      customer_id: string;
      po_number?: string;
      subtotal: number;
      tax: number;
      total: number;
    },
    items: SalesLineItem[],
  ) => Promise<{ id?: string }>;
}

export function SalesDocumentDraft({
  title,
  submitLabel,
  submitErrorTitle,
  successPath,
  successState,
  allowOverdueWarning = true,
  showPoNumber = true,
  useDraftStore,
  createDocument,
}: SalesDocumentDraftProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    customer_id,
    items,
    po_number,
    setCustomer,
    setPoNumber,
    removeItem,
    updateQuantity,
    clearSale,
    subtotal,
    tax,
    total,
  } = useDraftStore();

  const customersQuery = useQuery(convexQuery(convexApi.customers.list, {}));
  const customers = (customersQuery.data ?? []) as Customer[];
  const selectedCustomer =
    customers.find((customer) => customer.id === customer_id) ?? null;

  const handleCreate = async () => {
    if (!customer_id || (showPoNumber && !po_number) || isSubmitting) return;

    try {
      setSubmitError(null);
      setIsSubmitting(true);

      const created = await createDocument(
        {
          customer_id,
          po_number: po_number || undefined,
          subtotal: subtotal(),
          tax: tax(),
          total: total(),
        },
        items,
      );

      clearSale();
      navigate(successPath, {
        state:
          created.id && successState ? successState(created.id) : undefined,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `Something went wrong while creating the ${title.toLowerCase()}.`;
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverdue =
    allowOverdueWarning && selectedCustomer?.status === 'overdue';

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {title} Draft
          </h2>
          <p className="text-xs text-zinc-500">
            {items.length} item{items.length !== 1 && 's'}
          </p>
        </div>

        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-zinc-500 hover:text-rose-600"
            onClick={clearSale}
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Customer
        </label>
        <Select
          value={customer_id ?? ''}
          onValueChange={(val) => setCustomer(val || null)}
        >
          <SelectTrigger
            className={cn(
              'w-full',
              isOverdue && 'border-rose-300 dark:border-rose-700',
            )}
          >
            <SelectValue placeholder="Select a customer…">
              {selectedCustomer?.company ?? null}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                <div className="flex items-center gap-2">
                  <span>{customer.company}</span>
                  {customer.status === 'overdue' && (
                    <AlertTriangle className="h-3 w-3 text-rose-500" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isOverdue && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 flex items-center gap-1 text-xs text-rose-600"
          >
            <AlertTriangle className="h-3 w-3" />
            This customer has overdue payments
          </motion.p>
        )}
      </div>

      {showPoNumber ? (
        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            PO Number
          </label>
          <Input
            placeholder="PO number…"
            required
            value={po_number}
            onChange={(e) => {
              setPoNumber(e.target.value);
              if (submitError) setSubmitError(null);
            }}
            className="h-9 text-sm"
          />
        </div>
      ) : null}

      <Separator className="mb-4" />

      <div className="flex-1 space-y-2 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <p className="text-sm text-zinc-400">
                Click products on the left to add items
              </p>
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
                className="rounded-lg border border-zinc-200 bg-white p-3
                  dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatCurrency(item.product_price)} / unit
                    </p>
                    <p className="text-xs text-zinc-500">
                      {item.total_weight_kg} kg
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-400 hover:text-rose-600"
                    onClick={() => removeItem(item.product_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(
                          item.product_id,
                          Math.max(1, item.quantity - 1),
                        )
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(item.product_id, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-3 border-t border-zinc-200 pt-4
            dark:border-zinc-700"
        >
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Subtotal</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {formatCurrency(subtotal())}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Tax (18%)</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {formatCurrency(tax())}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Grand Total
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(total())}
            </span>
          </div>

          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm
                  text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                role="alert"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      {submitErrorTitle}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed">
                      {submitError}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={handleCreate}
            disabled={
              !customer_id || (showPoNumber && !po_number) || isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              submitLabel
            )}
          </Button>
          {!customer_id && (
            <p className="text-center text-xs text-zinc-400">
              Select a customer to finalize
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
