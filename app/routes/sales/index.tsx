import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Eye, Plus } from 'lucide-react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { TopBar } from '~/components/layouts/top-bar';
import { Link, type MetaFunction } from 'react-router';
import { updateInvoiceStatus } from '~/services/invoice-service';
import { StatusBadge } from '~/components/shared/status-badge';
import { SalesEmptyState } from '~/components/shared/empty-state';
import {
  formatCurrency,
  type Customer,
  type Invoice,
  type InvoiceStatus,
} from '~/lib/data';
import { InvoicePreviewModal } from '~/components/modals/invoice-preview-modal';
import { convexApi } from '~/lib/convex';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
] as const;

export const meta: MetaFunction = () => {
  return [{ title: 'Invoices | ARL Adhesives' }];
};

function InvoiceRow({
  inv,
  openPreview,
}: {
  inv: Invoice;
  openPreview: (inv: Invoice) => void;
}) {
  const [status, setStatus] = useState<InvoiceStatus>(
    (inv.status as InvoiceStatus) ?? 'pending',
  );
  const statusUpdateLockedRef = useRef(false);

  const customerQuery = useQuery(
    convexQuery(
      convexApi.customers.get,
      inv.customer_id ? { customerId: inv.customer_id } : 'skip',
    ),
  );
  const customer = (customerQuery.data ?? null) as Customer | null;

  const updateStatusMutation = useMutation({
    mutationFn: (nextStatus: InvoiceStatus) =>
      updateInvoiceStatus(inv.id!, nextStatus),
    onError: () => {
      setStatus((inv.status as InvoiceStatus) ?? 'pending');
    },
    onSettled: () => {
      statusUpdateLockedRef.current = false;
    },
  });

  useEffect(() => {
    setStatus((inv.status as InvoiceStatus) ?? 'pending');
  }, [inv.status]);

  const handleValueChange = (value: string | null) => {
    if (!value) return;
    if (statusUpdateLockedRef.current || updateStatusMutation.isPending) return;

    const nextStatus = value as InvoiceStatus;
    if (nextStatus === status) return;

    setStatus(nextStatus);
    if (!inv.id) return;

    statusUpdateLockedRef.current = true;
    updateStatusMutation.mutate(nextStatus);
  };

  const renderStatusSelect = () => (
    <Select
      value={status}
      onValueChange={(value) => handleValueChange(value)}
      disabled={updateStatusMutation.isPending}
    >
      <SelectTrigger size="sm" className="h-7 px-2 text-xs">
        <SelectValue className="capitalize text-xs" />
      </SelectTrigger>

      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <StatusBadge status={option.value} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderPreviewButton = (size: 'sm' | 'icon') =>
    size === 'icon' ? (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => openPreview(inv)}
      >
        <Eye className="h-4 w-4 text-zinc-400" />
      </Button>
    ) : (
      <Button variant="ghost" size="sm" onClick={() => openPreview(inv)}>
        <Eye className="mr-2 h-4 w-4 text-zinc-400" />
        Preview
      </Button>
    );

  return (
    <TableRow>
      <TableCell className="md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {inv.number}
            </p>
            <p className="mt-1 truncate text-xs text-zinc-500">
              {customer?.company}
            </p>

            <p className="mt-1 text-xs text-zinc-500">PO: {inv.po_number}</p>

            <p className="mt-1 text-xs text-zinc-500">
              Due{' '}
              {inv.due_date
                ? new Date(inv.due_date).toLocaleDateString('en-UK')
                : '-'}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(inv.total)}
            </p>
            <div className="mt-1 flex justify-end">{renderStatusSelect()}</div>
          </div>
        </div>

        <div className="mt-3 flex justify-end">{renderPreviewButton('sm')}</div>
      </TableCell>

      <TableCell>
        <span className="hidden text-sm font-medium text-zinc-900 dark:text-zinc-50 md:inline">
          {inv.number}
        </span>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <span className="text-sm text-zinc-500">{inv.po_number || '-'}</span>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {customer?.avatar}
          </div>
          <div>
            <p className="text-sm text-zinc-900 dark:text-zinc-50">
              {customer?.company}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell className="hidden text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50 md:table-cell">
        {formatCurrency(inv.total)}
      </TableCell>

      <TableCell className="hidden md:table-cell">
        {renderStatusSelect()}
      </TableCell>

      <TableCell className="hidden text-sm text-zinc-500 md:table-cell">
        {inv.due_date
          ? new Date(inv.due_date).toLocaleDateString('en-UK')
          : '-'}
      </TableCell>

      <TableCell className="hidden md:table-cell">
        {renderPreviewButton('icon')}
      </TableCell>
    </TableRow>
  );
}

export default function SalesIndexPage() {
  const invoiceRowsQuery = useQuery(convexQuery(convexApi.invoices.list, {}));
  const invoiceRows = (invoiceRowsQuery.data ?? []) as Invoice[];
  const isLoading = invoiceRowsQuery.isLoading;

  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [paidExpanded, setPaidExpanded] = useState(false);

  const showEmpty = false;
  const data = showEmpty ? [] : invoiceRows;

  // Separate invoices into active (pending/overdue) and paid
  const activeInvoices = data.filter((inv) => inv.status !== 'paid');
  const paidInvoices = data.filter((inv) => inv.status === 'paid');

  const previewInvoice = previewInvoiceId
    ? (invoiceRows.find((i) => i.id === previewInvoiceId) ?? null)
    : null;

  const openPreview = (inv: Invoice) => {
    setPreviewInvoiceId(inv.id ?? null);
    setPreviewOpen(true);
  };

  return (
    <div>
      <TopBar title="Sales" />

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <Card className="gap-0 py-0">
            <div
              className="flex flex-col gap-3 border-b border-zinc-100 p-4
                sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
            >
              <div className="space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="h-8 w-full animate-pulse rounded bg-zinc-200 sm:w-28 dark:bg-zinc-800" />
            </div>

            <div className="p-4">
              <div className="space-y-3">
                <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          </Card>
        ) : data.length === 0 ? (
          <Card>
            <SalesEmptyState />
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="gap-0 py-0">
              {/* Toolbar */}
              <div
                className="flex flex-col gap-3 border-b border-zinc-100 p-4
                  sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
              >
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Invoices
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {activeInvoices.length} active
                    {paidInvoices.length > 0 && `, ${paidInvoices.length} paid`}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
                >
                  <Link to="/sales/new" className="flex items-center">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    New Sale
                  </Link>
                </Button>
              </div>

              {/* Active Invoices Table */}
              {activeInvoices.length > 0 ? (
                <Table>
                  <TableHeader className="hidden md:table-header-group">
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800 md:divide-y-0">
                    {activeInvoices.map((inv) => (
                      <InvoiceRow
                        key={inv.id}
                        inv={inv}
                        openPreview={openPreview}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-sm text-zinc-500">
                  No pending or overdue invoices
                </div>
              )}

              {/* Collapsible Paid Invoices Section */}
              {paidInvoices.length > 0 && (
                <div className="border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setPaidExpanded(!paidExpanded)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                  >
                    <motion.div
                      animate={{ rotate: paidExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                    Paid Invoices ({paidInvoices.length})
                  </button>

                  <AnimatePresence initial={false}>
                    {paidExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <Table>
                          <TableHeader className="hidden md:table-header-group">
                            <TableRow>
                              <TableHead>Invoice</TableHead>
                              <TableHead>PO Number</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead className="text-right">
                                Amount
                              </TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800 md:divide-y-0">
                            {paidInvoices.map((inv) => (
                              <InvoiceRow
                                key={inv.id}
                                inv={inv}
                                openPreview={openPreview}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>

      <InvoicePreviewModal
        invoice={previewInvoice}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
