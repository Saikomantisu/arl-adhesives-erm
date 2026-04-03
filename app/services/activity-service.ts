import { convexApi, convexHttpClient } from '~/lib/convex';
import type { Activity } from '~/lib/data';

export const fetchActivitiesByCustomer = async (
  customer_id: string,
): Promise<Activity[]> => {
  try {
    if (!customer_id) {
      throw new Error('Customer ID is required');
    }

    return (await convexHttpClient.query(convexApi.activities.listByCustomer, {
      customerId: customer_id,
    })) as Activity[];
  } catch (err) {
    console.error('Convex fetchActivitiesByCustomer error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while fetching activities');
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

    const data = await convexHttpClient.mutation(convexApi.activities.create, {
      customerId: customer_id,
      type,
      description,
      refNumber: ref_number ?? undefined,
    });

    if (!data) {
      throw new Error('Activity creation returned no data');
    }

    return data as Activity;
  } catch (err) {
    console.error('Convex createActivity error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while creating activity');
  }
};
