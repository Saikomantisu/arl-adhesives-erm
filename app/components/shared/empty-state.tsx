import { FileText, Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Link } from 'react-router';
import { motion } from 'framer-motion';

export function SalesEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl
          bg-zinc-100 dark:bg-zinc-800"
      >
        <FileText className="h-8 w-8 text-zinc-400" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        No invoices yet
      </h3>
      <p className="mt-1.5 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
        Create your first sale to generate an invoice. Track payments, send
        reminders, and preview documents — all from here.
      </p>
      <Link to="/sales/new">
        <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Create First Sale
        </Button>
      </Link>
    </motion.div>
  );
}
