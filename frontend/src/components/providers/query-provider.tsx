'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'

/**
 * React Query Provider Component
 *
 * Provides centralized data fetching, caching, and state management
 * across the entire application.
 *
 * Features:
 * - Automatic request deduplication
 * - Background refetching
 * - Cache management
 * - Optimistic updates
 * - Error handling and retries
 *
 * Configuration:
 * - defaultOptions: Global query and mutation defaults
 * - staleTime: How long data is considered fresh
 * - gcTime: How long unused data stays in cache
 * - retry: Number of retry attempts for failed requests
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a client instance per component tree (not global)
  // This ensures stable cache across hot reloads in development
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Global defaults for all queries
            staleTime: 30000, // 30 seconds - data is fresh
            gcTime: 300000, // 5 minutes - unused data stays in cache
            retry: 1, // Retry failed requests once
            refetchOnWindowFocus: true, // Refetch when tab becomes active
            refetchOnReconnect: true, // Refetch when internet reconnects
            refetchOnMount: true, // Refetch on component mount if stale
          },
          mutations: {
            // Global defaults for all mutations
            retry: 0, // Don't retry mutations (can cause duplicate actions)
          },
        },
      })
  )

  // Periodically clear stale queries to prevent memory leaks
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.clear() // Clear cache periodically
    }, 600000) // Every 10 minutes

    return () => clearInterval(interval)
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  )
}
