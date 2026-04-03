import { v } from 'convex/values';
import { query } from './_generated/server';
import { getById, mapCustomer } from './lib';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query('customers').order('desc').collect();
    return customers.map(mapCustomer);
  },
});

export const get = query({
  args: {
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    const customer = await getById(ctx, 'customers', args.customerId);
    return customer ? mapCustomer(customer) : null;
  },
});
