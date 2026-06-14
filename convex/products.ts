import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import { getById, mapProduct, requireById } from './lib';

export const list = query({
  args: {
    customerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const products = await ctx.db.query('products').order('desc').collect();
    if (!args.customerId) {
      return products.map(mapProduct);
    }

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
    const overrideByProductId = overrides.reduce<Record<string, number>>(
      (acc, override) => {
        acc[override.productId] = Number(override.pricePerKg ?? 0);
        return acc;
      },
      {},
    );

    return products.map((product) => {
      const defaultPricePerKg = Number(product.pricePerKg ?? 0);
      const overridePricePerKg = overrideByProductId[product._id];
      const effectivePricePerKg = overridePricePerKg ?? defaultPricePerKg;
      const base = mapProduct(product);

      return {
        ...base,
        default_price_per_kg: defaultPricePerKg,
        effective_price_per_kg: effectivePricePerKg,
        effective_product_price:
          effectivePricePerKg * Number(product.packageWeightKg ?? 0),
        has_customer_override: overridePricePerKg !== undefined,
      };
    });
  },
});

export const get = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const product = await getById(ctx, 'products', args.productId);
    return product ? mapProduct(product) : null;
  },
});

export const backfillCurrentStockKg = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const batchSize = Math.max(1, Math.min(args.batchSize ?? 50, 200));
    let patched = 0;

    for await (const product of ctx.db.query('products')) {
      if (patched >= batchSize) break;
      if (product.currentStockKg !== undefined) continue;

      await ctx.db.patch(product._id, {
        currentStockKg:
          Number(product.currentStockBoxes ?? 0) *
          Number(product.packageWeightKg ?? 0),
        updatedAt: Date.now(),
      });
      patched += 1;
    }

    return { patched };
  },
});
