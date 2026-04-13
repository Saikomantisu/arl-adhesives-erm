import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import {
  addOneMonthPreservingUtcDay,
  filterToMonth,
  formatInvoiceNumber,
  formatLkrCurrency,
  getById,
  mapInvoice,
  mapInvoiceItem,
  requireById,
  sortByCreatedAtDesc,
  takeNextSequence,
} from './lib';
import { activityTypeValidator, invoiceStatusValidator } from './model';

const invoiceItemInputValidator = v.object({
  product_id: v.string(),
  name: v.string(),
  quantity: v.number(),
  product_price: v.number(),
  total_weight_kg: v.number(),
  price_per_kg: v.number(),
  total_price: v.number(),
});

const createActivityRecord = async (
  ctx: MutationCtx,
  params: {
    customerId: Id<'customers'>;
    type:
      | 'invoice_generated'
      | 'invoice_paid'
      | 'invoice_pending'
      | 'invoice_overdue';
    description: string;
    refNumber?: string;
    timestamp: number;
  },
) => {
  await ctx.db.insert('activities', {
    customerId: params.customerId,
    type: params.type,
    description: params.description,
    refNumber: params.refNumber,
    timestamp: params.timestamp,
    updatedAt: params.timestamp,
  });
};

export const list = query({
  args: {
    monthTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const invoices = await ctx.db
      .query('invoices')
      .withIndex('by_created_at')
      .order('desc')
      .collect();
    return filterToMonth(invoices, args.monthTimestamp).map(mapInvoice);
  },
});

export const listDue = query({
  args: {
    monthTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const pending = await ctx.db
      .query('invoices')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect();
    const overdue = await ctx.db
      .query('invoices')
      .withIndex('by_status', (q) => q.eq('status', 'overdue'))
      .collect();

    return filterToMonth(
      sortByCreatedAtDesc([...pending, ...overdue]),
      args.monthTimestamp,
    ).map(mapInvoice);
  },
});

export const itemsByInvoice = query({
  args: {
    invoiceId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const invoice = await getById(ctx, 'invoices', args.invoiceId);
    if (!invoice) return [];

    const items = await ctx.db
      .query('invoiceItems')
      .withIndex('by_invoice_id', (q) => q.eq('invoiceId', invoice._id))
      .order('desc')
      .collect();

    return items.map(mapInvoiceItem);
  },
});

export const create = mutation({
  args: {
    invoice: v.object({
      customer_id: v.string(),
      subtotal: v.number(),
      tax: v.number(),
      total: v.number(),
      po_number: v.string(),
    }),
    invoiceItems: v.array(invoiceItemInputValidator),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    if (args.invoiceItems.length === 0) {
      throw new Error('At least one invoice item is required');
    }

    const customer = await requireById(
      ctx,
      'customers',
      args.invoice.customer_id,
      `Customer ${args.invoice.customer_id} not found`,
    );

    const resolvedItems = await Promise.all(
      args.invoiceItems.map(async (item) => {
        const product = await requireById(
          ctx,
          'products',
          item.product_id,
          `Product ${item.product_id} not found`,
        );

        const remainingStock =
          Number(product.currentStockBoxes ?? 0) - Number(item.quantity ?? 0);
        if (remainingStock < 0) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        return { item, product, remainingStock };
      }),
    );

    const timestamp = Date.now();
    const year = new Date(timestamp).getUTCFullYear();
    const sequence = await takeNextSequence(ctx, 'invoice', year);
    const number = formatInvoiceNumber(timestamp, sequence);

    const existingInvoice = await ctx.db
      .query('invoices')
      .withIndex('by_number', (q) => q.eq('number', number))
      .unique();
    if (existingInvoice) {
      throw new Error(`Invoice number ${number} already exists`);
    }

    const invoiceId = await ctx.db.insert('invoices', {
      number,
      numberYear: year,
      numberMonth: new Date(timestamp).getUTCMonth() + 1,
      numberSequence: sequence,
      numberingVersion: 'yearly_continuous',
      customerId: customer._id,
      status: 'pending',
      createdAt: timestamp,
      dueDate: addOneMonthPreservingUtcDay(timestamp),
      subtotal: args.invoice.subtotal,
      tax: args.invoice.tax,
      total: args.invoice.total,
      poNumber: args.invoice.po_number,
    });

    for (const resolved of resolvedItems) {
      await ctx.db.insert('invoiceItems', {
        invoiceId,
        productId: resolved.product._id,
        name: resolved.item.name,
        quantity: resolved.item.quantity,
        productPrice: resolved.item.product_price,
        totalWeightKg: resolved.item.total_weight_kg,
        pricePerKg: resolved.item.price_per_kg,
        totalPrice: resolved.item.total_price,
        createdAt: timestamp,
      });

      await ctx.db.patch(resolved.product._id, {
        currentStockBoxes: resolved.remainingStock,
        updatedAt: timestamp,
      });
    }

    await createActivityRecord(ctx, {
      customerId: customer._id,
      type: 'invoice_generated',
      description: `Invoice ${number} generated for PO ${args.invoice.po_number} (total ${formatLkrCurrency(args.invoice.total)}).`,
      refNumber: number,
      timestamp,
    });

    const invoice = await ctx.db.get(invoiceId);
    if (!invoice) throw new Error('Invoice creation returned no data');
    return mapInvoice(invoice);
  },
});

export const updateStatus = mutation({
  args: {
    invoiceId: v.string(),
    status: invoiceStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const invoice = await requireById(
      ctx,
      'invoices',
      args.invoiceId,
      `Invoice ${args.invoiceId} not found`,
    );

    await ctx.db.patch(invoice._id, {
      status: args.status,
    });

    const activityMap: Record<
      'paid' | 'pending' | 'overdue',
      {
        type: 'invoice_paid' | 'invoice_pending' | 'invoice_overdue';
        description: string;
      }
    > = {
      pending: {
        type: 'invoice_pending',
        description: 'Invoice marked as pending',
      },
      paid: { type: 'invoice_paid', description: 'Invoice marked as paid' },
      overdue: {
        type: 'invoice_overdue',
        description: 'Invoice marked as overdue',
      },
    };

    await createActivityRecord(ctx, {
      customerId: invoice.customerId,
      type: activityMap[args.status].type,
      description: activityMap[args.status].description,
      refNumber: invoice.number,
      timestamp: Date.now(),
    });

    const updated = await ctx.db.get(invoice._id);
    if (!updated) throw new Error('Status update returned no data');
    return mapInvoice(updated);
  },
});
