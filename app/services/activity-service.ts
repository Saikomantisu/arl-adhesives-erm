import { supabase } from '~/lib/supabase';
import type { Activity } from '~/lib/data';

export const fetchActivitiesByCustomer = async (customer_id: string): Promise<Activity[]> => {
  try {
    if (!customer_id) {
      throw new Error('Customer ID is required');
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('customer_id', customer_id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Supabase fetchActivitiesByCustomer error:', error);
      throw new Error(`Failed to fetch activities: ${error.message}`);
    }

    return data ?? [];
  } catch (err) {
    console.error('Unexpected error in fetchActivitiesByCustomer:', err);
    throw err instanceof Error ? err : new Error('Unknown error while fetching activities');
  }
};
