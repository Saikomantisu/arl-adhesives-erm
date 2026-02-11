import { motion } from 'framer-motion';
import type { MetaFunction } from 'react-router';
import { TopBar } from '~/components/layouts/top-bar';
import { InvoiceDraft } from '~/components/sales/invoice-draft';
import { ProductCatalog } from '~/components/sales/product-catalog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

export const meta: MetaFunction = () => {
  return [{ title: 'New Sale | ARL Adhesives' }];
};

export default function NewSalePage() {
  return (
    <div>
      <TopBar title='New Sale' />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className='h-[calc(100vh-3.5rem)]'
      >
        {/* Mobile: Tabs */}
        <div className='md:hidden h-full'>
          <Tabs defaultValue='catalog' className='h-full flex flex-col'>
            <div className='border-b border-zinc-200 bg-white/80 px-3 py-2 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80'>
              <TabsList className='w-full'>
                <TabsTrigger value='catalog'>Catalog</TabsTrigger>
                <TabsTrigger value='draft'>Draft</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value='catalog' className='overflow-y-auto'>
              <ProductCatalog />
            </TabsContent>
            <TabsContent value='draft' className='overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50'>
              <InvoiceDraft />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: Split pane */}
        <div className='hidden md:grid h-full grid-cols-5 divide-x divide-zinc-200 dark:divide-zinc-800'>
          {/* Left: Product Catalog — 3 cols */}
          <div className='col-span-3 overflow-y-auto'>
            <ProductCatalog />
          </div>

          {/* Right: Invoice Draft — 2 cols */}
          <div className='col-span-2 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50'>
            <InvoiceDraft />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
