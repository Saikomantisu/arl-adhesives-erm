import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import type { Route } from './+types/root';
import {
  ClerkProvider,
  SignInButton,
  SignOutButton,
  useAuth,
} from '@clerk/react-router';
import { clerkMiddleware, rootAuthLoader } from '@clerk/react-router/server';
import { QueryClientProvider } from '@tanstack/react-query';
import { useConvexAuth } from 'convex/react';
import { ConvexAppProvider, queryClient } from '~/lib/convex';
import './app.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error(
    'Missing required environment variable VITE_CLERK_PUBLISHABLE_KEY',
  );
}

export const links: Route.LinksFunction = () => [];
export const middleware: Route.MiddlewareFunction[] = [clerkMiddleware()];
export const loader = (args: Route.LoaderArgs) => rootAuthLoader(args);

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <ClerkProvider
      loaderData={loaderData}
      publishableKey={clerkPublishableKey}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
      appearance={{
        elements: {
          footerAction: 'hidden',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ConvexAppProvider>
          <ClerkAuthGate />
        </ConvexAppProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function ClerkAuthGate() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <FullPageLoading />;
  }

  if (!isSignedIn) {
    return <FullPageSignIn />;
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return <FullPageLoading />;
  }

  if (!isAuthenticated) {
    return <FullPageAuthError />;
  }

  return (
    <main>
      <Outlet />
    </main>
  );
}

function FullPageLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
      Loading...
    </main>
  );
}

function FullPageSignIn() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            ARL Adhesives ERM
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in to continue
          </h1>
        </div>

        <SignInButton mode="modal">
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Sign in
          </button>
        </SignInButton>
      </div>
    </main>
  );
}

function FullPageAuthError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            ARL Adhesives ERM
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Could not load your workspace
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Your sign-in worked, but your session could not connect to the
            database. Please sign out, then sign in again.
          </p>
        </div>

        <SignOutButton>
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
          >
            Sign out
          </button>
        </SignOutButton>
      </div>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
