import { v } from 'convex/values';
import { query } from './_generated/server';
import { getById, mapProduct } from './lib';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('products').order('desc').collect();
    return products.map(mapProduct);
  },
});

export const get = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await getById(ctx, 'products', args.productId);
    return product ? mapProduct(product) : null;
  },
});
