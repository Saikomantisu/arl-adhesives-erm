import { convexApi, convexHttpClient } from '~/lib/convex';
import type { Product } from '~/lib/data';

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    return (await convexHttpClient.query(
      convexApi.products.list,
      {},
    )) as Product[];
  } catch (err) {
    console.error('Convex fetchProducts error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while fetching products');
  }
};

export const decrementProductStockBoxes = async (
  product_id: string,
  amount: number,
): Promise<Product> => {
  throw new Error(
    `decrementProductStockBoxes is no longer called directly. Stock updates now happen inside invoices.create for product ${product_id} and amount ${amount}.`,
  );
};
