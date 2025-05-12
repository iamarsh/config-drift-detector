/**
 * Client-side error recovery utilities
 * Handles dynamic import failures and provides auto-recovery mechanisms
 */

import { logger } from './logger'

/**
 * Detects if an error is a chunk loading error (dynamic import failure)
 */
export function isChunkLoadError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('loading chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('failed to fetch') && message.includes('_next/static')
  )
}

/**
 * Attempts to recover from chunk loading errors
 * Strategy:
 * 1. Clear all caches
 * 2. Reload the page once
 * 3. If error persists, show user-friendly error
 */
export function handleChunkLoadError(error: Error): void {
  if (!isChunkLoadError(error)) {
    return
  }

  logger.warn('Chunk loading error detected, attempting recovery...', error)

  const reloadKey = 'chunk-error-reload-timestamp'
  const lastReload = sessionStorage.getItem(reloadKey)
  const now = Date.now()

  // Only auto-reload once per session, and not more than once per 5 minutes
  if (!lastReload || now - parseInt(lastReload, 10) > 5 * 60 * 1000) {
    sessionStorage.setItem(reloadKey, now.toString())

    // Clear caches before reload
    if ('caches' in globalThis) {
      globalThis.caches.keys().then((names) => {
        Promise.all(names.map((name) => globalThis.caches.delete(name))).then(() => {
          globalThis.location.reload()
        })
      })
    } else {
      globalThis.location.reload()
    }
  } else {
    logger.error('Chunk loading error persists after reload')
    // Let the error boundary handle it
    throw error
  }
}

/**
 * Wraps a dynamic import with error recovery
 * Usage: const Component = await safeImport(() => import('./Component'))
 */
export async function safeImport<T>(
  importFn: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < retries; i++) {
    try {
      return await importFn()
    } catch (error) {
      lastError = error as Error
      logger.warn(`Import attempt ${i + 1}/${retries} failed:`, error)

      // Wait before retry (exponential backoff)
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
  }

  // All retries failed
  if (lastError && isChunkLoadError(lastError)) {
    handleChunkLoadError(lastError)
  }

  throw lastError || new Error('Import failed after retries')
}

/**
 * Global error handler setup
 * Call this once in your app initialization
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') {
    return
  }

  // Handle unhandled promise rejections (like failed dynamic imports)
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof Error && isChunkLoadError(event.reason)) {
      logger.warn('Unhandled chunk loading error:', event.reason)
      event.preventDefault() // Prevent default error logging
      handleChunkLoadError(event.reason)
    }
  })

  // Handle module loading errors
  window.addEventListener('error', (event) => {
    if (event.error instanceof Error && isChunkLoadError(event.error)) {
      logger.warn('Global chunk loading error:', event.error)
      event.preventDefault()
      handleChunkLoadError(event.error)
    }
  })

  // Clear old reload timestamps on app start
  const reloadKey = 'chunk-error-reload-timestamp'
  const lastReload = sessionStorage.getItem(reloadKey)
  if (lastReload) {
    const age = Date.now() - parseInt(lastReload, 10)
    // Clear if older than 1 hour
    if (age > 60 * 60 * 1000) {
      sessionStorage.removeItem(reloadKey)
    }
  }
}

/**
 * Check if app version has changed and notify user
 * Call this periodically (e.g., every 5 minutes) to detect updates
 */
export async function checkForUpdates(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-cache',
    })

    const buildId = response.headers.get('x-build-id')
    const storedBuildId = sessionStorage.getItem('app-build-id')

    if (!storedBuildId && buildId) {
      sessionStorage.setItem('app-build-id', buildId)
      return false
    }

    if (buildId && storedBuildId && buildId !== storedBuildId) {
      logger.info('New app version detected:', buildId)
      return true
    }

    return false
  } catch (error) {
    logger.warn('Failed to check for updates:', error)
    return false
  }
}
