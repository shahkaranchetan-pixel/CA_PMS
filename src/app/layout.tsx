import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import AuthLayout from '@/components/AuthLayout'
import NextTopLoader from 'nextjs-toploader'
import { Toaster } from 'react-hot-toast'

export const viewport: Viewport = {
    themeColor: '#F37021',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export const metadata: Metadata = {
    title: 'KCS TaskPro',
    description: 'CA Task Management Suite',
    manifest: '/manifest.json',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <script dangerouslySetInnerHTML={{
                    __html: `
                        (function() {
                            try {
                                var theme = localStorage.getItem('theme') || 'dark';
                                document.documentElement.setAttribute('data-theme', theme);
                            } catch (e) {}
                        })();
                    `
                }} />
            </head>
            <body>
                <NextTopLoader color="#F37021" showSpinner={false} />
                <Toaster position="top-right" toastOptions={{ style: { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' } }} />
                <Providers>
                    <AuthLayout>
                        {children}
                    </AuthLayout>
                </Providers>
            </body>
        </html>
    )
}
