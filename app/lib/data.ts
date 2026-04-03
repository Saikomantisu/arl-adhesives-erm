export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export type CustomerStatus = 'active' | 'overdue' | 'new';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price_per_kg: number;
  package_weight_kg: number;
  threshold: number;
  current_stock_boxes: number;
  stock_velocity: number[];
}

export interface Customer {
  id?: string;
  email: string;
  phone: string;
  payee: string;
  avatar: string;
  company: string;
  address: string;
  vat_reg_no: string;
  activities: Activity[];
  status: CustomerStatus;
  lifetime_value: number;
}

export interface Activity {
  id?: string;
  type:
    | 'invoice_generated'
    | 'quotation_generated'
    | 'aod_generated'
    | 'invoice_paid'
    | 'aod_signed'
    | 'invoice_pending'
    | 'invoice_overdue';
  description: string;
  timestamp: Date;
  ref_number?: string;
}

export interface Invoice {
  id?: string;
  number?: string;
  customer_id: string;
  status?: InvoiceStatus;
  created_at?: Date;
  due_date?: Date;
  subtotal: number;
  tax: number;
  total: number;
  po_number: string;
}

export interface Quotation {
  id?: string;
  number?: string;
  customer_id: string;
  created_at?: Date;
  subtotal: number;
  tax: number;
  total: number;
  po_number?: string | null;
}

export interface Aod {
  id?: string;
  invoice_id: string;
  aod_number: string;
  printed_at: Date;
  po_number?: string | null;
  invoice_number?: string | null;
  created_at?: Date;
}

export interface SalesLineItem {
  id?: string;
  product_id: string;
  name: string;
  quantity: number;
  product_price: number;
  total_weight_kg: number; // quantity * package_weight_kg
  price_per_kg: number; // Your base rate (e.g., 2750)
  total_price: number; // total_weight_kg * price_per_kg
}

export interface InvoiceItem extends SalesLineItem {
  invoice_id?: string;
}

export interface QuotationItem extends SalesLineItem {
  quotation_id?: string;
}

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-UK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(n);

export const invoiceFormatCurrency = (n: number) =>
  new Intl.NumberFormat('en-UK', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const timeAgo = (date: Date): string => {
  const now = new Date();
  const date_obj = new Date(date);

  const diffMs = now.getTime() - date_obj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';

  return `${Math.floor(diffDays / 7)} weeks ago`;
};
