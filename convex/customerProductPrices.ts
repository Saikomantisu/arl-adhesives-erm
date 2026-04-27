import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import {
  getById,
  mapCustomerProductPrice,
  requireById,
} from './lib';

export const listByCustomer = query({
  args: {
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const customer = await requireById(
      ctx,
      'customers',
      args.customerId,
      `Customer ${args.customerId} not found`,
    );

    const overrides = await ctx.db
      .query('customerProductPrices')
      .withIndex('by_customer_id', (q) => q.eq('customerId', customer._id))
      .collect();

    const rows = await Promise.all(
      overrides.map(async (override) => {
        const product = await ctx.db.get(override.productId);
        return product ? mapCustomerProductPrice(override, product) : null;
      }),
    );

    return rows.filter((row) => row !== null);
  },
});

export const getEffectivePriceMap = query({
  args: {
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const customer = await requireById(
      ctx,
      'customers',
      args.customerId,
      `Customer ${args.customerId} not found`,
    );

    const overrides = await ctx.db
      .query('customerProductPrices')
      .withIndex('by_customer_id', (q) => q.eq('customerId', customer._id))
      .collect();

    return overrides.reduce<Record<string, number>>((acc, override) => {
      acc[override.productId] = Number(override.pricePerKg ?? 0);
      return acc;
    }, {});
  },
});

export const upsert = mutation({
  args: {
    customerId: v.string(),
    productId: v.string(),
    pricePerKg: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    if (args.pricePerKg <= 0) {
      throw new Error('Price per kg must be greater than 0');
    }

    const customer = await requireById(
      ctx,
      'customers',
      args.customerId,
      `Customer ${args.customerId} not found`,
    );
    const product = await requireById(
      ctx,
      'products',
      args.productId,
      `Product ${args.productId} not found`,
    );

    const existing = await ctx.db
      .query('customerProductPrices')
      .withIndex('by_customer_id_and_product_id', (q) =>
        q.eq('customerId', customer._id).eq('productId', product._id),
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        pricePerKg: args.pricePerKg,
        updatedAt: now,
      });

      const updated = await getById(ctx, 'customerProductPrices', existing._id);
      if (!updated) throw new Error('Updated override could not be loaded');
      return mapCustomerProductPrice(updated, product);
    }

    const createdId = await ctx.db.insert('customerProductPrices', {
      customerId: customer._id,
      productId: product._id,
      pricePerKg: args.pricePerKg,
      createdAt: now,
      updatedAt: now,
    });

    const created = await getById(ctx, 'customerProductPrices', createdId);
    if (!created) throw new Error('Created override could not be loaded');
    return mapCustomerProductPrice(created, product);
  },
});

export const remove = mutation({
  args: {
    customerId: v.string(),
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const customer = await requireById(
      ctx,
      'customers',
      args.customerId,
      `Customer ${args.customerId} not found`,
    );
    const product = await requireById(
      ctx,
      'products',
      args.productId,
      `Product ${args.productId} not found`,
    );

    const existing = await ctx.db
      .query('customerProductPrices')
      .withIndex('by_customer_id_and_product_id', (q) =>
        q.eq('customerId', customer._id).eq('productId', product._id),
      )
      .unique();

    if (!existing) return { removed: false };

    await ctx.db.delete(existing._id);
    return { removed: true };
  },
});
