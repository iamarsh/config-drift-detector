import type { Metadata } from 'next'
import '../styles/globals.css'

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
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">
                      Config Drift Detector
                    </h1>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <a
                      href="/"
                      className="border-b-2 border-transparent hover:border-gray-300 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                    >
                      Dashboard
                    </a>
                    <a
                      href="/drifts"
                      className="border-b-2 border-transparent hover:border-gray-300 text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                    >
                      Drifts
                    </a>
                    <a
                      href="/baselines"
                      className="border-b-2 border-transparent hover:border-gray-300 text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                    >
                      Baselines
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
