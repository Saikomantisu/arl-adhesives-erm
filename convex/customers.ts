import { queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import { getByExternalId, mapCustomer } from './lib';

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query('customers').order('desc').collect();
    return customers.map(mapCustomer);
  },
});

export const get = queryGeneric({
  args: {
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    const customer = await getByExternalId(ctx, 'customers', args.customerId);
    return customer ? mapCustomer(customer) : null;
  },
});
