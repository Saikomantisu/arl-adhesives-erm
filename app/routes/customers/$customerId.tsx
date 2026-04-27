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
  Loader2,
  Tag,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ElementType } from 'react';
import { cn } from '~/lib/utils';
import { motion } from 'framer-motion';
import {
  convexQuery,
  useConvexMutation,
} from '@convex-dev/react-query';
import type {
  Activity,
  Customer,
  CustomerProductPrice,
  Product,
} from '~/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, timeAgo } from '~/lib/data';
import { TopBar } from '~/components/layouts/top-bar';
import { Separator } from '~/components/ui/separator';
import { StatusBadge } from '~/components/shared/status-badge';
import { convexApi } from '~/lib/convex';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';

const activityIcons: Record<Activity['type'], ElementType> = {
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

function CustomerPricingCard({
  customerId,
}: {
  customerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  const productsQuery = useQuery(convexQuery(convexApi.products.list, {}));
  const overridesQuery = useQuery(
    convexQuery(convexApi.customerProductPrices.listByCustomer, {
      customerId,
    }),
  );
  const saveOverride = useConvexMutation(convexApi.customerProductPrices.upsert);
  const removeOverride = useConvexMutation(
    convexApi.customerProductPrices.remove,
  );

  const products = (productsQuery.data ?? []) as Product[];
  const overrides = (overridesQuery.data ?? []) as CustomerProductPrice[];

  const overridesByProductId = useMemo(
    () =>
      overrides.reduce<Record<string, CustomerProductPrice>>((acc, override) => {
        acc[override.product_id] = override;
        return acc;
      }, {}),
    [overrides],
  );

  useEffect(() => {
    if (!open) return;

    setDraftValues(
      overrides.reduce<Record<string, string>>((acc, override) => {
        acc[override.product_id] = String(override.price_per_kg);
        return acc;
      }, {}),
    );
    setRowErrors({});
  }, [open, overrides]);

  const filteredProducts = products.filter((product) => {
    const value = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(value) ||
      product.sku.toLowerCase().includes(value)
    );
  });

  const handleInputChange = (productId: string, value: string) => {
    setDraftValues((current) => ({
      ...current,
      [productId]: value,
    }));
    setRowErrors((current) => {
      if (!current[productId]) return current;
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const handleSave = async (productId: string) => {
    const rawValue = draftValues[productId]?.trim() ?? '';
    const nextPrice = Number(rawValue);

    if (!rawValue) {
      setRowErrors((current) => ({
        ...current,
        [productId]: 'Enter a price or use Clear to remove the override.',
      }));
      return;
    }

    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      setRowErrors((current) => ({
        ...current,
        [productId]: 'Price per kg must be greater than 0.',
      }));
      return;
    }

    try {
      setPendingProductId(productId);
      await saveOverride({
        customerId,
        productId,
        pricePerKg: nextPrice,
      });
    } catch (error) {
      setRowErrors((current) => ({
        ...current,
        [productId]:
          error instanceof Error ? error.message : 'Unable to save override.',
      }));
    } finally {
      setPendingProductId(null);
    }
  };

  const handleClear = async (productId: string) => {
    const existing = overridesByProductId[productId];

    if (!existing) {
      setDraftValues((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      setRowErrors((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      return;
    }

    try {
      setPendingProductId(productId);
      await removeOverride({
        customerId,
        productId,
      });
      setDraftValues((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
    } catch (error) {
      setRowErrors((current) => ({
        ...current,
        [productId]:
          error instanceof Error ? error.message : 'Unable to clear override.',
      }));
    } finally {
      setPendingProductId(null);
    }
  };

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="border-b border-zinc-100 py-5 dark:border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Customer Pricing</CardTitle>
            <CardDescription>
              {overridesQuery.isLoading
                ? 'Loading custom prices…'
                : `${overrides.length} custom price${overrides.length === 1 ? '' : 's'}`}
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={<Button variant="outline" size="sm" />}
            >
              Manage Prices
            </DialogTrigger>
            <DialogContent className="grid !w-[calc(100vw-2rem)] !max-w-[96rem] gap-0 overflow-hidden p-0 sm:!w-[96vw]">
              <DialogHeader className="border-b border-zinc-100 px-6 py-5 pr-16 dark:border-zinc-800">
                <DialogTitle>Manage Customer Pricing</DialogTitle>
                <DialogDescription>
                  Default product pricing applies unless this customer has an override.
                </DialogDescription>
              </DialogHeader>

              <div className="flex min-h-0 flex-col gap-4 p-6">
                <div className="shrink-0">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products or SKU…"
                  />
                </div>

                {productsQuery.isLoading || overridesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading pricing…
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-white dark:bg-zinc-950">
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Default / kg</TableHead>
                          <TableHead className="min-w-40">
                            Override / kg
                          </TableHead>
                          <TableHead className="min-w-32">
                            Effective Unit
                          </TableHead>
                          <TableHead className="min-w-24">Status</TableHead>
                          <TableHead className="min-w-40 text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => {
                          const existingOverride = product.id
                            ? overridesByProductId[product.id]
                            : undefined;
                          const productId = product.id!;
                          const rowValue =
                            draftValues[productId] ??
                            (existingOverride
                              ? String(existingOverride.price_per_kg)
                              : '');
                          const draftPrice = Number(rowValue);
                          const effectivePricePerKg =
                            rowValue.trim() !== '' && Number.isFinite(draftPrice)
                              ? draftPrice
                              : existingOverride?.price_per_kg ??
                                product.default_price_per_kg ??
                                product.price_per_kg;
                          const effectiveUnitPrice =
                            effectivePricePerKg * product.package_weight_kg;
                          const isPending = pendingProductId === productId;

                          return (
                            <TableRow key={productId}>
                              <TableCell>
                                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                                  {product.name}
                                </div>
                                {rowErrors[productId] ? (
                                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                    {rowErrors[productId]}
                                  </p>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-zinc-500">
                                {product.sku}
                              </TableCell>
                              <TableCell className="text-zinc-500">
                                {product.package_weight_kg} kg
                              </TableCell>
                              <TableCell>
                                {formatCurrency(
                                  product.default_price_per_kg ??
                                    product.price_per_kg,
                                )}
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={rowValue}
                                  onChange={(e) =>
                                    handleInputChange(productId, e.target.value)
                                  }
                                  placeholder="Override price/kg"
                                  className="h-9 min-w-32"
                                  inputMode="decimal"
                                />
                              </TableCell>
                              <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
                                {formatCurrency(effectiveUnitPrice)}
                              </TableCell>
                              <TableCell>
                                {existingOverride ? (
                                  <Badge
                                    variant="outline"
                                    className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
                                  >
                                    Custom
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Default</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleClear(productId)}
                                    disabled={isPending}
                                  >
                                    {isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Clear'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSave(productId)}
                                    disabled={isPending}
                                  >
                                    {isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Save'
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredProducts.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="py-10 text-center text-sm text-zinc-500"
                            >
                              No products match that search.
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="flex items-start gap-3 px-6 py-5">
        {overrides.length === 0 ? (
          <>
            <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">
              <Tag className="h-4 w-4 text-zinc-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">
                No custom prices yet.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Add a custom price for this customer when needed.
              </p>
            </div>
          </>
        ) : (
          <div className="w-full space-y-3">
            {overrides.slice(0, 4).map((override) => (
              <div
                key={override.product_id}
                className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {override.name}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {override.sku} · {override.package_weight_kg} kg
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(override.price_per_kg)} / kg
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Unit {formatCurrency(override.effective_product_price)}
                  </p>
                </div>
              </div>
            ))}
            {overrides.length > 4 ? (
              <p className="text-xs text-zinc-500">
                +{overrides.length - 4} more custom prices
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CustomerPulsePage() {
  const { customerId } = useParams();

  const customerQuery = useQuery(
    convexQuery(convexApi.customers.get, customerId ? { customerId } : 'skip'),
  );
  const customer = (customerQuery.data ?? null) as Customer | null;
  const customerLoading = customerId ? customerQuery.isLoading : false;
  const customerError = customerQuery.error;

  const activitiesQuery = useQuery(
    convexQuery(
      convexApi.activities.listByCustomer,
      customerId ? { customerId } : 'skip',
    ),
  );
  const activities = (activitiesQuery.data ?? []) as Activity[];
  const activitiesLoading = activitiesQuery.isLoading;
  const activitiesIsError = activitiesQuery.isError;

  if (customerLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-zinc-500">Loading customer…</p>
      </div>
    );
  }

  if (customerError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-zinc-500">Unable to load customer.</p>
      </div>
    );
  }

  if (!customerId || !customer) {
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
        <Link
          to="/customers"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Customers
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 lg:col-span-1"
          >
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center
                    rounded-full bg-indigo-100 text-lg font-bold
                    text-indigo-700 dark:bg-indigo-900
                    dark:text-indigo-300"
                >
                  {customer.avatar}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {customer.company}
                  </h2>
                </div>
              </div>

              <div>
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
                  <span className="min-w-0 flex-1 break-words text-zinc-700 dark:text-zinc-300">
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

            <CustomerPricingCard customerId={customerId} />
          </motion.div>

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
                        {!isLast && (
                          <div
                            className="absolute left-[17px] top-10 h-[calc(100%-24px)]
                            w-px bg-zinc-200 dark:bg-zinc-700"
                          />
                        )}

                        <div
                          className={cn(
                            'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                            colorClass,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

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
