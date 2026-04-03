import { motion } from 'framer-motion';
import type { MetaFunction } from 'react-router';
import { TopBar } from '~/components/layouts/top-bar';
import { QuotationDraft } from '~/components/sales/quotation-draft';
import { ProductCatalog } from '~/components/sales/product-catalog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { useQuotationStore } from '~/store/quotation-store';

export const meta: MetaFunction = () => {
  return [{ title: 'New Quotation | ARL Adhesives' }];
};

export default function NewQuotationPage() {
  return (
    <div>
      <TopBar title="New Quotation" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="h-[calc(100vh-3.5rem)]"
      >
        <div className="md:hidden h-full">
          <Tabs defaultValue="catalog" className="h-full flex flex-col">
            <div className="border-b border-zinc-200 bg-white/80 px-3 py-2 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
              <TabsList className="w-full">
                <TabsTrigger value="catalog">Catalog</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="catalog" className="overflow-y-auto">
              <ProductCatalog
                useDraftStore={useQuotationStore}
                documentLabel="Quotation"
                allowOutOfStockSelection
              />
            </TabsContent>
            <TabsContent
              value="draft"
              className="overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50"
            >
              <QuotationDraft />
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden md:grid h-full grid-cols-5 divide-x divide-zinc-200 dark:divide-zinc-800">
          <div className="col-span-3 overflow-y-auto">
            <ProductCatalog
              useDraftStore={useQuotationStore}
              documentLabel="Quotation"
              allowOutOfStockSelection
            />
          </div>

          <div className="col-span-2 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50">
            <QuotationDraft />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
