import { convexApi, convexHttpClient } from '~/lib/convex';
import type { Customer } from '~/lib/data';

export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    return (await convexHttpClient.query(
      convexApi.customers.list,
      {},
    )) as Customer[];
  } catch (err) {
    console.error('Convex fetchCustomers error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while fetching customers');
  }
};

export const fetchCustomerById = async (
  customerId: string,
): Promise<Customer> => {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const customer = await convexHttpClient.query(convexApi.customers.get, {
      customerId,
    });
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }
    return customer as Customer;
  } catch (err) {
    console.error('Convex fetchCustomerById error:', err);
    throw err instanceof Error
      ? err
      : new Error('Unknown error while fetching customer');
  }
};
