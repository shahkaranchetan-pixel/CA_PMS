'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[APP_ERROR]', error)
    }, [error])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '16px',
            padding: '40px'
        }}>
            <div style={{ fontSize: '48px' }}>⚠️</div>
            <h2 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text)',
                margin: 0
            }}>
                Something went wrong
            </h2>
            <p style={{
                fontSize: '14px',
                color: 'var(--muted)',
                textAlign: 'center',
                maxWidth: '400px',
                margin: 0
            }}>
                {error.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
                onClick={reset}
                style={{
                    padding: '10px 24px',
                    background: 'var(--gold)',
                    color: '#07101f',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                Try Again
            </button>
        </div>
    )
}
