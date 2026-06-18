import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
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

export const create = mutation({
  args: {
    company: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    payee: v.optional(v.string()),
    vatRegNo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const company = args.company.trim();
    const email = args.email.trim().toLowerCase();
    const phone = normalizeOptionalText(args.phone);
    const address = normalizeOptionalText(args.address);
    const payee = normalizeOptionalText(args.payee);
    const vatRegNo = normalizeOptionalText(args.vatRegNo);

    validateCustomerInput({
      company,
      email,
      phone,
      address,
      payee,
      vatRegNo,
    });

    const existing = await ctx.db
      .query('customers')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();
    if (existing) {
      throw new Error(`A customer with email ${email} already exists`);
    }

    const now = Date.now();
    const customerId = await ctx.db.insert('customers', {
      company,
      email,
      ...(phone ? { phone } : {}),
      ...(address ? { address } : {}),
      ...(payee ? { payee } : {}),
      ...(vatRegNo ? { vatRegNo } : {}),
      avatar: getInitials(company),
      status: 'new',
      lifetimeValue: 0,
      createdAt: now,
      updatedAt: now,
    });

    const customer = await ctx.db.get(customerId);
    if (!customer) throw new Error('Customer creation returned no data');
    return mapCustomer(customer);
  },
});

export const update = mutation({
  args: {
    customerId: v.string(),
    company: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    payee: v.optional(v.string()),
    vatRegNo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const customer = await getById(ctx, 'customers', args.customerId);
    if (!customer) throw new Error(`Customer ${args.customerId} not found`);

    const company = args.company.trim();
    const email = args.email.trim().toLowerCase();
    const phone = normalizeOptionalText(args.phone);
    const address = normalizeOptionalText(args.address);
    const payee = normalizeOptionalText(args.payee);
    const vatRegNo = normalizeOptionalText(args.vatRegNo);

    validateCustomerInput({
      company,
      email,
      phone,
      address,
      payee,
      vatRegNo,
    });

    const customerWithEmail = await ctx.db
      .query('customers')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();
    if (customerWithEmail && customerWithEmail._id !== customer._id) {
      throw new Error(`A customer with email ${email} already exists`);
    }

    await ctx.db.replace(customer._id, {
      company,
      email,
      ...(phone ? { phone } : {}),
      ...(address ? { address } : {}),
      ...(payee ? { payee } : {}),
      ...(vatRegNo ? { vatRegNo } : {}),
      avatar: getInitials(company),
      status: customer.status,
      lifetimeValue: customer.lifetimeValue,
      createdAt: customer.createdAt,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(customer._id);
    if (!updated) throw new Error('Updated customer could not be loaded');
    return mapCustomer(updated);
  },
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateCustomerInput = ({
  company,
  email,
  phone,
  address,
  payee,
  vatRegNo,
}: {
  company: string;
  email: string;
  phone?: string;
  address?: string;
  payee?: string;
  vatRegNo?: string;
}) => {
  if (!company) throw new Error('Company name is required');
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('Enter a valid email address');
  }
  assertMaxLength('Company name', company, 160);
  assertMaxLength('Email', email, 254);
  assertMaxLength('Phone', phone, 50);
  assertMaxLength('Address', address, 1000);
  assertMaxLength('Payee', payee, 160);
  assertMaxLength('VAT registration number', vatRegNo, 100);
};

const normalizeOptionalText = (value?: string) => {
  const normalized = value?.trim();
  return normalized || undefined;
};

const assertMaxLength = (
  label: string,
  value: string | undefined,
  maximum: number,
) => {
  if (value && value.length > maximum) {
    throw new Error(`${label} must be ${maximum} characters or fewer`);
  }
};

const getInitials = (company: string) =>
  company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
