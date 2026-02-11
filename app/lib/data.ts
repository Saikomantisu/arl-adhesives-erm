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
  number: string;
  customer_id: string;
  status: InvoiceStatus;
  created_at: Date;
  due_date: Date;
  subtotal: number;
  tax: number;
  total: number;
  po_number?: string;
}

export interface InvoiceItem {
  id?: string;
  product_id: string;
  name: string;
  quantity: number;
  product_price: number;
  total_weight_kg: number; // quantity * package_weight_kg
  price_per_kg: number; // Your base rate (e.g., 2750)
  total_price: number; // total_weight_kg * price_per_kg
}

export const customers: Customer[] = [
  {
    id: 'c1',
    email: 'saman@bogawantalawa.com',
    phone: '+91 98765 43210',
    company: 'Bogawantalawa Tea Ceylon (Pvt) Ltd',
    address: 'Export Processing Centre, No. 24, Parakkrama Road, Mattumagala, Ragama.',
    vat_reg_no: '29AABCI1234F1Z5',
    status: 'active',
    lifetime_value: 4850000,
    avatar: 'BK',
    activities: [
      {
        id: 'a1',
        type: 'invoice_paid',
        description: 'Invoice #107 - Flat Bench x4 + Barbell x6',
        timestamp: new Date('2026-06-27'),
        refNumber: 'INV-107',
      },
      {
        id: 'a1',
        type: 'invoice_paid',
        description: 'Invoice #107 - Flat Bench x4 + Barbell x6',
        timestamp: new Date('2026-06-27'),
        refNumber: 'INV-107',
      },
      {
        id: 'a2',
        type: 'quotation',
        description: 'Quotation for bulk Resistance Band order (200 sets)',
        timestamp: new Date('2026-06-30'),
      },
      {
        id: 'a3',
        type: 'aod_signed',
        description: 'Acknowledgement of Delivery - Bench Press Station x4',
        timestamp: new Date('2026-06-25'),
      },
      {
        id: 'a4',
        type: 'aod_signed',
        description: 'Acknowledgement of Delivery - Bench Press Station x4',
        timestamp: new Date('2026-06-25'),
      },
    ],
  },
  {
    id: 'c2',
    email: 'prabath@sanmikfood.lk',
    phone: '+91 98765 43210',
    company: 'Sanmik Food (Pvt) Ltd',
    address: '1D, Nalapaha, Diulapitiya.',
    vat_reg_no: '114692425',
    status: 'active',
    lifetime_value: 5000000,
    avatar: 'SF',
    activities: [
      {
        id: 'a1',
        type: 'invoice_paid',
        description: 'Invoice #107 - Flat Bench x4 + Barbell x6',
        timestamp: new Date('2026-06-27'),
        refNumber: 'INV-107',
      },
      {
        id: 'a2',
        type: 'quotation',
        description: 'Quotation for bulk Resistance Band order (200 sets)',
        timestamp: new Date('2026-06-30'),
      },
      {
        id: 'a3',
        type: 'aod_signed',
        description: 'Acknowledgement of Delivery - Bench Press Station x4',
        timestamp: new Date('2026-06-25'),
      },
    ],
  },
];

export const invoices: Invoice[] = [
  {
    id: 'inv1',
    number: 'INV-26/02/02',
    customerId: 'c1',
    items: [
      {
        productId: 'p8',
        name: 'Flat Bench Press Station',
        quantity: 4,
        unitPrice: 22000,
        total: 88000,
      },
      {
        productId: 'p6',
        name: 'Olympic Barbell 7ft (20kg)',
        quantity: 6,
        unitPrice: 12000,
        total: 72000,
      },
    ],
    status: 'paid',
    createdAt: new Date('2026-06-20'),
    dueDate: new Date('2026-06-30'),
    subtotal: 160000,
    tax: 28800,
    total: 188800,
  },
  {
    id: 'inv2',
    number: 'INV-112',
    customerId: 'c2',
    items: [
      {
        productId: 'p2',
        name: 'Full-Stack SaaS Build',
        quantity: 1,
        unitPrice: 250000,
        total: 250000,
      },
    ],
    status: 'overdue',
    createdAt: new Date('2026-06-01'),
    dueDate: new Date('2026-06-15'),
    subtotal: 250000,
    tax: 45000,
    total: 295000,
  },
  {
    id: 'inv3',
    number: 'INV-115',
    customerId: 'c3',
    items: [
      {
        productId: 'p5',
        name: 'Adjustable Dumbbells (Pair, 24kg)',
        quantity: 10,
        unitPrice: 8500,
        total: 85000,
      },
    ],
    status: 'pending',
    createdAt: new Date('2026-06-28'),
    dueDate: new Date('2026-07-10'),
    subtotal: 85000,
    tax: 15300,
    total: 100300,
  },
  {
    id: 'inv4',
    number: 'INV-118',
    customerId: 'c4',
    items: [
      {
        productId: 'p1',
        name: 'Landing Page Design & Dev',
        quantity: 1,
        unitPrice: 45000,
        total: 45000,
      },
    ],
    status: 'pending',
    createdAt: new Date('2026-07-01'),
    dueDate: new Date('2026-07-15'),
    subtotal: 45000,
    tax: 8100,
    total: 53100,
  },
];

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(n);

export const invoiceFormatCurrency = (n: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const getCustomer = (id: string) => customers.find((c) => c.id === id);

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
