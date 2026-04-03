import { mutationGeneric } from 'convex/server';
import { v } from 'convex/values';
import {
  addOneMonthPreservingUtcDay,
  getByExternalId,
  parseAodNumber,
  parseInvoiceNumber,
  setSequenceNextValue,
  toExternalId,
} from './lib';
import {
  activityTypeValidator,
  customerStatusValidator,
  invoiceStatusValidator,
} from './model';

const numericLike = v.union(v.number(), v.string());
const optionalNumericLike = v.optional(v.union(v.number(), v.string(), v.null()));
const optionalStringLike = v.optional(v.union(v.string(), v.null()));

const customerRowValidator = v.object({
  id: v.string(),
  email: v.string(),
  phone: optionalStringLike,
  company: v.string(),
  address: optionalStringLike,
  vat_reg_no: optionalStringLike,
  status: v.optional(v.union(customerStatusValidator, v.null())),
  lifetime_value: optionalNumericLike,
  avatar: optionalStringLike,
  created_at: optionalStringLike,
  updated_at: optionalStringLike,
  payee: optionalStringLike,
});

const productRowValidator = v.object({
  id: v.string(),
  sku: v.string(),
  name: v.string(),
  threshold: numericLike,
  stock_velocity: v.optional(v.union(v.array(numericLike), v.null())),
  created_at: optionalStringLike,
  updated_at: optionalStringLike,
  price_per_kg: numericLike,
  package_weight_kg: numericLike,
  current_stock_boxes: numericLike,
});

const invoiceRowValidator = v.object({
  id: v.string(),
  number: v.string(),
  customer_id: v.string(),
  status: v.union(invoiceStatusValidator, v.null()),
  created_at: optionalStringLike,
  due_date: optionalStringLike,
  subtotal: numericLike,
  tax: numericLike,
  total: numericLike,
  po_number: v.string(),
});

const invoiceItemRowValidator = v.object({
  id: v.string(),
  invoice_id: v.string(),
  product_id: v.string(),
  name: v.string(),
  quantity: numericLike,
  product_price: numericLike,
  total_weight_kg: numericLike,
  price_per_kg: numericLike,
  total_price: numericLike,
  created_at: optionalStringLike,
});

const aodRowValidator = v.object({
  id: v.string(),
  invoice_id: v.string(),
  aod_number: v.string(),
  printed_at: optionalStringLike,
  po_number: optionalStringLike,
  invoice_number: optionalStringLike,
  created_at: optionalStringLike,
});

const activityRowValidator = v.object({
  id: v.string(),
  customer_id: v.string(),
  type: activityTypeValidator,
  description: v.string(),
  ref_number: optionalStringLike,
  timestamp: optionalStringLike,
  updated_at: optionalStringLike,
});

const toTimestamp = (value?: string | null, fallback = Date.now()) =>
  value ? Date.parse(value) : fallback;

export const importCustomers = mutationGeneric({
  args: {
    rows: v.array(customerRowValidator),
  },
  handler: async (ctx, args) => {
    let imported = 0;

    for (const row of args.rows) {
      const existing = await getByExternalId(ctx, 'customers', row.id);
      const payload = {
        legacyId: row.id,
        email: row.email,
        phone: row.phone ?? undefined,
        company: row.company,
        address: row.address ?? undefined,
        vatRegNo: row.vat_reg_no ?? undefined,
        status: row.status ?? 'new',
        lifetimeValue: Number(row.lifetime_value ?? 0),
        avatar: row.avatar ?? undefined,
        payee: row.payee ?? undefined,
        createdAt: toTimestamp(row.created_at, Date.now()),
        updatedAt: toTimestamp(row.updated_at, Date.now()),
      };

      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert('customers', payload);
      }
      imported += 1;
    }

    return { imported };
  },
});

export const importProducts = mutationGeneric({
  args: {
    rows: v.array(productRowValidator),
  },
  handler: async (ctx, args) => {
    let imported = 0;

    for (const row of args.rows) {
      const existing = await getByExternalId(ctx, 'products', row.id);
      const payload = {
        legacyId: row.id,
        sku: row.sku,
        name: row.name,
        threshold: Number(row.threshold ?? 0),
        stockVelocity: (row.stock_velocity ?? []).map((value) =>
          Number(value ?? 0),
        ),
        createdAt: toTimestamp(row.created_at, Date.now()),
        updatedAt: toTimestamp(row.updated_at, Date.now()),
        pricePerKg: Number(row.price_per_kg ?? 0),
        packageWeightKg: Number(row.package_weight_kg ?? 0),
        currentStockBoxes: Number(row.current_stock_boxes ?? 0),
      };

      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert('products', payload);
      }
      imported += 1;
    }

    return { imported };
  },
});

export const importInvoices = mutationGeneric({
  args: {
    rows: v.array(invoiceRowValidator),
  },
  handler: async (ctx, args) => {
    let imported = 0;

    for (const row of args.rows) {
      const customer = await getByExternalId(ctx, 'customers', row.customer_id);
      if (!customer)
        throw new Error(
          `Customer ${row.customer_id} not found for invoice ${row.id}`,
        );

      const createdAt = toTimestamp(row.created_at, Date.now());
      const parsed = parseInvoiceNumber(row.number);
      const payload = {
        legacyId: row.id,
        number: row.number,
        numberYear: parsed?.year,
        numberMonth: parsed?.month,
        numberSequence: parsed?.sequence,
        numberingVersion: 'legacy_monthly' as const,
        customerId: customer._id,
        customerExternalId: row.customer_id,
        status: row.status ?? 'pending',
        createdAt,
        dueDate: toTimestamp(
          row.due_date,
          addOneMonthPreservingUtcDay(createdAt),
        ),
        subtotal: Number(row.subtotal ?? 0),
        tax: Number(row.tax ?? 0),
        total: Number(row.total ?? 0),
        poNumber: row.po_number,
      };

      const existing = await getByExternalId(ctx, 'invoices', row.id);
      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert('invoices', payload);
      }
      imported += 1;
    }

    return { imported };
  },
});

export const importInvoiceItems = mutationGeneric({
  args: {
    rows: v.array(invoiceItemRowValidator),
  },
  handler: async (ctx, args) => {
    let imported = 0;

    for (const row of args.rows) {
      const invoice = await getByExternalId(ctx, 'invoices', row.invoice_id);
      if (!invoice)
        throw new Error(
          `Invoice ${row.invoice_id} not found for item ${row.id}`,
        );

      const product = await getByExternalId(ctx, 'products', row.product_id);
      if (!product)
        throw new Error(
          `Product ${row.product_id} not found for item ${row.id}`,
        );

      const payload = {
        legacyId: row.id,
        invoiceId: invoice._id,
        invoiceExternalId: row.invoice_id,
        productId: product._id,
        productExternalId: row.product_id,
        name: row.name,
        quantity: Number(row.quantity ?? 0),
        productPrice: Number(row.product_price ?? 0),
        totalWeightKg: Number(row.total_weight_kg ?? 0),
        pricePerKg: Number(row.price_per_kg ?? 0),
        totalPrice: Number(row.total_price ?? 0),
        createdAt: toTimestamp(row.created_at, invoice.createdAt),
      };

      const existing = await getByExternalId(ctx, 'invoiceItems', row.id);
      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert('invoiceItems', payload);
      }
      imported += 1;
    }

    return { imported };
  },
});

export const importAods = mutationGeneric({
  args: {
    rows: v.array(aodRowValidator),
  },
  handler: async (ctx, args) => {
    let imported = 0;

    for (const row of args.rows) {
      const invoice = await getByExternalId(ctx, 'invoices', row.invoice_id);
      if (!invoice)
        throw new Error(
          `Invoice ${row.invoice_id} not found for AOD ${row.id}`,
        );

      const parsed = parseAodNumber(row.aod_number);
      const payload = {
        legacyId: row.id,
        invoiceId: invoice._id,
        invoiceExternalId: row.invoice_id,
        aodNumber: row.aod_number,
        numberYear: parsed?.year,
        numberMonth: parsed?.month,
        numberSequence: parsed?.sequence,
        numberingVersion: 'legacy_monthly' as const,
        printedAt: toTimestamp(row.printed_at, invoice.createdAt),
        poNumber: row.po_number ?? undefined,
        invoiceNumber: row.invoice_number ?? undefined,
        createdAt: toTimestamp(row.created_at, invoice.createdAt),
      };

      const existing = await getByExternalId(ctx, 'aods', row.id);
      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert('aods', payload);
      }
      imported += 1;
    }

    return { imported };
  },
});

export const importActivities = mutationGeneric({
  args: {
    rows: v.array(activityRowValidator),
  },
  handler: async (ctx, args) => {
    let imported = 0;

    for (const row of args.rows) {
      const customer = await getByExternalId(ctx, 'customers', row.customer_id);
      if (!customer)
        throw new Error(
          `Customer ${row.customer_id} not found for activity ${row.id}`,
        );

      const payload = {
        legacyId: row.id,
        customerId: customer._id,
        customerExternalId: row.customer_id,
        type: row.type,
        description: row.description,
        refNumber: row.ref_number ?? undefined,
        timestamp: toTimestamp(row.timestamp, Date.now()),
        updatedAt: toTimestamp(row.updated_at, Date.now()),
      };

      const existing = await getByExternalId(ctx, 'activities', row.id);
      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert('activities', payload);
      }
      imported += 1;
    }

    return { imported };
  },
});

export const seedSequences = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const invoiceRows = await ctx.db.query('invoices').collect();
    const aodRows = await ctx.db.query('aods').collect();

    const invoiceYears = new Map<number, number>();
    for (const row of invoiceRows) {
      if (row.numberYear === undefined || row.numberSequence === undefined)
        continue;
      invoiceYears.set(
        row.numberYear,
        Math.max(invoiceYears.get(row.numberYear) ?? 0, row.numberSequence),
      );
    }

    const aodYears = new Map<number, number>();
    for (const row of aodRows) {
      if (row.numberYear === undefined || row.numberSequence === undefined)
        continue;
      aodYears.set(
        row.numberYear,
        Math.max(aodYears.get(row.numberYear) ?? 0, row.numberSequence),
      );
    }

    for (const [year, maxSequence] of invoiceYears) {
      await setSequenceNextValue(ctx, 'invoice', year, maxSequence + 1);
    }

    for (const [year, maxSequence] of aodYears) {
      await setSequenceNextValue(ctx, 'aod', year, maxSequence + 1);
    }

    return {
      invoiceYears: Object.fromEntries(invoiceYears),
      aodYears: Object.fromEntries(aodYears),
    };
  },
});
