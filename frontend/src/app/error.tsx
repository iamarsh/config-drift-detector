'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from '@/components/ui/icons'

/**
 * Global Error Boundary for the application
 * Catches and handles runtime errors gracefully
 *
 * Common scenarios handled:
 * - Dynamic import failures (chunk loading errors)
 * - Network connectivity issues
 * - React rendering errors
 * - Unexpected runtime exceptions
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry, DataDog)
    console.error('Application error:', error)

    // Check if it's a chunk loading error (dynamic import failure)
    if (
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('Loading chunk')
    ) {
      // Auto-reload once to fetch latest assets
      // This handles most stale cache issues
      const hasReloaded = sessionStorage.getItem('error-reload')
      if (!hasReloaded) {
        sessionStorage.setItem('error-reload', 'true')
        window.location.reload()
        return
      }
    }
  }, [error])

  const handleReset = () => {
    // Clear error reload flag
    sessionStorage.removeItem('error-reload')
    // Clear any stale caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name))
      })
    }
    // Try to recover
    reset()
  }

  const handleHardReload = () => {
    sessionStorage.clear()
    window.location.href = window.location.origin
  }

  // Check if it's a chunk loading error
  const isChunkError =
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed') ||
    error.message.includes('Loading chunk')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-lg border border-border p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-critical/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-critical" />
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {isChunkError ? 'App Update Available' : 'Something Went Wrong'}
          </h1>

          <p className="text-text-secondary mb-6">
            {isChunkError
              ? 'A new version of the app is available. Please reload to get the latest updates.'
              : 'An unexpected error occurred. We apologize for the inconvenience.'}
          </p>

          {!isChunkError && (
            <div className="w-full mb-6 p-4 rounded-md bg-surface-elevated border border-border">
              <p className="text-xs text-text-secondary font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-text-secondary mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleHardReload}
              className="flex-1 px-4 py-2 bg-aws-orange text-white rounded-md hover:bg-aws-orange/90 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {isChunkError ? 'Update Now' : 'Reload App'}
            </button>

            {!isChunkError && (
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-surface-elevated text-text-primary rounded-md hover:bg-surface border border-border transition-colors font-medium"
              >
                Try Again
              </button>
            )}
          </div>

          <p className="text-xs text-text-secondary mt-4">
            If the problem persists, please{' '}
            <a
              href="https://github.com/iamarsh/config-drift-detector/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aws-orange hover:underline"
            >
              report this issue
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
