'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>

/**
 * Theme provider component that wraps the next-themes ThemeProvider
 * Enables light/dark mode with system preference detection
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <YourApp />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
