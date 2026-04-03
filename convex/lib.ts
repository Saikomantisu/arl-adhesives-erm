const INVOICE_NUMBER_REGEX = /^ARL\/IN-(\d{2})\/(\d{2})\/(\d{2})$/;
const AOD_NUMBER_REGEX = /^ARL\/AOD-(\d{2})\/(\d{2})\/(\d{2})$/;

export const toExternalId = <
  T extends { _id: string; legacyId?: string | null },
>(
  doc: T,
) => doc.legacyId ?? doc._id;

export const getByExternalId = async (
  ctx: { db: any },
  tableName: string,
  externalId: string,
) => {
  const normalizedId = ctx.db.normalizeId(tableName, externalId);
  if (normalizedId) {
    const direct = await ctx.db.get(normalizedId);
    if (direct) return direct;
  }

  return ctx.db
    .query(tableName)
    .withIndex('by_legacy_id', (q: any) => q.eq('legacyId', externalId))
    .unique();
};

export const requireByExternalId = async (
  ctx: { db: any },
  tableName: string,
  externalId: string,
  errorMessage: string,
) => {
  const doc = await getByExternalId(ctx, tableName, externalId);
  if (!doc) throw new Error(errorMessage);
  return doc;
};

export const parseInvoiceNumber = (value?: string | null) =>
  parseDocumentNumber(value, INVOICE_NUMBER_REGEX);

export const parseAodNumber = (value?: string | null) =>
  parseDocumentNumber(value, AOD_NUMBER_REGEX);

const parseDocumentNumber = (
  value: string | null | undefined,
  regex: RegExp,
) => {
  if (!value) return null;

  const match = regex.exec(value);
  if (!match) return null;

  return {
    year: 2000 + Number(match[1]),
    month: Number(match[2]),
    sequence: Number(match[3]),
  };
};

export const formatInvoiceNumber = (timestamp: number, sequence: number) =>
  `ARL/IN-${formatNumberParts(timestamp, sequence)}`;

export const formatAodNumber = (timestamp: number, sequence: number) =>
  `ARL/AOD-${formatNumberParts(timestamp, sequence)}`;

const formatNumberParts = (timestamp: number, sequence: number) => {
  const date = new Date(timestamp);
  const year = String(date.getUTCFullYear()).slice(-2);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const suffix = String(sequence).padStart(2, '0');
  return `${year}/${month}/${suffix}`;
};

export const addOneMonthPreservingUtcDay = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();

  const nextMonthStart = Date.UTC(
    year,
    month + 1,
    1,
    hours,
    minutes,
    seconds,
    milliseconds,
  );
  const lastDayOfNextMonth = new Date(
    Date.UTC(year, month + 2, 0),
  ).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfNextMonth);

  return Date.UTC(
    year,
    month + 1,
    clampedDay,
    hours,
    minutes,
    seconds,
    milliseconds,
  );
};

export const takeNextSequence = async (
  ctx: { db: any },
  scope: 'invoice' | 'aod',
  year: number,
) => {
  const existing = await ctx.db
    .query('sequences')
    .withIndex('by_scope_year', (q: any) =>
      q.eq('scope', scope).eq('year', year),
    )
    .unique();

  const now = Date.now();

  if (existing) {
    const nextValue = Number(existing.nextValue ?? 1);
    await ctx.db.patch(existing._id, {
      nextValue: nextValue + 1,
      updatedAt: now,
    });
    return nextValue;
  }

  await ctx.db.insert('sequences', {
    scope,
    year,
    nextValue: 2,
    updatedAt: now,
  });

  return 1;
};

export const setSequenceNextValue = async (
  ctx: { db: any },
  scope: 'invoice' | 'aod',
  year: number,
  nextValue: number,
) => {
  const existing = await ctx.db
    .query('sequences')
    .withIndex('by_scope_year', (q: any) =>
      q.eq('scope', scope).eq('year', year),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      nextValue,
      updatedAt: Date.now(),
    });
    return;
  }

  await ctx.db.insert('sequences', {
    scope,
    year,
    nextValue,
    updatedAt: Date.now(),
  });
};

export const mapCustomer = (doc: any) => ({
  id: toExternalId(doc),
  email: doc.email,
  phone: doc.phone ?? '',
  payee: doc.payee ?? '',
  avatar: doc.avatar ?? '',
  company: doc.company,
  address: doc.address ?? '',
  vat_reg_no: doc.vatRegNo ?? '',
  activities: [],
  status: doc.status ?? 'new',
  lifetime_value: Number(doc.lifetimeValue ?? 0),
});

export const mapProduct = (doc: any) => ({
  id: toExternalId(doc),
  sku: doc.sku,
  name: doc.name,
  price_per_kg: Number(doc.pricePerKg ?? 0),
  package_weight_kg: Number(doc.packageWeightKg ?? 0),
  threshold: Number(doc.threshold ?? 0),
  current_stock_boxes: Number(doc.currentStockBoxes ?? 0),
  stock_velocity: Array.isArray(doc.stockVelocity) ? doc.stockVelocity : [],
});

export const mapInvoice = (doc: any) => ({
  id: toExternalId(doc),
  number: doc.number,
  customer_id: doc.customerExternalId,
  status: doc.status,
  created_at: doc.createdAt,
  due_date: doc.dueDate,
  subtotal: Number(doc.subtotal ?? 0),
  tax: Number(doc.tax ?? 0),
  total: Number(doc.total ?? 0),
  po_number: doc.poNumber,
});

export const mapInvoiceItem = (doc: any) => ({
  id: toExternalId(doc),
  invoice_id: doc.invoiceExternalId,
  product_id: doc.productExternalId,
  name: doc.name,
  quantity: Number(doc.quantity ?? 0),
  product_price: Number(doc.productPrice ?? 0),
  total_weight_kg: Number(doc.totalWeightKg ?? 0),
  price_per_kg: Number(doc.pricePerKg ?? 0),
  total_price: Number(doc.totalPrice ?? 0),
  created_at: doc.createdAt,
});

export const mapAod = (doc: any) => ({
  id: toExternalId(doc),
  invoice_id: doc.invoiceExternalId,
  aod_number: doc.aodNumber,
  printed_at: doc.printedAt,
  po_number: doc.poNumber ?? null,
  invoice_number: doc.invoiceNumber ?? null,
  created_at: doc.createdAt,
});

export const mapActivity = (doc: any) => ({
  id: toExternalId(doc),
  customer_id: doc.customerExternalId,
  type: doc.type,
  description: doc.description,
  ref_number: doc.refNumber ?? undefined,
  timestamp: doc.timestamp,
  updated_at: doc.updatedAt,
});

export const formatLkrCurrency = (amount: number) =>
  new Intl.NumberFormat('en-UK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const filterToMonth = <T extends { createdAt: number }>(
  rows: T[],
  monthTimestamp?: number,
) => {
  if (monthTimestamp === undefined) return rows;

  const date = new Date(monthTimestamp);
  const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
  const end = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);

  return rows.filter((row) => row.createdAt >= start && row.createdAt < end);
};

export const sortByCreatedAtDesc = <T extends { createdAt: number }>(
  rows: T[],
) => [...rows].sort((a, b) => b.createdAt - a.createdAt);
