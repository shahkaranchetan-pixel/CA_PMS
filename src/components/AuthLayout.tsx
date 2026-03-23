"use client"

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import Topbar from "@/components/Topbar"
import QuickTaskModal from "@/components/QuickTaskModal"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false)

    const isLoginPage = pathname === "/login"

    // Load sidebar state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('sb_collapsed')
        if (saved !== null) {
            setIsSidebarCollapsed(saved === 'true')
        }
    }, [])

    useEffect(() => {
        setIsSidebarOpen(false) // Close sidebar on route change
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
                        color: 'var(--gold)',
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



            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginLeft: 'var(--sidebar)', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <Topbar onToggleSidebar={toggleSidebar} onQuickTask={() => setIsQuickTaskOpen(true)} />
                <main className="main" style={{ marginTop: '60px' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}
