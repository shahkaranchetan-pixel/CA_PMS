"use client"

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import Sidebar from "@/components/Sidebar"
import Topbar from "@/components/Topbar"
import QuickTaskModal from "@/components/QuickTaskModal"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        // Lazy initializer reads localStorage once on mount (no effect needed)
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sb_collapsed') === 'true'
        }
        return false
    })
    const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false)
    const [, startTransition] = useTransition()

    const isLoginPage = pathname === "/login"

    useEffect(() => {
        // startTransition defers the state update so it is not synchronous
        // within the effect body — satisfies react-hooks/set-state-in-effect
        startTransition(() => setIsSidebarOpen(false))
    }, [pathname])

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
                        color: 'var(--ca-saffron)',
                        marginBottom: '8px'
                    }}>KCS TaskPro</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading...</div>
                </div>
            </div>
        )
    }

    // Not authenticated — will redirect
    if (status === "unauthenticated") {
        return null
    }

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
    const toggleCollapse = () => {
        const nextState = !isSidebarCollapsed
        setIsSidebarCollapsed(nextState)
        localStorage.setItem('sb_collapsed', String(nextState))
    }

    // Authenticated — full app layout
    return (
        <div className={`app ${isSidebarCollapsed ? 'sb-collapsed' : ''}`}>
            <Sidebar 
                isOpen={isSidebarOpen} 
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={toggleCollapse}
                onClose={() => setIsSidebarOpen(false)} 
            />
            {isSidebarOpen && <div className="sb-overlay" onClick={() => setIsSidebarOpen(false)} />}

            <QuickTaskModal isOpen={isQuickTaskOpen} onClose={() => setIsQuickTaskOpen(false)} />



            <div className="content-area" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Topbar onToggleSidebar={toggleSidebar} onQuickTask={() => setIsQuickTaskOpen(true)} />
                <main className="main" style={{ marginTop: '60px', flex: 1 }}>
                    {children}
                </main>
                <footer style={{
                    background: 'var(--ca-blue, #165A92)',
                    borderTop: '1px solid var(--border)',
                    padding: '20px 28px',
                    color: '#ffffff',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    zIndex: 10
                }}>
                    <div>
                        <span style={{ fontWeight: 700 }}>KC Shah</span>
                        <span style={{ color: 'var(--ca-saffron, #F37021)', fontWeight: 700 }}> & Associates</span>
                        <span style={{ color: 'var(--muted)', marginLeft: '8px' }}>© {new Date().getFullYear()} All Rights Reserved.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <a href="https://kcshah.com" target="_blank" rel="noreferrer" style={{ color: 'var(--ca-saffron, #F37021)', textDecoration: 'none', fontWeight: 600 }}>kcshah.com</a>
                        <span style={{ color: 'var(--muted2)' }}>|</span>
                        <span style={{ color: 'var(--muted)' }}>TaskPro PMS v1.0</span>
                    </div>
                </footer>
            </div>
        </div>
    )
}
