import { TopBar } from '~/components/layouts/top-bar';
import { KpiCard } from '~/components/shared/kpi-card';
import { StatusBadge } from '~/components/shared/status-badge';
import { Card } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { AlertCircle, Package, TrendingUp } from 'lucide-react';
import { formatCurrency } from '~/lib/data';
import { motion } from 'framer-motion';
import type { MetaFunction } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { convexApi } from '~/lib/convex';
import type { Customer, Invoice, Product } from '~/lib/data';

export const meta: MetaFunction = () => {
  return [{ title: 'Dashboard | ARL Adhesives' }];
};

function PaymentDueRow({ inv }: { inv: Invoice }) {
  const customerQuery = useQuery(
    convexQuery(
      convexApi.customers.get,
      inv.customer_id ? { customerId: inv.customer_id } : 'skip',
    ),
  );
  const customer = (customerQuery.data ?? null) as Customer | null;

  return (
    <div key={inv.id} className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center
            rounded-full bg-zinc-100 text-xs font-semibold
            text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {customer?.avatar}
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {customer?.company}
          </p>
          <p className="text-xs text-zinc-500">
            {inv.number} · Due{' '}
            {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCurrency(inv.total)}
          </p>
          <StatusBadge status={inv.status ?? 'pending'} />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const productsQuery = useQuery(convexQuery(convexApi.products.list, {}));
  const invoicesQuery = useQuery(convexQuery(convexApi.invoices.list, {}));
  const paymentsDueQuery = useQuery(
    convexQuery(convexApi.invoices.listDue, {}),
  );

  const products = (productsQuery.data ?? []) as Product[];
  const invoices = (invoicesQuery.data ?? []) as Invoice[];
  const paymentsDue = (paymentsDueQuery.data ?? []) as Invoice[];

  const error =
    productsQuery.error || invoicesQuery.error || paymentsDueQuery.error;
  const isLoading =
    productsQuery.isLoading ||
    invoicesQuery.isLoading ||
    paymentsDueQuery.isLoading;

  const monthlyRevenue = invoices.reduce((sum, i) => sum + i.total, 0);
  const outstanding = paymentsDue.reduce((sum, i) => sum + i.total, 0);
  const stockValue = products.reduce(
    (sum, p) =>
      sum + p.price_per_kg * p.package_weight_kg * p.current_stock_boxes,
    0,
  );

  const kpis = [
    {
      label: 'Monthly Revenue',
      value: isLoading || error ? '—' : formatCurrency(monthlyRevenue),
      icon: TrendingUp,
    },
    {
      label: 'Outstanding Payments',
      value: isLoading || error ? '—' : formatCurrency(outstanding),
      icon: AlertCircle,
    },
    {
      label: 'Stock Value',
      value: isLoading || error ? '—' : formatCurrency(stockValue),
      icon: Package,
    },
  ];

  const paymentsDueSummary = error
    ? '—'
    : isLoading
      ? 'Loading…'
      : `${paymentsDue.length} invoice${paymentsDue.length !== 1 ? 's' : ''} pending`;

  return (
    <div>
      <TopBar title="Dashboard" />

      <div className="space-y-6 p-4 sm:p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.label} {...kpi} index={i} />
          ))}
        </div>

        {/* Payments Due */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="gap-0 py-0">
            <div className="flex items-center justify-between p-5 pb-0">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Payments Due
                </h2>
                <p className="text-xs text-zinc-500">{paymentsDueSummary}</p>
              </div>
            </div>

            <Separator className="mt-4" />

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {paymentsDue.map((inv) => (
                <PaymentDueRow key={inv.id ?? inv.number} inv={inv} />
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
