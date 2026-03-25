import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import AuthLayout from '@/components/AuthLayout'
import NextTopLoader from 'nextjs-toploader'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
    title: 'KCS TaskPro',
    description: 'CA Task Management Suite',
    manifest: '/manifest.json',
    themeColor: '#E8A020',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <NextTopLoader color="#E8A020" showSpinner={false} />
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
