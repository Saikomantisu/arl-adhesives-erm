import { supabase } from '~/lib/supabase';
import type { Product } from '~/lib/data';

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchProducts error:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data ?? [];
  } catch (err) {
    console.error('Unexpected error in fetchProducts:', err);
    throw err instanceof Error ? err : new Error('Unknown error while fetching products');
  }
};
