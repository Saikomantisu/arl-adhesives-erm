import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';
import type { InvoiceStatus, CustomerStatus } from '~/lib/data';

const styles: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  active:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  pending:
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  overdue:
    'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  new: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
};

export function StatusBadge({ status }: { status: InvoiceStatus | CustomerStatus }) {
  return (
    <Badge variant='outline' className={cn('text-[11px] font-medium capitalize', styles[status])}>
      {status}
    </Badge>
  );
}
