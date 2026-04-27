import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { MetaFunction } from 'react-router';
import { TopBar } from '~/components/layouts/top-bar';
import { Button } from '~/components/ui/button';
import { convexApi, queryClient } from '~/lib/convex';
import type { MaintenanceJobStatus } from '~/lib/data';
import { Loader2, RefreshCw } from 'lucide-react';

export const meta: MetaFunction = () => {
  return [{ title: 'Settings | ARL Adhesives' }];
};

const phaseCopy: Record<MaintenanceJobStatus['phase'], string> = {
  idle: 'Waiting to start',
  resetting_customers: 'Resetting customers',
  processing_invoices: 'Rebuilding from invoices',
  completed: 'Repair finished',
  failed: 'Repair failed',
};

const formatTimestamp = (value: number | null) =>
  value ? new Date(value).toLocaleString() : '—';

export default function SettingsPage() {
  const [actionError, setActionError] = useState<string | null>(null);
  const statusQuery = useQuery({
    ...convexQuery(convexApi.maintenance.getLifetimeValueRebuildStatus, {}),
    refetchInterval: (query) =>
      (query.state.data as MaintenanceJobStatus | undefined)?.status === 'running'
        ? 1500
        : false,
  });
  const startRebuild = useConvexMutation(
    convexApi.maintenance.startLifetimeValueRebuild,
  );
  const status = (statusQuery.data ?? {
    task_name: 'customer_lifetime_value_rebuild',
    status: 'idle',
    phase: 'idle',
    processed_customers: 0,
    processed_invoices: 0,
    error: null,
    started_at: null,
    finished_at: null,
    updated_at: null,
  }) as MaintenanceJobStatus;
  const previousStatusRef = useRef(status.status);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    if (previousStatus === 'running' && status.status === 'completed') {
      void queryClient.invalidateQueries();
    }
    previousStatusRef.current = status.status;
  }, [status.status]);

  const handleStart = async () => {
    try {
      setActionError(null);
      await startRebuild({});
      await statusQuery.refetch();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Unable to start repair job.',
      );
    }
  };

  const isRunning = status.status === 'running';
  const err = status.error ?? actionError;
  const showStatus =
    isRunning || status.status === 'completed' || status.status === 'failed' || !!err;

  return (
    <div>
      <TopBar title="Settings" />

      <div className="p-4 sm:p-6">
        <div className="max-w-xl space-y-6">
          <div>
            <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
              Customer lifetime value
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Rebuild customer totals from stored invoices after a production sync.
              Invoice creation is paused while this runs.
            </p>
          </div>

          <Button
            onClick={handleStart}
            disabled={isRunning || statusQuery.isLoading}
            variant="outline"
            className="shadow-none"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh values
              </>
            )}
          </Button>

          {showStatus ? (
            <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              {isRunning ? (
                <p>
                  {phaseCopy[status.phase]} — {status.processed_customers} customers,{' '}
                  {status.processed_invoices} invoices
                </p>
              ) : null}
              {status.status === 'completed' && status.finished_at ? (
                <p>Last run finished {formatTimestamp(status.finished_at)}.</p>
              ) : null}
              {err ? (
                <p className="text-rose-600 dark:text-rose-400">{err}</p>
              ) : status.status === 'failed' ? (
                <p className="text-rose-600 dark:text-rose-400">{phaseCopy.failed}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
