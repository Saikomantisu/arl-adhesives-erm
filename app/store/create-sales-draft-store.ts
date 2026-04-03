import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { SalesLineItem } from '~/lib/data';

export interface SalesDraftState {
  customer_id: string | null;
  items: SalesLineItem[];
  po_number: string;
  setCustomer: (id: string | null) => void;
  setPoNumber: (po: string) => void;
  addItem: (item: SalesLineItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearSale: () => void;
  subtotal: () => number;
  tax: () => number;
  total: () => number;
}

export type SalesDraftStore = UseBoundStore<StoreApi<SalesDraftState>>;

export const createSalesDraftStore = (): SalesDraftStore =>
  create<SalesDraftState>((set, get) => ({
    customer_id: null,
    items: [],
    po_number: '',
    setCustomer: (id) => set({ customer_id: id }),
    setPoNumber: (po) => set({ po_number: po }),
    addItem: (item) =>
      set((state) => {
        const existing = state.items.find(
          (i) => i.product_id === item.product_id,
        );

        if (!existing) {
          return { items: [...state.items, item] };
        }

        const nextQuantity = existing.quantity + 1;

        return {
          items: state.items.map((line) =>
            line.product_id === item.product_id
              ? {
                  ...line,
                  quantity: nextQuantity,
                  total_weight_kg:
                    nextQuantity * (line.total_weight_kg / line.quantity),
                  total_price: nextQuantity * line.product_price,
                }
              : line,
          ),
        };
      }),
    removeItem: (product_id) =>
      set((state) => ({
        items: state.items.filter((item) => item.product_id !== product_id),
      })),
    updateQuantity: (product_id, qty) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.product_id === product_id
            ? {
                ...item,
                quantity: qty,
                total_weight_kg: qty * (item.total_weight_kg / item.quantity),
                total_price: qty * item.product_price,
              }
            : item,
        ),
      })),
    clearSale: () => set({ customer_id: null, items: [], po_number: '' }),
    subtotal: () =>
      get().items.reduce((sum, item) => sum + item.total_price, 0),
    tax: () =>
      get().items.reduce((sum, item) => sum + item.total_price, 0) * 0.18,
    total: () => {
      const subtotal = get().items.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );
      return subtotal + subtotal * 0.18;
    },
  }));
