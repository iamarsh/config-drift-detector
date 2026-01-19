import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../styles/globals.css'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { Navigation } from '@/components/layout/navigation'
import { Footer } from '@/components/layout/footer'

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="config-drift-theme"
        >
          <div className="min-h-screen bg-background flex flex-col">
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
