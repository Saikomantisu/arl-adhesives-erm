import { supabase } from '~/lib/supabase';
import type { Activity } from '~/lib/data';

export const fetchActivitiesByCustomer = async (customerId: string): Promise<Activity[]> => {
  if (!customerId) throw new Error('Customer ID is required');

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('customer_id', customerId);
  // .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};
