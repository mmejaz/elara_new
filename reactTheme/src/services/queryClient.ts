import { QueryClient } from '@tanstack/react-query'

// Shared TanStack Query client. Sensible defaults for an admin panel: don't
// refetch on window focus, treat data as fresh for 5 min so revisiting a page
// serves the cache instead of refetching.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
})
