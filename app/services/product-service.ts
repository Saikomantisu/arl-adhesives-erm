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

export const decrementProductStockBoxes = async (
  product_id: string,
  amount: number,
): Promise<Product> => {
  if (!product_id) throw new Error('product_id is required');
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer');
  }

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (fetchError) {
      console.error('Supabase decrementProductStockBoxes fetch error:', fetchError);
      throw new Error(`Failed to fetch product: ${fetchError.message}`);
    }

    if (!existing) throw new Error('Product not found');

    const current = Number(existing.current_stock_boxes ?? 0);
    if (!Number.isFinite(current)) throw new Error('Invalid current_stock_boxes value');

    const next = current - amount;
    if (next < 0) throw new Error(`Insufficient stock: have ${current}, tried to deduct ${amount}`);

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({ current_stock_boxes: next })
      .eq('id', product_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Supabase decrementProductStockBoxes update error:', updateError);
      throw new Error(`Failed to deduct stock: ${updateError.message}`);
    }

    if (!updated) throw new Error('Stock update returned no data');

    return updated as Product;
  } catch (err) {
    console.error('Unexpected error in decrementProductStockBoxes:', err);
    throw err instanceof Error ? err : new Error('Unknown error while deducting product stock');
  }
};
