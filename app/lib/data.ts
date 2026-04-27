export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export type CustomerStatus = 'active' | 'overdue' | 'new';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price_per_kg: number;
  default_price_per_kg?: number;
  effective_price_per_kg?: number;
  effective_product_price?: number;
  has_customer_override?: boolean;
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
  timestamp: number;
  ref_number?: string;
}

export interface Invoice {
  id?: string;
  number?: string;
  customer_id: string;
  status?: InvoiceStatus;
  created_at?: number;
  due_date?: number;
  subtotal: number;
  tax: number;
  total: number;
  po_number: string;
}

export interface Quotation {
  id?: string;
  number?: string;
  customer_id: string;
  created_at?: number;
  subtotal: number;
  tax: number;
  total: number;
  po_number?: string | null;
}

export interface Aod {
  id?: string;
  invoice_id: string;
  aod_number: string;
  printed_at: number;
  po_number?: string | null;
  invoice_number?: string | null;
  created_at?: number;
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
  has_customer_override?: boolean;
}

export interface InvoiceItem extends SalesLineItem {
  invoice_id?: string;
}

export interface QuotationItem extends SalesLineItem {
  quotation_id?: string;
}

export interface CustomerProductPrice {
  id?: string;
  customer_id: string;
  product_id: string;
  sku: string;
  name: string;
  package_weight_kg: number;
  default_price_per_kg: number;
  price_per_kg: number;
  effective_product_price: number;
  created_at?: number;
  updated_at?: number;
}

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(n);

export const invoiceFormatCurrency = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const timeAgo = (value: number | Date): string => {
  const now = new Date();
  const date_obj = new Date(value);

  const diffMs = now.getTime() - date_obj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';

  return `${Math.floor(diffDays / 7)} weeks ago`;
};
