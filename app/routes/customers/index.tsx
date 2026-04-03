import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { motion } from 'framer-motion';
import { AlertTriangle, ExternalLink, Loader2, Users } from 'lucide-react';
import { Card } from '~/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { Link, type MetaFunction } from 'react-router';
import { formatCurrency, type Customer } from '~/lib/data';
import { TopBar } from '~/components/layouts/top-bar';
import { convexApi } from '~/lib/convex';
import { StatusBadge } from '~/components/shared/status-badge';
import { Button } from '~/components/ui/button';

export const meta: MetaFunction = () => {
  return [{ title: 'Customers | ARL Adhesives' }];
};

export default function CustomersIndexPage() {
  const customersQuery = useQuery(convexQuery(convexApi.customers.list, {}));
  const customers = (customersQuery.data ?? []) as Customer[];
  const { isLoading, isFetching, error, refetch } = customersQuery;

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'Something went wrong while loading customers.';

  return (
    <div>
      <TopBar title="Customers" />

      <div className="p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="gap-0 py-0">
            <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                All Customers
              </h2>
              <p className="text-xs text-zinc-500">
                {isLoading
                  ? 'Loading customers…'
                  : `${customers.length} customers`}
                {isFetching && !isLoading ? (
                  <span className="ml-2 inline-flex items-center gap-1 text-zinc-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Updating…
                  </span>
                ) : null}
              </p>
            </div>

            {error ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  <AlertTriangle className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Couldn’t load customers
                </h3>
                <p className="mt-1.5 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                  {errorMessage}
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrying…
                    </>
                  ) : (
                    'Try again'
                  )}
                </Button>
              </div>
            ) : isLoading ? (
              <>
                {/* Mobile skeleton */}
                <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-4 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
                            <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
                          </div>
                        </div>
                        <div className="mt-1 h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-5 w-32 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop skeleton */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">
                          Lifetime Value
                        </TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i} className="animate-pulse">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                              <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="ml-auto h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                          </TableCell>
                          <TableCell>
                            <div className="ml-auto h-8 w-8 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  <Users className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  No customers yet
                </h3>
                <p className="mt-1.5 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                  When you add customers, they’ll show up here.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                  {customers.map((c) => (
                    <Link
                      key={c.id}
                      to={`/customers/${c.id}`}
                      className="block p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center
                                rounded-full bg-zinc-100 text-xs font-semibold
                                text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              {c.avatar}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                {c.company}
                              </p>
                              <p className="truncate text-xs text-zinc-500">
                                {c.email}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <StatusBadge status={c.status} />
                            <span className="text-xs text-zinc-500">
                              Lifetime: {formatCurrency(c.lifetime_value)}
                            </span>
                          </div>
                        </div>

                        <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">
                          Lifetime Value
                        </TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-8 w-8 items-center justify-center
                                  rounded-full bg-zinc-100 text-xs font-semibold
                                  text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                              >
                                {c.avatar}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                  {c.company}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                            {c.email}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {formatCurrency(c.lifetime_value)}
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/customers/${c.id}`}
                              className="flex h-8 w-8 items-center justify-center
                                rounded-md text-zinc-400 transition-colors
                                hover:bg-zinc-100 hover:text-zinc-700
                                dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
