import type { MutationCtx, QueryCtx } from './_generated/server';

export const requireAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error('Not authenticated');
  }

  return identity;
};
