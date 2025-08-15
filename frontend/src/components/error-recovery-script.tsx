'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandlers } from '@/lib/error-recovery'

/**
 * Client-side component that initializes error recovery mechanisms
 * Must be rendered in the root layout
 */
export function ErrorRecoveryScript() {
  useEffect(() => {
    // Initialize global error handlers
    setupGlobalErrorHandlers()

    // Log initialization
    console.log('[Error Recovery] Handlers initialized')

    return () => {
      // Cleanup is handled by the setupGlobalErrorHandlers
    }
  }, [])

  return null // This component doesn't render anything
}
