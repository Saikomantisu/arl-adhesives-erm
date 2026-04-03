import { queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import { getById, mapProduct } from './lib';

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('products').order('desc').collect();
    return products.map(mapProduct);
  },
});

export const get = queryGeneric({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await getById(ctx, 'products', args.productId);
    return product ? mapProduct(product) : null;
  },
});
