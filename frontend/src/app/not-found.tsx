'use client'

import Link from 'next/link'
import { Home, ChevronRight } from '@/components/ui/icons'

/**
 * Custom 404 Not Found Page
 * Provides a user-friendly experience when navigating to non-existent routes
 */
export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-aws-orange mb-2">404</h1>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Page Not Found
          </h2>
          <p className="text-text-secondary">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-aws-orange text-white rounded-md hover:bg-aws-orange/90 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface text-text-primary border border-border rounded-md hover:bg-surface-elevated transition-colors font-medium"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Go Back
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-text-secondary mb-4">Quick Links</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/drifts"
              className="text-sm text-aws-orange hover:underline"
            >
              View Drifts
            </Link>
            <span className="text-text-secondary">•</span>
            <Link
              href="/baselines"
              className="text-sm text-aws-orange hover:underline"
            >
              Baselines
            </Link>
            <span className="text-text-secondary">•</span>
            <Link
              href="/trends"
              className="text-sm text-aws-orange hover:underline"
            >
              Trends
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
