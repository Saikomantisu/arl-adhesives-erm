import { supabase } from '~/lib/supabase';
import type { Customer } from '~/lib/data';

export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchCustomers error:', error);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    return data ?? [];
  } catch (err) {
    console.error('Unexpected error in fetchCustomers:', err);
    throw err instanceof Error ? err : new Error('Unknown error while fetching customers');
  }
};

export const fetchCustomerById = async (customerId: string): Promise<Customer> => {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) {
      console.error('Supabase fetchCustomerById error:', error);
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Unexpected error in fetchCustomerById:', err);
    throw err instanceof Error ? err : new Error('Unknown error while fetching customer');
  }
};
