import { create } from 'zustand';
import type { InvoiceItem } from '~/lib/data';

interface SaleState {
  customer_id: string | null;
  items: InvoiceItem[];
  po_number: string;
  setCustomer: (id: string | null) => void;
  setPoNumber: (po: string) => void;
  addItem: (item: InvoiceItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearSale: () => void;
  subtotal: () => number;
  tax: () => number;
  total: () => number;
}

export const useSaleStore = create<SaleState>((set, get) => ({
  customer_id: null,
  items: [],
  po_number: '',
  setCustomer: (id) => set({ customer_id: id }),
  setPoNumber: (po) => set({ po_number: po }),
  addItem: (item) =>
    set((s) => {
      const exists = s.items.find((i) => i.product_id === item.product_id);

      if (exists) {
        return {
          items: s.items.map((i) =>
            i.product_id === item.product_id
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  total_weight_kg: (i.quantity + 1) * 25,
                  total_price: (i.quantity + 1) * i.product_price,
                }
              : i,
          ),
        };
      }

      return { items: [...s.items, item] };
    }),
  removeItem: (product_id) =>
    set((s) => ({
      items: s.items.filter((i) => i.product_id !== product_id),
    })),
  updateQuantity: (product_id, qty) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.product_id === product_id
          ? { ...i, quantity: qty, total_price: qty * i.product_price, total_weight_kg: qty * 25 }
          : i,
      ),
    })),
  clearSale: () => set({ customer_id: null, items: [], po_number: '' }),
  subtotal: () => get().items.reduce((sum, i) => sum + i.total_price, 0),
  tax: () => get().items.reduce((sum, i) => sum + i.total_price, 0) * 0.18,
  total: () => {
    const sub = get().items.reduce((sum, i) => sum + i.total_price, 0);
    return sub + sub * 0.18;
  },
}));
