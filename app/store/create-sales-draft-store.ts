import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { SalesLineItem } from '~/lib/data';

interface ProductPricingSnapshot {
  effective_price_per_kg: number;
  effective_product_price: number;
  has_customer_override: boolean;
}

export interface SalesDraftState {
  customer_id: string | null;
  items: SalesLineItem[];
  po_number: string;
  setCustomer: (id: string | null) => void;
  setPoNumber: (po: string) => void;
  addItem: (item: SalesLineItem) => void;
  addPartialItem: (lineId: string) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  updateWeight: (lineId: string, weightKg: number) => void;
  repriceItems: (
    pricingByProductId: Record<string, ProductPricingSnapshot>,
  ) => void;
  clearSale: () => void;
  subtotal: () => number;
  tax: () => number;
  total: () => number;
}

export type SalesDraftStore = UseBoundStore<StoreApi<SalesDraftState>>;

const createLineId = (productId: string) =>
  `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getPackageWeightKg = (item: SalesLineItem) =>
  item.quantity > 0 ? item.total_weight_kg / item.quantity : 0;

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
          (i) => i.product_id === item.product_id && !i.is_custom_weight,
        );

        if (!existing) {
          return {
            items: [
              ...state.items,
              {
                ...item,
                line_id: item.line_id ?? createLineId(item.product_id),
                total_price: item.total_weight_kg * item.price_per_kg,
              },
            ],
          };
        }

        const nextQuantity = existing.quantity + 1;
        const packageWeightKg = getPackageWeightKg(existing);

        return {
          items: state.items.map((line) =>
            line.line_id === existing.line_id
              ? {
                  ...line,
                  quantity: nextQuantity,
                  total_weight_kg: nextQuantity * packageWeightKg,
                  total_price:
                    nextQuantity * packageWeightKg * line.price_per_kg,
                }
              : line,
          ),
        };
      }),
    addPartialItem: (line_id) =>
      set((state) => {
        const source = state.items.find((item) => item.line_id === line_id);
        if (!source) return state;

        const packageWeightKg = getPackageWeightKg(source);
        const totalWeightKg = packageWeightKg / 2;

        return {
          items: [
            ...state.items,
            {
              ...source,
              line_id: createLineId(source.product_id),
              quantity: 1,
              total_weight_kg: totalWeightKg,
              total_price: totalWeightKg * source.price_per_kg,
              is_custom_weight: true,
            },
          ],
        };
      }),
    removeItem: (line_id) =>
      set((state) => ({
        items: state.items.filter((item) => item.line_id !== line_id),
      })),
    updateQuantity: (line_id, qty) =>
      set((state) => ({
        items: state.items.map((item) => {
          if (item.line_id !== line_id) return item;

          const quantity = Math.max(1, qty);
          const packageWeightKg = getPackageWeightKg(item);
          const totalWeightKg = item.is_custom_weight
            ? item.total_weight_kg
            : quantity * packageWeightKg;

          return {
            ...item,
            quantity,
            total_weight_kg: totalWeightKg,
            total_price: totalWeightKg * item.price_per_kg,
          };
        }),
      })),
    updateWeight: (line_id, weightKg) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.line_id === line_id
            ? {
                ...item,
                total_weight_kg: Math.max(0, weightKg),
                total_price: Math.max(0, weightKg) * item.price_per_kg,
                is_custom_weight: true,
              }
            : item,
        ),
      })),
    repriceItems: (pricingByProductId) =>
      set((state) => ({
        items: state.items.map((item) => {
          const pricing = pricingByProductId[item.product_id];
          if (!pricing) return item;

          const packageWeightKg = getPackageWeightKg(item);
          const totalWeightKg = item.is_custom_weight
            ? item.total_weight_kg
            : item.quantity * packageWeightKg;

          return {
            ...item,
            price_per_kg: pricing.effective_price_per_kg,
            product_price: pricing.effective_product_price,
            total_weight_kg: totalWeightKg,
            total_price: totalWeightKg * pricing.effective_price_per_kg,
            has_customer_override: pricing.has_customer_override,
          };
        }),
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
