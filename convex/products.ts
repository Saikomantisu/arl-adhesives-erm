import { v } from 'convex/values';
import { query } from './_generated/server';
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
      const effectivePricePerKg =
        overridePricePerKg ?? defaultPricePerKg;
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
