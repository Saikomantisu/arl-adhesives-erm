import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Plus } from 'lucide-react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { TopBar } from '~/components/layouts/top-bar';
import {
  Link,
  type MetaFunction,
  useLocation,
  useNavigate,
} from 'react-router';
import { SalesEmptyState } from '~/components/shared/empty-state';
import { formatCurrency, type Customer, type Quotation } from '~/lib/data';
import { QuotationPreviewModal } from '~/components/modals/quotation-preview-modal';
import { convexApi } from '~/lib/convex';

export const meta: MetaFunction = () => {
  return [{ title: 'Quotations | ARL Adhesives' }];
};

function QuotationRow({
  quotation,
  openPreview,
}: {
  quotation: Quotation;
  openPreview: (quotation: Quotation) => void;
}) {
  const customerQuery = useQuery(
    convexQuery(
      convexApi.customers.get,
      quotation.customer_id ? { customerId: quotation.customer_id } : 'skip',
    ),
  );
  const customer = (customerQuery.data ?? null) as Customer | null;

  return (
    <TableRow>
      <TableCell className="md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {quotation.number}
            </p>
            <p className="mt-1 truncate text-xs text-zinc-500">
              {customer?.company}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Created{' '}
              {quotation.created_at
                ? new Date(quotation.created_at).toLocaleDateString('en-UK')
                : '-'}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(quotation.total)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openPreview(quotation)}
          >
            <Eye className="mr-2 h-4 w-4 text-zinc-400" />
            Preview
          </Button>
        </div>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {quotation.number}
        </span>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {customer?.avatar}
          </div>
          <p className="text-sm text-zinc-900 dark:text-zinc-50">
            {customer?.company}
          </p>
        </div>
      </TableCell>

      <TableCell className="hidden md:table-cell text-sm text-zinc-500">
        {quotation.created_at
          ? new Date(quotation.created_at).toLocaleDateString('en-UK')
          : '-'}
      </TableCell>

      <TableCell className="hidden text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50 md:table-cell">
        {formatCurrency(quotation.total)}
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => openPreview(quotation)}
        >
          <Eye className="h-4 w-4 text-zinc-400" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function QuotationIndexPage() {
  const quotationsQuery = useQuery(convexQuery(convexApi.quotations.list, {}));
  const quotations = (quotationsQuery.data ?? []) as Quotation[];
  const isLoading = quotationsQuery.isLoading;

  const location = useLocation();
  const navigate = useNavigate();
  const autoOpenedRef = useRef(false);
  const [previewQuotationId, setPreviewQuotationId] = useState<string | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewQuotation = previewQuotationId
    ? (quotations.find((quotation) => quotation.id === previewQuotationId) ??
      null)
    : null;

  const openPreview = (quotation: Quotation) => {
    setPreviewQuotationId(quotation.id ?? null);
    setPreviewOpen(true);
  };

  useEffect(() => {
    const state = location.state as { previewQuotationId?: string } | null;
    if (
      autoOpenedRef.current ||
      !state?.previewQuotationId ||
      quotations.length === 0
    ) {
      return;
    }

    const match = quotations.find(
      (quotation) => quotation.id === state.previewQuotationId,
    );
    if (!match) return;

    autoOpenedRef.current = true;
    openPreview(match);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, quotations]);

  return (
    <div>
      <TopBar title="Quotations" />

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
              <div className="h-8 w-full animate-pulse rounded bg-zinc-200 sm:w-32 dark:bg-zinc-800" />
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          </Card>
        ) : quotations.length === 0 ? (
          <Card>
            <SalesEmptyState
              title="No quotations yet"
              description="Create your first quotation to save pricing details and download the document from here."
              href="/sales/quotation/new"
              actionLabel="Create First Quotation"
            />
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="gap-0 py-0">
              <div
                className="flex flex-col gap-3 border-b border-zinc-100 p-4
                  sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
              >
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Quotations
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {quotations.length} saved quotation
                    {quotations.length !== 1 && 's'}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
                >
                  <Link to="/sales/quotation/new" className="flex items-center">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    New Quotation
                  </Link>
                </Button>
              </div>

              <Table>
                <TableHeader className="hidden md:table-header-group">
                  <TableRow>
                    <TableHead>Quotation</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800 md:divide-y-0">
                  {quotations.map((quotation) => (
                    <QuotationRow
                      key={quotation.id}
                      quotation={quotation}
                      openPreview={openPreview}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        )}
      </div>

      <QuotationPreviewModal
        quotation={previewQuotation}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
