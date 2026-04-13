import { QueryClient } from '@tanstack/react-query';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { useAuth } from '@clerk/react-router';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { createElement, type ReactNode } from 'react';
import { api } from '../../convex/_generated/api';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing required environment variable VITE_CONVEX_URL');
}

export const convexApi = api;
export const convexReactClient = new ConvexReactClient(convexUrl);
export const convexQueryClient = new ConvexQueryClient(convexReactClient);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 30_000,
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});

convexQueryClient.connect(queryClient);

export function ConvexAppProvider({ children }: { children: ReactNode }) {
  return createElement(ConvexProviderWithClerk, {
    client: convexReactClient,
    useAuth,
    children,
  });
}
