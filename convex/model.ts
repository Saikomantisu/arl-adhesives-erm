import { v } from 'convex/values';

export const customerStatusValidator = v.union(
  v.literal('active'),
  v.literal('overdue'),
  v.literal('new'),
);

export const invoiceStatusValidator = v.union(
  v.literal('paid'),
  v.literal('pending'),
  v.literal('overdue'),
);

export const numberingScopeValidator = v.union(
  v.literal('invoice'),
  v.literal('quotation'),
  v.literal('aod'),
);

export const numberingVersionValidator = v.union(
  v.literal('legacy_monthly'),
  v.literal('yearly_continuous'),
);

export const activityTypeValidator = v.union(
  v.literal('invoice_generated'),
  v.literal('quotation_generated'),
  v.literal('aod_generated'),
  v.literal('invoice_paid'),
  v.literal('aod_signed'),
  v.literal('invoice_pending'),
  v.literal('invoice_overdue'),
);
