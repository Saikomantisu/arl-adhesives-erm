import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { cn } from '~/lib/utils';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '~/components/ui/card';
import { formatCurrency } from '~/lib/data';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { type MetaFunction } from 'react-router';
import type { Product } from '~/lib/data';
import { Search, AlertTriangle } from 'lucide-react';
import { TopBar } from '~/components/layouts/top-bar';
import { convexApi } from '~/lib/convex';
import { Sparkline } from '~/components/shared/sparkline';

export const meta: MetaFunction = () => {
  return [{ title: 'All Products | ARL Adhesives' }];
};

export default function InventoryPage() {
  const [search, setSearch] = useState('');

  const productsQuery = useQuery(convexQuery(convexApi.products.list, {}));
  const products = (productsQuery.data ?? []) as Product[];
  const { isLoading, isFetching, error } = productsQuery;

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  return (
    <div>
      <TopBar title="Inventory" />

      <div className="p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="gap-0 py-0">
            {(isLoading || isFetching || error) && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 text-sm dark:border-zinc-800">
                <div className="text-zinc-500 dark:text-zinc-400">
                  {error
                    ? `Failed to load products: ${error.message}`
                    : isLoading
                      ? 'Loading…'
                      : ''}
                </div>
                {isFetching && !error && (
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    Syncing…
                  </span>
                )}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 p-4 dark:border-zinc-800">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Search products or SKU…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {!isLoading && !error && filtered.length === 0 && (
                <div className="py-10 text-center text-sm text-zinc-500">
                  No products found.
                </div>
              )}

              {filtered.map((product) => {
                const isUrgent =
                  product.current_stock_boxes <= product.threshold;
                const isOutOfStock = product.current_stock_boxes === 0;

                return (
                  <div
                    key={product.id}
                    className={cn('p-4', isUrgent && 'animate-urgent-pulse')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {product.name}
                        </p>
                        <p className="mt-1 font-mono text-xs text-zinc-500">
                          {product.sku}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {formatCurrency(
                            product.price_per_kg * product.package_weight_kg,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Stock:{' '}
                          <span
                            className={cn(
                              'font-semibold',
                              isOutOfStock
                                ? 'text-rose-600'
                                : isUrgent
                                  ? 'text-amber-600'
                                  : 'text-zinc-900 dark:text-zinc-50',
                            )}
                          >
                            {product.current_stock_boxes}
                          </span>
                          <span className="text-zinc-400">
                            {' '}
                            / {product.threshold} min
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      {isOutOfStock ? (
                        <Badge
                          variant="outline"
                          className="border-rose-200 bg-rose-100 text-rose-700
                            dark:border-rose-800 dark:bg-rose-950
                            dark:text-rose-400"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Out of Stock
                        </Badge>
                      ) : isUrgent ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-100 text-amber-700
                            dark:border-amber-800 dark:bg-amber-950
                            dark:text-amber-400"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-100 text-emerald-700
                            dark:border-emerald-800 dark:bg-emerald-950
                            dark:text-emerald-400"
                        >
                          In Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Velocity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && !error && filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-zinc-500"
                      >
                        No products found.
                      </TableCell>
                    </TableRow>
                  )}

                  {filtered.map((product) => {
                    const isUrgent =
                      product.current_stock_boxes <= product.threshold;
                    const isOutOfStock = product.current_stock_boxes === 0;

                    return (
                      <TableRow
                        key={product.id}
                        className={cn(isUrgent && 'animate-urgent-pulse')}
                      >
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              {product.name}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-mono text-xs text-zinc-500">
                            {product.sku}
                          </span>
                        </TableCell>

                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(
                            product.price_per_kg * product.package_weight_kg,
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <span
                            className={cn(
                              'text-sm font-semibold',
                              isOutOfStock
                                ? 'text-rose-600'
                                : isUrgent
                                  ? 'text-amber-600'
                                  : 'text-zinc-900 dark:text-zinc-50',
                            )}
                          >
                            {product.current_stock_boxes}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {' '}
                            / {product.threshold} min
                          </span>
                        </TableCell>

                        <TableCell>
                          {isOutOfStock ? (
                            <Badge
                              variant="outline"
                              className="border-rose-200 bg-rose-100 text-rose-700
                                dark:border-rose-800 dark:bg-rose-950
                                dark:text-rose-400"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Out of Stock
                            </Badge>
                          ) : isUrgent ? (
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-100 text-amber-700
                                dark:border-amber-800 dark:bg-amber-950
                                dark:text-amber-400"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-100 text-emerald-700
                                dark:border-emerald-800 dark:bg-emerald-950
                                dark:text-emerald-400"
                            >
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Sparkline data={product.stock_velocity} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
