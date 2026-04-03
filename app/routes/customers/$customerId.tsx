import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  Send,
  ClipboardCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { cn } from '~/lib/utils';
import { motion } from 'framer-motion';
import { convexQuery } from '@convex-dev/react-query';
import type { Activity, Customer } from '~/lib/data';
import { Card } from '~/components/ui/card';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, timeAgo } from '~/lib/data';
import { TopBar } from '~/components/layouts/top-bar';
import { Separator } from '~/components/ui/separator';
import { StatusBadge } from '~/components/shared/status-badge';
import { convexApi } from '~/lib/convex';

const activityIcons: Record<Activity['type'], React.ElementType> = {
  invoice_generated: Send,
  invoice_paid: CheckCircle2,
  quotation_generated: FileText,
  aod_signed: ClipboardCheck,
  aod_generated: FileText,
  invoice_overdue: AlertCircle,
  invoice_pending: Clock,
};

const activityColors: Record<Activity['type'], string> = {
  invoice_generated:
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  invoice_paid:
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  quotation_generated:
    'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  aod_signed: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  aod_generated:
    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  invoice_overdue:
    'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
  invoice_pending:
    'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
};

const activityLabels: Record<Activity['type'], string> = {
  invoice_generated: 'Invoice Generated',
  quotation_generated: 'Quotation Generated',
  aod_generated: 'AOD Generated',
  aod_signed: 'AOD Signed',
  invoice_paid: 'Invoice Paid',
  invoice_overdue: 'Invoice Overdue',
  invoice_pending: 'Invoice Pending',
};

export default function CustomerPulsePage() {
  const { customerId } = useParams();

  const customerQuery = useQuery(
    convexQuery(convexApi.customers.get, customerId ? { customerId } : 'skip'),
  );
  const customer = (customerQuery.data ?? null) as Customer | null;

  const activitiesQuery = useQuery(
    convexQuery(
      convexApi.activities.listByCustomer,
      customerId ? { customerId } : 'skip',
    ),
  );
  const activities = (activitiesQuery.data ?? []) as Activity[];
  const activitiesLoading = activitiesQuery.isLoading;
  const activitiesIsError = activitiesQuery.isError;

  if (!customer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-zinc-500">Customer not found</p>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Customer Pulse" />

      <div className="p-4 sm:p-6">
        {/* Back Link */}
        <Link
          to="/customers"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Customers
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Customer Info */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center
                    rounded-full bg-indigo-100 text-lg font-bold
                    text-indigo-700 dark:bg-indigo-900
                    dark:text-indigo-300"
                >
                  {customer?.avatar}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {customer?.company}
                  </h2>
                </div>
              </div>

              <div className="">
                <StatusBadge status={customer.status} />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {customer.email}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {customer.phone}
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <span className="min-w-0 flex-1 wrap-break-word text-zinc-700 dark:text-zinc-300">
                    {customer.address}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    Tax Registration
                  </p>
                  <p className="mt-1 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                    {customer.vat_reg_no}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    Total Lifetime Value
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(customer.lifetime_value)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Column: Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Activity Feed
              </h3>
              <p className="text-xs text-zinc-500">
                Recent interactions with {customer.company}
              </p>

              <div className="mt-6 space-y-0">
                {activitiesIsError ? (
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    Unable to load activities.
                  </p>
                ) : activitiesLoading ? (
                  <p className="text-sm text-zinc-500">Loading activities…</p>
                ) : activities.length === 0 ? (
                  <p className="text-sm text-zinc-500">No activity yet.</p>
                ) : (
                  activities.map((activity, idx) => {
                    const Icon = activityIcons[activity.type] ?? FileText;
                    const colorClass = activityColors[activity.type];
                    const isLast = idx === activities.length - 1;

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="relative flex gap-4 pb-6"
                      >
                        {/* Timeline line */}
                        {!isLast && (
                          <div
                            className="absolute left-[17px] top-10 h-[calc(100%-24px)]
                            w-px bg-zinc-200 dark:bg-zinc-700"
                          />
                        )}

                        {/* Icon */}
                        <div
                          className={cn(
                            'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                            colorClass,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-500">
                              {activityLabels[activity.type]}
                            </span>
                            <span className="text-xs text-zinc-400">
                              · {timeAgo(activity.timestamp)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">
                            {activity.description}
                          </p>
                          {activity.ref_number && (
                            <span
                              className="mt-1 inline-block rounded bg-zinc-100
                              px-1.5 py-0.5 font-mono text-xs text-zinc-500
                              dark:bg-zinc-800 dark:text-zinc-400"
                            >
                              {activity.ref_number}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
