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
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key used by the frontend
- `CLERK_SECRET_KEY`: Clerk secret key used by the React Router server runtime
- `CLERK_JWT_ISSUER_DOMAIN`: Clerk Frontend API URL used by Convex to validate Clerk JWTs

Set `CLERK_JWT_ISSUER_DOMAIN` on the Convex deployment as well as in local server environment files. Convex codegen and deploy will fail until that deployment environment variable exists.

Docker builds also need the public build-time values passed as build args:

```bash
docker build \
  --build-arg VITE_CONVEX_URL="$VITE_CONVEX_URL" \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY="$VITE_CLERK_PUBLISHABLE_KEY" \
  --build-arg CLERK_JWT_ISSUER_DOMAIN="$CLERK_JWT_ISSUER_DOMAIN" \
  -t arl-adhesives-erm .
```

Set `CLERK_SECRET_KEY` as a runtime environment variable on the production server or container host.

See [`./.env.example`](./.env.example) for the expected shape.

### Production Clerk and Convex auth

If production sign-in works but Convex data stays empty, check the production Clerk application first:

- Activate the Clerk Convex integration in the production Clerk app, or create a JWT template named `convex`.
- Confirm the production frontend uses the production `VITE_CLERK_PUBLISHABLE_KEY`.
- Confirm the production Convex deployment has `CLERK_JWT_ISSUER_DOMAIN` set to the same Clerk Frontend API URL used by that production Clerk app.
- Deploy Convex after changing `CLERK_JWT_ISSUER_DOMAIN` or `convex/auth.config.ts`.
- Sign out completely and sign back in after changing Clerk JWT settings.

Requests to `/tokens/convex` returning 404 usually mean the signed-in Clerk app cannot issue a `convex` token for the current production session.

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
