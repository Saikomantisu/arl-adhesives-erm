import { QueryClient } from '@tanstack/react-query';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ConvexHttpClient } from 'convex/browser';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import { anyApi } from 'convex/server';
import { createElement, type ReactNode } from 'react';

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://example.invalid';

export const convexApi = anyApi;
export const convexReactClient = new ConvexReactClient(convexUrl);
export const convexHttpClient = new ConvexHttpClient(convexUrl);
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
  return createElement(ConvexProvider, { client: convexReactClient }, children);
}
