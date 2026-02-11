import { Card } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import { motion } from 'framer-motion';

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  index: number;
}

export function KpiCard({ label, value, icon: Icon, index }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
    >
      <Card className='group/card relative overflow-hidden rounded-2xl border-zinc-200 bg-white p-6 text-sm text-card-foreground ring-1 ring-foreground/10 transition-all hover:shadow-sm'>
        <div className='flex items-start justify-between'>
          <div>
            <p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>{label}</p>
            <p className='mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50'>
              {value}
            </p>
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900',
              'text-indigo-600 dark:text-indigo-400',
            )}
          >
            <Icon className='h-6 w-6' />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
