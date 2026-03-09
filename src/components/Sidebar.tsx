"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

const NAV = [
    { id: "/", label: "Dashboard", icon: "🏠" },
    { id: "/calendar", label: "Calendar", icon: "📅" },
    { id: "/clients", label: "Clients", icon: "👥" },
    { id: "/tasks", label: "Tasks", icon: "📋" },
    { id: "/team", label: "Team Workload", icon: "📊" },
    { id: "/templates", label: "Templates", icon: "📄" },
    { id: "/settings", label: "Settings", icon: "⚙️" },
]

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
    const pathname = usePathname()
    const { data: session } = useSession()

    const user = session?.user as any
    const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'
    const role = user?.role === 'ADMIN' ? 'Admin' : 'Team Member'

    return (
        <nav className={`sb ${isOpen ? 'open' : ''}`}>
            <div className="sb-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div className="sb-brand">KCS TaskPro</div>
                    <div className="sb-sub">Practice Management Suite</div>
                </div>
                <button
                    onClick={onClose}
                    className="mobile-show hamburger"
                    style={{ background: 'none', border: 'none', fontSize: '20px', padding: '4px' }}
                >
                    ✕
                </button>
            </div>

            <div className="sb-user">
                <div className="sb-av" style={{ background: "#E8A020" }}>{initials}</div>
                <div>
                    <div className="sb-uname">{user?.name || 'User'}</div>
                    <div className="sb-urole">{role}</div>
                </div>
            </div>

            <div className="sb-sec">Navigation</div>

            {NAV.filter(n => (n.id !== "/team" && n.id !== "/settings") || role === "Admin").map((n) => {
                const isActive = pathname === n.id || (n.id !== "/" && pathname.startsWith(n.id))
                return (
                    <Link key={n.id} href={n.id} className={`sb-item ${isActive ? "active" : ""}`}>
                        <span style={{ fontSize: "14px", width: "18px", textAlign: "center" }}>{n.icon}</span>
                        {n.label}
                    </Link>
                )
            })}

            <div className="sb-bot">
                <div style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center", marginBottom: "9px" }}>
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {new Date().getFullYear()}
                </div>
                <Link
                    href="/profile"
                    className="logout-btn"
                    style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', marginBottom: '8px', display: 'block', textAlign: 'center', textDecoration: 'none' }}
                >
                    👤 My Profile
                </Link>
                <button
                    className="logout-btn"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                >
                    ⎋ Sign Out
                </button>
            </div>
        </nav>
    )
}
