import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import {
  addOneMonthPreservingUtcDay,
  computeSalesTotals,
  filterToMonth,
  formatInvoiceNumber,
  formatLkrCurrency,
  getById,
  LIFETIME_VALUE_REBUILD_TASK_NAME,
  mapInvoice,
  mapInvoiceItem,
  requireById,
  resolveEffectivePricePerKg,
  sortByCreatedAtDesc,
  takeNextSequence,
} from './lib';
import { activityTypeValidator, invoiceStatusValidator } from './model';

const invoiceItemInputValidator = v.object({
  product_id: v.string(),
  quantity: v.number(),
  total_weight_kg: v.optional(v.number()),
  is_custom_weight: v.optional(v.boolean()),
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
      .order('asc')
      .collect();

    return items.map(mapInvoiceItem);
  },
});

export const create = mutation({
  args: {
    invoice: v.object({
      customer_id: v.string(),
      po_number: v.string(),
    }),
    invoiceItems: v.array(invoiceItemInputValidator),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const rebuildJob = await ctx.db
      .query('maintenanceJobs')
      .withIndex('by_task_name', (q) =>
        q.eq('taskName', LIFETIME_VALUE_REBUILD_TASK_NAME),
      )
      .unique();
    if (rebuildJob?.status === 'running') {
      throw new Error(
        'Customer lifetime value rebuild is in progress. Wait for it to finish before creating a new invoice.',
      );
    }

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
        if (item.quantity <= 0) {
          throw new Error('Invoice item quantity must be greater than 0');
        }

        const product = await requireById(
          ctx,
          'products',
          item.product_id,
          `Product ${item.product_id} not found`,
        );

        const requestedWeightKg =
          item.total_weight_kg ??
          item.quantity * Number(product.packageWeightKg ?? 0);
        if (requestedWeightKg <= 0) {
          throw new Error('Invoice item weight must be greater than 0');
        }

        const pricePerKg = await resolveEffectivePricePerKg(
          ctx,
          customer._id,
          product._id,
          Number(product.pricePerKg ?? 0),
        );
        const totalWeightKg = requestedWeightKg;
        const productPrice = pricePerKg * Number(product.packageWeightKg ?? 0);
        const totalPrice = totalWeightKg * pricePerKg;

        return {
          item,
          product,
          pricePerKg,
          productPrice,
          totalWeightKg,
          totalPrice,
        };
      }),
    );

    const stockUseByProductId = new Map<
      Id<'products'>,
      {
        product: (typeof resolvedItems)[number]['product'];
        fullBoxQuantity: number;
        totalWeightKg: number;
      }
    >();

    for (const resolved of resolvedItems) {
      const existing = stockUseByProductId.get(resolved.product._id);
      const fullBoxQuantity = resolved.item.is_custom_weight
        ? 0
        : resolved.item.quantity;
      if (existing) {
        existing.fullBoxQuantity += fullBoxQuantity;
        existing.totalWeightKg += resolved.totalWeightKg;
      } else {
        stockUseByProductId.set(resolved.product._id, {
          product: resolved.product,
          fullBoxQuantity,
          totalWeightKg: resolved.totalWeightKg,
        });
      }
    }

    const remainingStockByProductId = new Map<
      Id<'products'>,
      { boxes: number; kg: number }
    >();

    for (const stockUse of stockUseByProductId.values()) {
      const currentStockBoxes = Number(stockUse.product.currentStockBoxes ?? 0);
      const packageWeightKg = Number(stockUse.product.packageWeightKg ?? 0);
      const currentStockKg = Number(
        stockUse.product.currentStockKg ?? currentStockBoxes * packageWeightKg,
      );
      const remainingKg = currentStockKg - stockUse.totalWeightKg;
      const remainingBoxes =
        packageWeightKg > 0 ? Math.floor(remainingKg / packageWeightKg) : 0;

      if (currentStockBoxes - stockUse.fullBoxQuantity < 0) {
        throw new Error(`Insufficient stock for ${stockUse.product.name}`);
      }
      if (remainingKg < 0) {
        throw new Error(
          `Insufficient stock weight for ${stockUse.product.name}`,
        );
      }

      remainingStockByProductId.set(stockUse.product._id, {
        boxes: remainingBoxes,
        kg: remainingKg,
      });
    }

    const { subtotal, tax, total } = computeSalesTotals(
      resolvedItems.reduce((sum, item) => sum + item.totalPrice, 0),
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
      subtotal,
      tax,
      total,
      poNumber: args.invoice.po_number,
    });

    for (const resolved of resolvedItems) {
      await ctx.db.insert('invoiceItems', {
        invoiceId,
        productId: resolved.product._id,
        name: resolved.product.name,
        quantity: resolved.item.quantity,
        productPrice: resolved.productPrice,
        totalWeightKg: resolved.totalWeightKg,
        pricePerKg: resolved.pricePerKg,
        totalPrice: resolved.totalPrice,
        createdAt: timestamp,
      });
    }

    for (const [productId, remainingStock] of remainingStockByProductId) {
      await ctx.db.patch(productId, {
        currentStockBoxes: remainingStock.boxes,
        currentStockKg: remainingStock.kg,
        updatedAt: timestamp,
      });
    }

    await ctx.db.patch(customer._id, {
      lifetimeValue: Number(customer.lifetimeValue ?? 0) + subtotal,
      updatedAt: timestamp,
    });

    await createActivityRecord(ctx, {
      customerId: customer._id,
      type: 'invoice_generated',
      description: `Invoice ${number} generated for PO ${args.invoice.po_number} (total ${formatLkrCurrency(total)}).`,
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
