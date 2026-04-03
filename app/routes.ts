import {
  type RouteConfig,
  route,
  layout,
  index,
} from '@react-router/dev/routes';

export default [
  layout('layouts/dashboard-layout.tsx', [
    index('routes/home.tsx'),
    route('sales', 'routes/sales/index.tsx'),
    route('sales/new', 'routes/sales/new.tsx'),
    route('inventory', 'routes/inventory/index.tsx'),
    route('customers', 'routes/customers/index.tsx'),
    route('customers/:customerId', 'routes/customers/$customerId.tsx'),
  ]),
] satisfies RouteConfig;
