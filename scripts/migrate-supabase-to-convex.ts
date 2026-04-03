import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import { ConvexError } from 'convex/values';

type TableName =
  | 'customers'
  | 'products'
  | 'invoices'
  | 'invoice_items'
  | 'aods'
  | 'activities';

const tableFieldAllowlist: Record<TableName, string[]> = {
  customers: [
    'id',
    'email',
    'phone',
    'company',
    'address',
    'vat_reg_no',
    'status',
    'lifetime_value',
    'avatar',
    'created_at',
    'updated_at',
    'payee',
  ],
  products: [
    'id',
    'sku',
    'name',
    'threshold',
    'stock_velocity',
    'created_at',
    'updated_at',
    'price_per_kg',
    'package_weight_kg',
    'current_stock_boxes',
  ],
  invoices: [
    'id',
    'number',
    'customer_id',
    'status',
    'created_at',
    'due_date',
    'subtotal',
    'tax',
    'total',
    'po_number',
  ],
  invoice_items: [
    'id',
    'invoice_id',
    'product_id',
    'name',
    'quantity',
    'product_price',
    'total_weight_kg',
    'price_per_kg',
    'total_price',
    'created_at',
  ],
  aods: [
    'id',
    'invoice_id',
    'aod_number',
    'printed_at',
    'po_number',
    'invoice_number',
    'created_at',
  ],
  activities: [
    'id',
    'customer_id',
    'type',
    'description',
    'ref_number',
    'timestamp',
    'updated_at',
  ],
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;
const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase credentials. Set VITE_SUPABASE_URL and a Supabase key.',
  );
}

if (!convexUrl) {
  throw new Error('Missing Convex URL. Set CONVEX_URL or VITE_CONVEX_URL.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const convex = new ConvexHttpClient(convexUrl);

const PAGE_SIZE = 250;
const BATCH_SIZE = 50;

async function fetchAllRows(tableName: TableName) {
  const rows: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, to);
    if (error)
      throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data.map((row) => sanitizeRow(tableName, row)));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function sanitizeRow(
  tableName: TableName,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const allowedFields = tableFieldAllowlist[tableName];
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => allowedFields.includes(key)),
  );
}

function chunk<T>(rows: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    result.push(rows.slice(index, index + size));
  }
  return result;
}

async function importInChunks<T>(label: string, funcRef: any, rows: T[]) {
  let imported = 0;

  const batches = chunk(rows, BATCH_SIZE);

  for (const [batchIndex, batch] of batches.entries()) {
    try {
      const result = await convex.mutation(funcRef, { rows: batch });
      imported += Number(result.imported ?? 0);
      console.log(`${label}: ${imported}/${rows.length}`);
    } catch (error) {
      const firstRowIndex = batchIndex * BATCH_SIZE;
      console.error(
        `Batch import failed for ${label} (${batchIndex + 1}/${batches.length})`,
      );
      console.error(
        'Failed batch row ids:',
        batch.map((row: any) => row?.id ?? '<no-id>'),
      );
      console.error('Error details:', summarizeError(error));

      for (const [offset, row] of batch.entries()) {
        await importSingleRow(label, funcRef, row, firstRowIndex + offset);
      }

      throw error;
    }
  }
}

function summarizeError(error: unknown) {
  if (error instanceof ConvexError) {
    return {
      name: error.name,
      message: error.message,
      data: error.data,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { error };
}

async function importSingleRow<T>(
  label: string,
  funcRef: any,
  row: T,
  rowIndex: number,
) {
  try {
    await convex.mutation(funcRef, { rows: [row] });
  } catch (error) {
    console.error(`Failed single-row import for ${label} at row ${rowIndex}`);
    console.error('Row payload:', row);
    console.error('Error details:', summarizeError(error));
    throw error;
  }
}

async function main() {
  console.log('Fetching Supabase data...');
  const customers = await fetchAllRows('customers');
  const products = await fetchAllRows('products');
  const invoices = await fetchAllRows('invoices');
  const invoiceItems = await fetchAllRows('invoice_items');
  const aods = await fetchAllRows('aods');
  const activities = await fetchAllRows('activities');

  console.log('Importing customers...');
  await importInChunks(
    'customers',
    anyApi.migration.importCustomers,
    customers,
  );

  console.log('Importing products...');
  await importInChunks('products', anyApi.migration.importProducts, products);

  console.log('Importing invoices...');
  await importInChunks('invoices', anyApi.migration.importInvoices, invoices);

  console.log('Importing invoice items...');
  await importInChunks(
    'invoice_items',
    anyApi.migration.importInvoiceItems,
    invoiceItems,
  );

  console.log('Importing AODs...');
  await importInChunks('aods', anyApi.migration.importAods, aods);

  console.log('Importing activities...');
  await importInChunks(
    'activities',
    anyApi.migration.importActivities,
    activities,
  );

  console.log('Seeding yearly sequences...');
  const seedResult = await convex.mutation(anyApi.migration.seedSequences, {});
  console.log('Seed result:', seedResult);
  console.log('Migration complete.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
