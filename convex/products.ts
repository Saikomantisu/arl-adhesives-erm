import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import { getById, mapProduct } from './lib';

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const products = await ctx.db.query('products').order('desc').collect();
    return products.map(mapProduct);
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
