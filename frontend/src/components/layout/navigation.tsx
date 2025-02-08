'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, AlertTriangle, Database, Menu, TrendingUp } from '@/components/ui/icons'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { MobileMenu } from './mobile-menu'

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Drifts', href: '/drifts', icon: AlertTriangle },
  { name: 'Baselines', href: '/baselines', icon: Database },
  { name: 'Trends', href: '/trends', icon: TrendingUp },
]

/**
 * Main navigation bar component
 * Features:
 * - Logo and brand name
 * - Navigation links with icons
 * - Active state indicators
 * - Theme toggle
 * - Mobile menu (hamburger)
 * - Responsive design
 *
 * @example
 * ```tsx
 * <Navigation />
 * ```
 */
export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-surface border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-aws-orange/10 group-hover:bg-aws-orange/20 transition-colors">
                  <Activity className="w-5 h-5 text-aws-orange" />
                </div>
                <span className="text-lg font-bold text-text-primary group-hover:text-aws-orange transition-colors">
                  Config Drift Detector
                </span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      relative px-4 py-2 flex items-center space-x-2 rounded-md text-sm font-medium transition-all duration-200
                      ${
                        active
                          ? 'text-aws-orange'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {active && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-aws-orange rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Right side: Theme toggle + Mobile menu button */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
        isActive={isActive}
      />
    </>
  )
}

// Import Activity icon for logo
import { Activity } from '@/components/ui/icons'
