import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import AuthLayout from '@/components/AuthLayout'

export const metadata: Metadata = {
    title: 'TaskDesk Pro',
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
                <Providers>
                    <AuthLayout>
                        {children}
                    </AuthLayout>
                </Providers>
            </body>
        </html>
    )
}
