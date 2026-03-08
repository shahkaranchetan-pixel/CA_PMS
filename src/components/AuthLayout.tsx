"use client"

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import Topbar from "@/components/Topbar"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const router = useRouter()

    const isLoginPage = pathname === "/login"

    useEffect(() => {
        if (status === "unauthenticated" && !isLoginPage) {
            router.push("/login")
        }
    }, [status, isLoginPage, router])

    // Login page — no sidebar, full-screen
    if (isLoginPage) {
        return <>{children}</>
    }

    // Loading state
    if (status === "loading") {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '24px',
                        fontWeight: 700,
                        color: 'var(--gold)',
                        marginBottom: '8px'
                    }}>TaskDesk</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading...</div>
                </div>
            </div>
        )
    }

    // Not authenticated — will redirect
    if (status === "unauthenticated") {
        return null
    }

    // Authenticated — full app layout
    return (
        <div className="app">
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <Topbar />
                <main className="main" style={{ marginTop: '60px' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}
