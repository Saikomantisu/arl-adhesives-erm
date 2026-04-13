import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import { getById, mapCustomer } from './lib';

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const customers = await ctx.db.query('customers').order('desc').collect();
    return customers.map(mapCustomer);
  },
});

export const get = query({
  args: {
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const customer = await getById(ctx, 'customers', args.customerId);
    return customer ? mapCustomer(customer) : null;
  },
});
