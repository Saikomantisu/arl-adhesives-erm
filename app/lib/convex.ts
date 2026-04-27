import { QueryClient } from '@tanstack/react-query';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { useAuth } from '@clerk/react-router';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../../convex/_generated/api';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing required environment variable VITE_CONVEX_URL');
}

export const convexApi = api;
export const convexReactClient = new ConvexReactClient(convexUrl);
export const convexQueryClient = new ConvexQueryClient(convexReactClient);

type ConvexAuthDiagnostic = {
  detail: string;
  hint: string;
};

const ConvexAuthDiagnosticContext = createContext<ConvexAuthDiagnostic | null>(
  null,
);

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
  const clerkAuth = useAuth();
  const [diagnostic, setDiagnostic] = useState<ConvexAuthDiagnostic | null>(
    null,
  );

  const useAuthForConvex = useMemo(
    () =>
      function useAuthFromClerkForConvex() {
        const fetchAccessToken = useCallback(
          async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
            try {
              const token =
                clerkAuth.sessionClaims?.aud === 'convex'
                  ? await clerkAuth.getToken({
                      skipCache: forceRefreshToken,
                    })
                  : await clerkAuth.getToken({
                      template: 'convex',
                      skipCache: forceRefreshToken,
                    });

              if (!token && clerkAuth.isSignedIn) {
                setDiagnostic({
                  detail:
                    'Clerk did not return a Convex access token for this signed-in session.',
                  hint: 'Enable the Clerk Convex integration or create a JWT template named "convex", then sign out and sign back in.',
                });
              } else {
                setDiagnostic(null);
              }

              return token;
            } catch (error) {
              const detail =
                error instanceof Error
                  ? error.message
                  : 'Unknown Clerk token error';

              setDiagnostic({
                detail,
                hint: 'Check that the current Clerk application can issue a "convex" token and that CLERK_JWT_ISSUER_DOMAIN matches that same Clerk app.',
              });

              return null;
            }
          },
          [
            clerkAuth.getToken,
            clerkAuth.isSignedIn,
            clerkAuth.sessionClaims?.aud,
          ],
        );

        return useMemo(
          () => ({
            isLoading: !clerkAuth.isLoaded,
            isAuthenticated: clerkAuth.isSignedIn ?? false,
            fetchAccessToken,
          }),
          [fetchAccessToken]
        );
      },
    [
      clerkAuth.getToken,
      clerkAuth.isLoaded,
      clerkAuth.isSignedIn,
      clerkAuth.sessionClaims?.aud,
    ],
  );

  return (
    createElement(
      ConvexAuthDiagnosticContext.Provider,
      { value: diagnostic },
      createElement(
        ConvexProviderWithAuth,
        { client: convexReactClient, useAuth: useAuthForConvex },
        children,
      ),
    )
  );
}

export function useConvexAuthDiagnostic() {
  return useContext(ConvexAuthDiagnosticContext);
}
