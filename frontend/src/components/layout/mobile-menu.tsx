'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import { X } from '@/components/ui/icons'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navItems: NavItem[]
  isActive: (href: string) => boolean
}

/**
 * Mobile menu component using Headless UI Dialog
 * Slides in from the right with backdrop overlay
 * Features:
 * - Navigation links with icons
 * - Active state indicators
 * - Close button
 * - Smooth animations
 * - Accessible (keyboard navigation, focus management)
 *
 * @example
 * ```tsx
 * <MobileMenu
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   navItems={navItems}
 *   isActive={isActive}
 * />
 * ```
 */
export function MobileMenu({ isOpen, onClose, navItems, isActive }: MobileMenuProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 md:hidden" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Menu panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                  <div className="flex h-full flex-col bg-surface shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                      <Dialog.Title className="text-lg font-semibold text-text-primary">
                        Menu
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-md p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close menu</span>
                        <X className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Navigation links */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      <nav className="space-y-2">
                        {navItems.map((item) => {
                          const Icon = item.icon
                          const active = isActive(item.href)
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={onClose}
                              className={`
                                flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200
                                ${
                                  active
                                    ? 'bg-aws-orange/10 text-aws-orange'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                                }
                              `}
                            >
                              <Icon className="w-5 h-5" />
                              <span>{item.name}</span>
                            </Link>
                          )
                        })}
                      </nav>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
