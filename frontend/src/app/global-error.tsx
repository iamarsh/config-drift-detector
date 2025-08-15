'use client'

/**
 * Global Error Handler for unrecoverable errors
 * This catches errors that escape the normal error boundary
 * Including errors in the root layout
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const handleReload = () => {
    sessionStorage.clear()
    localStorage.clear()
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name))
      })
    }
    window.location.href = window.location.origin
  }

  return (
    <html>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            padding: '1rem',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '0.5rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '4rem',
                height: '4rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <span style={{ fontSize: '2rem' }}>⚠️</span>
            </div>

            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#f5f5f5',
                marginBottom: '0.5rem',
              }}
            >
              Critical Error
            </h1>

            <p
              style={{
                color: '#a0a0a0',
                marginBottom: '1.5rem',
              }}
            >
              The application encountered a critical error and needs to restart.
            </p>

            <button
              onClick={handleReload}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#FF9900',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#e68a00')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#FF9900')}
            >
              Restart Application
            </button>

            <details
              style={{
                marginTop: '1.5rem',
                textAlign: 'left',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  color: '#a0a0a0',
                  fontSize: '0.875rem',
                }}
              >
                Error Details
              </summary>
              <pre
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  color: '#f5f5f5',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}
              >
                {error.message}
                {error.digest && `\n\nError ID: ${error.digest}`}
              </pre>
            </details>
          </div>
        </div>
      </body>
    </html>
  )
}
