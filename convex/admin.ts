import { mutationGeneric } from 'convex/server';
import { v } from 'convex/values';

async function scrubTable(
  ctx: { db: any },
  tableName: string,
  fields: string[],
) {
  const rows = await ctx.db.query(tableName).collect();
  let updated = 0;

  for (const row of rows) {
    const patch: Record<string, undefined> = {};
    let needsPatch = false;

    for (const field of fields) {
      if (field in row) {
        patch[field] = undefined;
        needsPatch = true;
      }
    }

    if (needsPatch) {
      await ctx.db.patch(row._id, patch);
      updated += 1;
    }
  }

  return updated;
}

export const scrubLegacyFields = mutationGeneric({
  args: {
    confirm: v.literal('remove-legacy-fields'),
  },
  handler: async (ctx) => {
    const customers = await scrubTable(ctx, 'customers', ['legacyId']);
    const products = await scrubTable(ctx, 'products', ['legacyId']);
    const invoices = await scrubTable(ctx, 'invoices', [
      'legacyId',
      'customerExternalId',
    ]);
    const invoiceItems = await scrubTable(ctx, 'invoiceItems', [
      'legacyId',
      'invoiceExternalId',
      'productExternalId',
    ]);
    const aods = await scrubTable(ctx, 'aods', ['legacyId', 'invoiceExternalId']);
    const activities = await scrubTable(ctx, 'activities', [
      'legacyId',
      'customerExternalId',
    ]);

    return {
      customers,
      products,
      invoices,
      invoiceItems,
      aods,
      activities,
    };
  },
});
