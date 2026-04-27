import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import {
  computeSalesTotals,
  filterToMonth,
  formatLkrCurrency,
  formatQuotationNumber,
  getById,
  mapQuotation,
  mapQuotationItem,
  requireById,
  resolveEffectivePricePerKg,
  takeNextSequence,
} from './lib';

const quotationItemInputValidator = v.object({
  product_id: v.string(),
  quantity: v.number(),
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
        if (item.quantity <= 0) {
          throw new Error('Quotation item quantity must be greater than 0');
        }

        const product = await requireById(
          ctx,
          'products',
          item.product_id,
          `Product ${item.product_id} not found`,
        );

        const pricePerKg = await resolveEffectivePricePerKg(
          ctx,
          customer._id,
          product._id,
          Number(product.pricePerKg ?? 0),
        );
        const totalWeightKg = item.quantity * Number(product.packageWeightKg ?? 0);
        const productPrice = pricePerKg * Number(product.packageWeightKg ?? 0);
        const totalPrice = item.quantity * productPrice;

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

    const { subtotal, tax, total } = computeSalesTotals(
      resolvedItems.reduce((sum, item) => sum + item.totalPrice, 0),
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
      subtotal,
      tax,
      total,
      poNumber: args.quotation.po_number,
    });

    for (const resolved of resolvedItems) {
      await ctx.db.insert('quotationItems', {
        quotationId,
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

    await ctx.db.insert('activities', {
      customerId: customer._id,
      type: 'quotation_generated',
      description: `Quotation ${number} generated (total ${formatLkrCurrency(total)}).`,
      refNumber: number,
      timestamp,
      updatedAt: timestamp,
    });

    const quotation = await ctx.db.get(quotationId);
    if (!quotation) throw new Error('Quotation creation returned no data');
    return mapQuotation(quotation);
  },
});
