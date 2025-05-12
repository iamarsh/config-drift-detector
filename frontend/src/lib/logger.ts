/**
 * Environment-aware logger utility
 *
 * Purpose: Prevent infrastructure details from leaking to production browser consoles
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.error('Something went wrong', error)
 *   logger.warn('Warning message')
 *   logger.info('Info message')
 *
 * Behavior:
 *   - Development: Logs to browser console for debugging
 *   - Production: Suppresses output (prevents information disclosure)
 *
 * Future enhancements:
 *   - Send production errors to monitoring service (e.g., Sentry, DataDog)
 *   - Add structured logging with context
 *   - Add log levels configuration
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface Logger {
  error: (...args: any[]) => void
  warn: (...args: any[]) => void
  info: (...args: any[]) => void
  debug: (...args: any[]) => void
  log: (...args: any[]) => void
}

/**
 * Determines if logging should be enabled based on environment
 */
function shouldLog(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Future: Send errors to monitoring service
 * Placeholder for production error reporting integration
 */
function sendToMonitoring(level: LogLevel, ...args: any[]): void {
  // TODO: Integrate with monitoring service (Sentry, DataDog, etc.)
  // Example:
  // if (process.env.NODE_ENV === 'production' && level === 'error') {
  //   Sentry.captureException(args[0])
  // }
}

/**
 * Environment-aware logger
 * Only logs to console in development mode
 */
export const logger: Logger = {
  error: (...args: any[]) => {
    if (shouldLog()) {
      console.error(...args)
    }
    // In production, could send to monitoring service
    sendToMonitoring('error', ...args)
  },

  warn: (...args: any[]) => {
    if (shouldLog()) {
      console.warn(...args)
    }
    sendToMonitoring('warn', ...args)
  },

  info: (...args: any[]) => {
    if (shouldLog()) {
      console.info(...args)
    }
    sendToMonitoring('info', ...args)
  },

  debug: (...args: any[]) => {
    if (shouldLog()) {
      console.debug(...args)
    }
    sendToMonitoring('debug', ...args)
  },

  log: (...args: any[]) => {
    if (shouldLog()) {
      console.log(...args)
    }
  },
}

/**
 * Export default for convenience
 */
export default logger
