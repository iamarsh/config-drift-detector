/**
 * Footer component with credits
 * Matches the AWS-inspired design system
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center items-center">
          <p className="text-sm text-text-secondary">
            © {currentYear} Config Drift Detector. Crafted by{' '}
            <a
              href="https://iamarsh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-primary hover:text-aws-orange transition-colors font-medium"
            >
              Arsh
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
