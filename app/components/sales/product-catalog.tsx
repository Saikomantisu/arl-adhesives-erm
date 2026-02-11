import { cn } from '~/lib/utils';
import { useState } from 'react';
import { formatCurrency, type Product } from '~/lib/data';
import { Card } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useSaleStore } from '~/store/sales-store';
import { Search, Plus, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProducts } from '~/services/product-service';

export function ProductCatalog() {
  const [search, setSearch] = useState('');
  const addItem = useSaleStore((s) => s.addItem);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = (product: Product) => {
    if (product.current_stock_boxes === 0) return;

    const product_price = product.price_per_kg * product.package_weight_kg;

    addItem({
      product_id: product.id!,
      name: product.name,
      quantity: 1,
      product_price,
      total_price: product_price,
      total_weight_kg: product.package_weight_kg,
      price_per_kg: product.price_per_kg,
    });
  };

  return (
    <div className='p-6'>
      <div className='mb-4'>
        <h2 className='text-sm font-semibold text-zinc-900 dark:text-zinc-50'>Product Catalog</h2>
        <p className='text-xs text-zinc-500'>Click a product to add it to the invoice draft</p>
      </div>

      <div className='relative mb-4'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
        <Input
          placeholder='Search products…'
          className='pl-9'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        <AnimatePresence mode='popLayout'>
          {filtered.map((product) => {
            const isOutOfStock = product.current_stock_boxes === 0;
            const isLow = product.current_stock_boxes <= product.threshold && !isOutOfStock;

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  className={cn(
                    'group cursor-pointer p-4 transition-all',
                    isOutOfStock
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-700',
                  )}
                  onClick={() => handleAdd(product)}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3'>
                      <div
                        className='flex h-10 w-10 shrink-0 items-center
                          justify-center rounded-lg bg-zinc-100
                          dark:bg-zinc-800'
                      >
                        <Package className='h-5 w-5 text-zinc-400' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-zinc-900 dark:text-zinc-50'>
                          {product.name}
                        </p>
                        <p className='text-xs text-zinc-500'>{product.sku}</p>
                      </div>
                    </div>

                    <div
                      className='flex h-7 w-7 items-center justify-center
                        rounded-md bg-indigo-50 opacity-0 transition-opacity
                        group-hover:opacity-100 dark:bg-indigo-950'
                    >
                      <Plus className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                    </div>
                  </div>

                  <div className='mt-3 flex items-center justify-between'>
                    <span className='text-sm font-semibold text-zinc-900 dark:text-zinc-50'>
                      {formatCurrency(product.price_per_kg * product.package_weight_kg)}
                    </span>
                    <div className='flex items-center gap-2'>
                      {isOutOfStock ? (
                        <Badge
                          variant='outline'
                          className='border-rose-200 bg-rose-50 text-[10px]
                            text-rose-600 dark:border-rose-800
                            dark:bg-rose-950 dark:text-rose-400'
                        >
                          Out of Stock
                        </Badge>
                      ) : isLow ? (
                        <Badge
                          variant='outline'
                          className='border-amber-200 bg-amber-50 text-[10px]
                            text-amber-600 dark:border-amber-800
                            dark:bg-amber-950 dark:text-amber-400'
                        >
                          {product.current_stock_boxes} left
                        </Badge>
                      ) : (
                        <Badge
                          variant='outline'
                          className='border-emerald-200 bg-emerald-50 text-[10px]
                            text-emerald-600 dark:border-emerald-800
                            dark:bg-emerald-950 dark:text-emerald-400'
                        >
                          {product.current_stock_boxes} boxes in stock
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
