import { supabase } from '~/lib/supabase';
import type { Customer } from '~/lib/data';

export const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const fetchCustomerById = async (customerId: string): Promise<Customer> => {
  if (!customerId) throw new Error('Customer ID is required');

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};
