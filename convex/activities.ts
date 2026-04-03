import { mutationGeneric, queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import { getByExternalId, mapActivity, requireByExternalId } from './lib';
import { activityTypeValidator } from './model';

export const listByCustomer = queryGeneric({
  args: {
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    const customer = await getByExternalId(ctx, 'customers', args.customerId);
    if (!customer) return [];

    const activities = await ctx.db
      .query('activities')
      .withIndex('by_customer_id', (q) => q.eq('customerId', customer._id))
      .order('desc')
      .collect();

    return activities.map(mapActivity);
  },
});

export const create = mutationGeneric({
  args: {
    customerId: v.string(),
    type: activityTypeValidator,
    description: v.string(),
    refNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const customer = await requireByExternalId(
      ctx,
      'customers',
      args.customerId,
      `Customer ${args.customerId} not found`,
    );
    const now = Date.now();
    const activityId = await ctx.db.insert('activities', {
      customerId: customer._id,
      customerExternalId: args.customerId,
      type: args.type,
      description: args.description,
      refNumber: args.refNumber,
      timestamp: now,
      updatedAt: now,
    });

    const activity = await ctx.db.get(activityId);
    if (!activity) throw new Error('Activity creation returned no data');
    return mapActivity(activity);
  },
});
