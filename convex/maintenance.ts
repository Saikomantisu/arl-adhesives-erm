import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { internalMutation, mutation, query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import { getById, LIFETIME_VALUE_REBUILD_TASK_NAME } from './lib';

const BATCH_SIZE = 50;

const getLifetimeValueJob = async (ctx: QueryCtx | MutationCtx) =>
  ctx.db
    .query('maintenanceJobs')
    .withIndex('by_task_name', (q) =>
      q.eq('taskName', LIFETIME_VALUE_REBUILD_TASK_NAME),
    )
    .unique();

const mapLifetimeValueJob = (job: Doc<'maintenanceJobs'> | null) => ({
  task_name: LIFETIME_VALUE_REBUILD_TASK_NAME,
  status: job?.status ?? 'idle',
  phase: job?.phase ?? 'idle',
  processed_customers: Number(job?.processedCustomers ?? 0),
  processed_invoices: Number(job?.processedInvoices ?? 0),
  error: job?.error ?? null,
  started_at: job?.startedAt ?? null,
  finished_at: job?.finishedAt ?? null,
  updated_at: job?.updatedAt ?? null,
});

export const getLifetimeValueRebuildStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    const job = await getLifetimeValueJob(ctx);
    return mapLifetimeValueJob(job);
  },
});

export const startLifetimeValueRebuild = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const existing = await getLifetimeValueJob(ctx);
    if (existing?.status === 'running') {
      return mapLifetimeValueJob(existing);
    }

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: 'running',
        phase: 'resetting_customers',
        cursor: null,
        processedCustomers: 0,
        processedInvoices: 0,
        error: null,
        startedAt: now,
        finishedAt: null,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('maintenanceJobs', {
        taskName: LIFETIME_VALUE_REBUILD_TASK_NAME,
        status: 'running',
        phase: 'resetting_customers',
        cursor: null,
        processedCustomers: 0,
        processedInvoices: 0,
        error: null,
        startedAt: now,
        finishedAt: null,
        updatedAt: now,
      });
    }

    await ctx.scheduler.runAfter(0, internal.maintenance.runLifetimeValueRebuildBatch, {});

    const job = await getLifetimeValueJob(ctx);
    return mapLifetimeValueJob(job);
  },
});

export const runLifetimeValueRebuildBatch = internalMutation({
  args: {},
  handler: async (ctx) => {
    const job = await getLifetimeValueJob(ctx);
    if (!job || job.status !== 'running') {
      return null;
    }

    try {
      const now = Date.now();

      if (job.phase === 'resetting_customers') {
        const page = await ctx.db
          .query('customers')
          .withIndex('by_email')
          .paginate({
            numItems: BATCH_SIZE,
            cursor: job.cursor ?? null,
          });

        for (const customer of page.page) {
          if (Number(customer.lifetimeValue ?? 0) === 0) continue;
          await ctx.db.patch(customer._id, {
            lifetimeValue: 0,
            updatedAt: now,
          });
        }

        await ctx.db.patch(job._id, {
          phase: page.isDone ? 'processing_invoices' : 'resetting_customers',
          cursor: page.isDone ? null : page.continueCursor,
          processedCustomers: Number(job.processedCustomers ?? 0) + page.page.length,
          updatedAt: now,
        });

        await ctx.scheduler.runAfter(
          0,
          internal.maintenance.runLifetimeValueRebuildBatch,
          {},
        );
        return null;
      }

      if (job.phase === 'processing_invoices') {
        const page = await ctx.db
          .query('invoices')
          .withIndex('by_created_at')
          .paginate({
            numItems: BATCH_SIZE,
            cursor: job.cursor ?? null,
          });

        const incrementByCustomerId = page.page.reduce<Record<string, number>>(
          (acc, invoice) => {
            const subtotal = Number(invoice.subtotal ?? 0);
            acc[invoice.customerId] = Number(acc[invoice.customerId] ?? 0) + subtotal;
            return acc;
          },
          {},
        );

        for (const [customerId, increment] of Object.entries(incrementByCustomerId)) {
          const customer = await getById(ctx, 'customers', customerId);
          if (!customer) continue;

          await ctx.db.patch(customer._id, {
            lifetimeValue: Number(customer.lifetimeValue ?? 0) + increment,
            updatedAt: now,
          });
        }

        await ctx.db.patch(job._id, {
          status: page.isDone ? 'completed' : 'running',
          phase: page.isDone ? 'completed' : 'processing_invoices',
          cursor: page.isDone ? null : page.continueCursor,
          processedInvoices: Number(job.processedInvoices ?? 0) + page.page.length,
          finishedAt: page.isDone ? now : null,
          updatedAt: now,
        });

        if (!page.isDone) {
          await ctx.scheduler.runAfter(
            0,
            internal.maintenance.runLifetimeValueRebuildBatch,
            {},
          );
        }
      }

      return null;
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'Lifetime value rebuild failed';

      await ctx.db.patch(job._id, {
        status: 'failed',
        phase: 'failed',
        error: detail,
        finishedAt: Date.now(),
        updatedAt: Date.now(),
      });

      return null;
    }
  },
});
