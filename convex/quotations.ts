import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import {
  filterToMonth,
  formatLkrCurrency,
  formatQuotationNumber,
  getById,
  mapQuotation,
  mapQuotationItem,
  requireById,
  takeNextSequence,
} from './lib';

const quotationItemInputValidator = v.object({
  product_id: v.string(),
  name: v.string(),
  quantity: v.number(),
  product_price: v.number(),
  total_weight_kg: v.number(),
  price_per_kg: v.number(),
  total_price: v.number(),
});

export const list = query({
  args: {
    monthTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const quotations = await ctx.db
      .query('quotations')
      .withIndex('by_created_at')
      .order('desc')
      .collect();

    return filterToMonth(quotations, args.monthTimestamp).map(mapQuotation);
  },
});

export const itemsByQuotation = query({
  args: {
    quotationId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const quotation = await getById(ctx, 'quotations', args.quotationId);
    if (!quotation) return [];

    const items = await ctx.db
      .query('quotationItems')
      .withIndex('by_quotation_id', (q) => q.eq('quotationId', quotation._id))
      .order('desc')
      .collect();

    return items.map(mapQuotationItem);
  },
});

export const create = mutation({
  args: {
    quotation: v.object({
      customer_id: v.string(),
      subtotal: v.number(),
      tax: v.number(),
      total: v.number(),
      po_number: v.optional(v.string()),
    }),
    quotationItems: v.array(quotationItemInputValidator),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    if (args.quotationItems.length === 0) {
      throw new Error('At least one quotation item is required');
    }

    const customer = await requireById(
      ctx,
      'customers',
      args.quotation.customer_id,
      `Customer ${args.quotation.customer_id} not found`,
    );

    const resolvedItems = await Promise.all(
      args.quotationItems.map(async (item) => {
        const product = await requireById(
          ctx,
          'products',
          item.product_id,
          `Product ${item.product_id} not found`,
        );

        return { item, product };
      }),
    );

    const timestamp = Date.now();
    const year = new Date(timestamp).getUTCFullYear();
    const sequence = await takeNextSequence(ctx, 'quotation', year);
    const number = formatQuotationNumber(timestamp, sequence);

    const existingQuotation = await ctx.db
      .query('quotations')
      .withIndex('by_number', (q) => q.eq('number', number))
      .unique();
    if (existingQuotation) {
      throw new Error(`Quotation number ${number} already exists`);
    }

    const quotationId = await ctx.db.insert('quotations', {
      number,
      numberYear: year,
      numberMonth: new Date(timestamp).getUTCMonth() + 1,
      numberSequence: sequence,
      numberingVersion: 'yearly_continuous',
      customerId: customer._id,
      createdAt: timestamp,
      subtotal: args.quotation.subtotal,
      tax: args.quotation.tax,
      total: args.quotation.total,
      poNumber: args.quotation.po_number,
    });

    for (const resolved of resolvedItems) {
      await ctx.db.insert('quotationItems', {
        quotationId,
        productId: resolved.product._id,
        name: resolved.item.name,
        quantity: resolved.item.quantity,
        productPrice: resolved.item.product_price,
        totalWeightKg: resolved.item.total_weight_kg,
        pricePerKg: resolved.item.price_per_kg,
        totalPrice: resolved.item.total_price,
        createdAt: timestamp,
      });
    }

    await ctx.db.insert('activities', {
      customerId: customer._id,
      type: 'quotation_generated',
      description: `Quotation ${number} generated (total ${formatLkrCurrency(args.quotation.total)}).`,
      refNumber: number,
      timestamp,
      updatedAt: timestamp,
    });

    const quotation = await ctx.db.get(quotationId);
    if (!quotation) throw new Error('Quotation creation returned no data');
    return mapQuotation(quotation);
  },
});
