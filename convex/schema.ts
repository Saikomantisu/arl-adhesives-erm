import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import {
  activityTypeValidator,
  customerStatusValidator,
  invoiceStatusValidator,
  numberingScopeValidator,
  numberingVersionValidator,
} from './model';

export default defineSchema({
  customers: defineTable({
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.string(),
    address: v.optional(v.string()),
    vatRegNo: v.optional(v.string()),
    status: customerStatusValidator,
    lifetimeValue: v.number(),
    avatar: v.optional(v.string()),
    payee: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_email', ['email']),

  products: defineTable({
    sku: v.string(),
    name: v.string(),
    threshold: v.number(),
    stockVelocity: v.array(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    pricePerKg: v.number(),
    packageWeightKg: v.number(),
    currentStockBoxes: v.number(),
  }).index('by_sku', ['sku']),

  customerProductPrices: defineTable({
    customerId: v.id('customers'),
    productId: v.id('products'),
    pricePerKg: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_customer_id', ['customerId'])
    .index('by_customer_id_and_product_id', ['customerId', 'productId']),

  invoices: defineTable({
    number: v.string(),
    numberYear: v.optional(v.number()),
    numberMonth: v.optional(v.number()),
    numberSequence: v.optional(v.number()),
    numberingVersion: numberingVersionValidator,
    customerId: v.id('customers'),
    status: invoiceStatusValidator,
    createdAt: v.number(),
    dueDate: v.number(),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    poNumber: v.string(),
  })
    .index('by_number', ['number'])
    .index('by_customer_id', ['customerId'])
    .index('by_created_at', ['createdAt'])
    .index('by_status', ['status']),

  quotations: defineTable({
    number: v.string(),
    numberYear: v.optional(v.number()),
    numberMonth: v.optional(v.number()),
    numberSequence: v.optional(v.number()),
    numberingVersion: numberingVersionValidator,
    customerId: v.id('customers'),
    createdAt: v.number(),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    poNumber: v.optional(v.string()),
  })
    .index('by_number', ['number'])
    .index('by_customer_id', ['customerId'])
    .index('by_created_at', ['createdAt']),

  invoiceItems: defineTable({
    invoiceId: v.id('invoices'),
    productId: v.id('products'),
    name: v.string(),
    quantity: v.number(),
    productPrice: v.number(),
    totalWeightKg: v.number(),
    pricePerKg: v.number(),
    totalPrice: v.number(),
    createdAt: v.number(),
  }).index('by_invoice_id', ['invoiceId']),

  quotationItems: defineTable({
    quotationId: v.id('quotations'),
    productId: v.id('products'),
    name: v.string(),
    quantity: v.number(),
    productPrice: v.number(),
    totalWeightKg: v.number(),
    pricePerKg: v.number(),
    totalPrice: v.number(),
    createdAt: v.number(),
  }).index('by_quotation_id', ['quotationId']),

  aods: defineTable({
    invoiceId: v.id('invoices'),
    aodNumber: v.string(),
    numberYear: v.optional(v.number()),
    numberMonth: v.optional(v.number()),
    numberSequence: v.optional(v.number()),
    numberingVersion: numberingVersionValidator,
    printedAt: v.number(),
    poNumber: v.optional(v.string()),
    invoiceNumber: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_invoice_id', ['invoiceId'])
    .index('by_aod_number', ['aodNumber']),

  activities: defineTable({
    customerId: v.id('customers'),
    type: activityTypeValidator,
    description: v.string(),
    refNumber: v.optional(v.string()),
    timestamp: v.number(),
    updatedAt: v.number(),
  })
    .index('by_customer_id', ['customerId'])
    .index('by_timestamp', ['timestamp']),

  sequences: defineTable({
    scope: numberingScopeValidator,
    year: v.number(),
    nextValue: v.number(),
    updatedAt: v.number(),
  }).index('by_scope_year', ['scope', 'year']),

  maintenanceJobs: defineTable({
    taskName: v.string(),
    status: v.union(
      v.literal('idle'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    phase: v.union(
      v.literal('idle'),
      v.literal('resetting_customers'),
      v.literal('processing_invoices'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    cursor: v.union(v.string(), v.null()),
    processedCustomers: v.number(),
    processedInvoices: v.number(),
    error: v.union(v.string(), v.null()),
    startedAt: v.union(v.number(), v.null()),
    finishedAt: v.union(v.number(), v.null()),
    updatedAt: v.number(),
  }).index('by_task_name', ['taskName']),
});
