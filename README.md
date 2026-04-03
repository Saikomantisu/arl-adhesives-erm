# ARL Adhesives ERM

Internal ERP-style application for ARL Adhesives. The app covers day-to-day sales and inventory workflows, including invoice generation, quotation creation, advice of dispatch (AOD) printing, customer tracking, and stock visibility.

## Features

- Dashboard with revenue, outstanding payment, and stock-value KPIs
- Inventory view with stock thresholds and velocity snapshots
- Invoice creation with stock deduction and payment status tracking
- Quotation creation with downloadable PDF output
- AOD generation and print support for invoices
- Customer directory with activity history

## Stack

- React Router 7
- Convex
- TanStack Query
- Zustand
- Tailwind CSS
- Framer Motion

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Add environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Start Convex in development mode:

   ```bash
   pnpm convex:dev
   ```

4. Start the frontend:

   ```bash
   pnpm dev
   ```

The app will be available at `http://localhost:5173`.

## Environment

The project expects:

- `VITE_CONVEX_URL`: Convex deployment URL used by the frontend client

See [`./.env.example`](./.env.example) for the expected shape.

## Project Structure

- [`app/`](./app): React Router frontend, UI components, routes, stores, and print helpers
- [`convex/`](./convex): Convex schema, queries, mutations, and shared backend helpers
- [`app/store/`](./app/store): Zustand draft and UI state
- [`app/lib/print/`](./app/lib/print): PDF and print-specific rendering helpers

## Commands

- `pnpm dev`: Start the React Router development server
- `pnpm convex:dev`: Start Convex development mode
- `pnpm typecheck`: Generate route types and run TypeScript checks
- `pnpm build`: Build the client and server bundles
- `pnpm format`: Run Prettier and rewrite files
- `pnpm format:check`: Check formatting without rewriting files

## Notes

- The current codebase is optimized for internal operations rather than a generalized multi-tenant ERP.
- Lists are currently rendered as full collections rather than paginated views.
- Document layouts are tuned for ARL Adhesives invoice, quotation, and AOD output.
