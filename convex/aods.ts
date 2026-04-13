import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import { formatAodNumber, getById, mapAod, takeNextSequence } from './lib';

const createActivityRecord = async (
  ctx: MutationCtx,
  params: {
    customerId: Id<'customers'>;
    description: string;
    refNumber: string;
    timestamp: number;
  },
) => {
  await ctx.db.insert('activities', {
    customerId: params.customerId,
    type: 'aod_generated',
    description: params.description,
    refNumber: params.refNumber,
    timestamp: params.timestamp,
    updatedAt: params.timestamp,
  });
};

export const getByInvoice = query({
  args: {
    invoiceId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const invoice = await getById(ctx, 'invoices', args.invoiceId);
    if (!invoice) return null;

    const aod = await ctx.db
      .query('aods')
      .withIndex('by_invoice_id', (q) => q.eq('invoiceId', invoice._id))
      .unique();

    return aod ? mapAod(aod) : null;
  },
});

export const createForInvoice = mutation({
  args: {
    invoiceId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const invoice = await getById(ctx, 'invoices', args.invoiceId);
    if (!invoice) throw new Error(`Invoice ${args.invoiceId} not found`);

    const existing = await ctx.db
      .query('aods')
      .withIndex('by_invoice_id', (q) => q.eq('invoiceId', invoice._id))
      .unique();
    if (existing) return mapAod(existing);

    const timestamp = Date.now();
    const year = new Date(timestamp).getUTCFullYear();
    const sequence = await takeNextSequence(ctx, 'aod', year);
    const aodNumber = formatAodNumber(timestamp, sequence);

    const conflicting = await ctx.db
      .query('aods')
      .withIndex('by_aod_number', (q) => q.eq('aodNumber', aodNumber))
      .unique();
    if (conflicting) {
      throw new Error(`AOD number ${aodNumber} already exists`);
    }

    const aodId = await ctx.db.insert('aods', {
      invoiceId: invoice._id,
      aodNumber,
      numberYear: year,
      numberMonth: new Date(timestamp).getUTCMonth() + 1,
      numberSequence: sequence,
      numberingVersion: 'yearly_continuous',
      printedAt: timestamp,
      poNumber: invoice.poNumber ?? undefined,
      invoiceNumber: invoice.number,
      createdAt: timestamp,
    });

    await createActivityRecord(ctx, {
      customerId: invoice.customerId,
      description: `AOD generated for invoice ${invoice.number}`,
      refNumber: aodNumber,
      timestamp,
    });

    const aod = await ctx.db.get(aodId);
    if (!aod) throw new Error('AOD creation returned no data');
    return mapAod(aod);
  },
});
