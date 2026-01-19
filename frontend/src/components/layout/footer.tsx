/**
 * Footer component with credits and links
 * Matches the AWS-inspired design system
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Copyright and credit */}
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

          {/* Links */}
          <div className="flex items-center gap-4 text-sm">
            <a
              href="https://github.com/yourusername/config-drift-detector"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              GitHub
            </a>
            <span className="text-border">•</span>
            <a
              href="https://iamarsh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Portfolio
            </a>
            <span className="text-border">•</span>
            <a
              href="https://github.com/yourusername/config-drift-detector/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              License
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
