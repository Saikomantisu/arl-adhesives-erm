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

export const createActivity = async (params: {
  type: Activity['type'];
  customer_id: string;
  description: string;
  ref_number?: string;
}): Promise<Activity> => {
  try {
    const { type, customer_id, description, ref_number } = params;

    if (!type) throw new Error('Activity type is required');
    if (!customer_id) throw new Error('Customer ID is required');
    if (!description) throw new Error('Description is required');

    const { data, error } = await supabase
      .from('activities')
      .insert({
        customer_id,
        type,
        description,
        ref_number: ref_number ?? null,
      })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Supabase createActivity insert error:', error);
      throw new Error(`Failed to create activity: ${error.message}`);
    }

    if (!data) {
      throw new Error('Activity creation returned no data');
    }

    return data as Activity;
  } catch (err) {
    console.error('Unexpected error in createActivity:', err);
    throw err instanceof Error ? err : new Error('Unknown error while creating activity');
  }
};


