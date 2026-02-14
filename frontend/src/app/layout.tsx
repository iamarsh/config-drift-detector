import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../styles/globals.css'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Navigation } from '@/components/layout/navigation'
import { Footer } from '@/components/layout/footer'
import { ErrorRecoveryScript } from '@/components/error-recovery-script'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Config Drift Detector',
  description: 'AWS configuration drift detection and monitoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ErrorRecoveryScript />
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            storageKey="config-drift-theme"
          >
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-aws-orange focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-aws-orange focus:ring-offset-2"
            >
              Skip to main content
            </a>
            <div className="min-h-screen bg-background flex flex-col">
              <Navigation />
              <main id="main-content" className="flex-1">{children}</main>
              <Footer />
            </div>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
