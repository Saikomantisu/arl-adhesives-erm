import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuthenticatedUser } from './auth';
import { getById, mapProduct, requireById } from './lib';

export const list = query({
  args: {
    customerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const products = await ctx.db.query('products').order('desc').collect();
    if (!args.customerId) {
      return products.map(mapProduct);
    }

    const customer = await requireById(
      ctx,
      'customers',
      args.customerId,
      `Customer ${args.customerId} not found`,
    );
    const overrides = await ctx.db
      .query('customerProductPrices')
      .withIndex('by_customer_id', (q) => q.eq('customerId', customer._id))
      .collect();
    const overrideByProductId = overrides.reduce<Record<string, number>>(
      (acc, override) => {
        acc[override.productId] = Number(override.pricePerKg ?? 0);
        return acc;
      },
      {},
    );

    return products.map((product) => {
      const defaultPricePerKg = Number(product.pricePerKg ?? 0);
      const overridePricePerKg = overrideByProductId[product._id];
      const effectivePricePerKg = overridePricePerKg ?? defaultPricePerKg;
      const base = mapProduct(product);

      return {
        ...base,
        default_price_per_kg: defaultPricePerKg,
        effective_price_per_kg: effectivePricePerKg,
        effective_product_price:
          effectivePricePerKg * Number(product.packageWeightKg ?? 0),
        has_customer_override: overridePricePerKg !== undefined,
      };
    });
  },
});

export const get = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const product = await getById(ctx, 'products', args.productId);
    return product ? mapProduct(product) : null;
  },
});

export const create = mutation({
  args: {
    sku: v.string(),
    name: v.string(),
    pricePerKg: v.number(),
    packageWeightKg: v.number(),
    threshold: v.number(),
    currentStockBoxes: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const sku = args.sku.trim().toUpperCase();
    const name = args.name.trim();

    validateProductInput({
      sku,
      name,
      pricePerKg: args.pricePerKg,
      packageWeightKg: args.packageWeightKg,
      threshold: args.threshold,
      currentStockBoxes: args.currentStockBoxes,
    });

    const existing = await ctx.db
      .query('products')
      .withIndex('by_sku', (q) => q.eq('sku', sku))
      .unique();
    if (existing) throw new Error(`A product with SKU ${sku} already exists`);

    const now = Date.now();
    const productId = await ctx.db.insert('products', {
      sku,
      name,
      pricePerKg: args.pricePerKg,
      packageWeightKg: args.packageWeightKg,
      threshold: args.threshold,
      currentStockBoxes: args.currentStockBoxes,
      currentStockKg: args.currentStockBoxes * args.packageWeightKg,
      stockVelocity: [],
      createdAt: now,
      updatedAt: now,
    });

    const product = await ctx.db.get(productId);
    if (!product) throw new Error('Product creation returned no data');
    return mapProduct(product);
  },
});

export const update = mutation({
  args: {
    productId: v.string(),
    sku: v.string(),
    name: v.string(),
    pricePerKg: v.number(),
    packageWeightKg: v.number(),
    threshold: v.number(),
    currentStockBoxes: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const product = await requireById(
      ctx,
      'products',
      args.productId,
      `Product ${args.productId} not found`,
    );
    const sku = args.sku.trim().toUpperCase();
    const name = args.name.trim();

    validateProductInput({
      sku,
      name,
      pricePerKg: args.pricePerKg,
      packageWeightKg: args.packageWeightKg,
      threshold: args.threshold,
      currentStockBoxes: args.currentStockBoxes,
    });

    const productWithSku = await ctx.db
      .query('products')
      .withIndex('by_sku', (q) => q.eq('sku', sku))
      .unique();
    if (productWithSku && productWithSku._id !== product._id) {
      throw new Error(`A product with SKU ${sku} already exists`);
    }

    await ctx.db.patch(product._id, {
      sku,
      name,
      pricePerKg: args.pricePerKg,
      packageWeightKg: args.packageWeightKg,
      threshold: args.threshold,
      currentStockBoxes: args.currentStockBoxes,
      currentStockKg: args.currentStockBoxes * args.packageWeightKg,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(product._id);
    if (!updated) throw new Error('Updated product could not be loaded');
    return mapProduct(updated);
  },
});

export const backfillCurrentStockKg = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const batchSize = Math.max(1, Math.min(args.batchSize ?? 50, 200));
    let patched = 0;

    for await (const product of ctx.db.query('products')) {
      if (patched >= batchSize) break;
      if (product.currentStockKg !== undefined) continue;

      await ctx.db.patch(product._id, {
        currentStockKg:
          Number(product.currentStockBoxes ?? 0) *
          Number(product.packageWeightKg ?? 0),
        updatedAt: Date.now(),
      });
      patched += 1;
    }

    return { patched };
  },
});

const validateProductInput = ({
  sku,
  name,
  pricePerKg,
  packageWeightKg,
  threshold,
  currentStockBoxes,
}: {
  sku: string;
  name: string;
  pricePerKg: number;
  packageWeightKg: number;
  threshold: number;
  currentStockBoxes: number;
}) => {
  if (!sku) throw new Error('SKU is required');
  if (!name) throw new Error('Product name is required');
  if (sku.length > 64) throw new Error('SKU must be 64 characters or fewer');
  if (name.length > 200) {
    throw new Error('Product name must be 200 characters or fewer');
  }
  if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) {
    throw new Error('Price per kg must be greater than 0');
  }
  if (!Number.isFinite(packageWeightKg) || packageWeightKg <= 0) {
    throw new Error('Package weight must be greater than 0');
  }
  if (!Number.isInteger(threshold) || threshold < 0) {
    throw new Error('Low-stock threshold must be a nonnegative whole number');
  }
  if (!Number.isInteger(currentStockBoxes) || currentStockBoxes < 0) {
    throw new Error('Current stock must be a nonnegative whole number');
  }
};
