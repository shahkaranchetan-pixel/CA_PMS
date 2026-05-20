"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

const NAV = [
    { id: "/", label: "Dashboard", icon: "Home" },
    { id: "/calendar", label: "Calendar", icon: "Cal" },
    { id: "/clients", label: "Clients", icon: "Client" },
    { id: "/tasks", label: "Tasks", icon: "Task" },
    { id: "/mail", label: "Mail", icon: "Mail" },
    { id: "/training", label: "Training", icon: "Train" },
    { id: "/team", label: "Team Workload", icon: "Team" },
    { id: "/templates", label: "Templates", icon: "Tpl" },
    { id: "/settings", label: "Settings", icon: "Set" },
]

export default function Sidebar({
    isOpen,
    onClose,
    isCollapsed: propIsCollapsed,
    onToggleCollapse
}: {
    isOpen?: boolean
    onClose?: () => void
    isCollapsed?: boolean
    onToggleCollapse?: () => void
}) {
    const pathname = usePathname()
    const { data: session } = useSession()

    const user = session?.user as any
    const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : "U"
    const role = user?.role === "ADMIN" ? "Admin" : "Team Member"

    return (
        <nav className={`sb ${isOpen ? "open" : "closed"} ${propIsCollapsed ? "sb-collapsed" : ""}`}>
            <div className="sb-logo" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ opacity: propIsCollapsed ? 0 : 1, transition: "opacity 0.2s", whiteSpace: "nowrap", width: propIsCollapsed ? 0 : "auto", overflow: "hidden" }}>
                    <div className="sb-brand">KCS TaskPro</div>
                    <div className="sb-sub">Practice Management Suite</div>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                    <button
                        onClick={onToggleCollapse}
                        className="mobile-hide"
                        style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: "16px", padding: "4px" }}
                        title={propIsCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {propIsCollapsed ? ">" : "<"}
                    </button>
                    <button
                        onClick={onClose}
                        className="mobile-show hamburger"
                        style={{ background: "none", border: "none", fontSize: "20px", padding: "4px" }}
                        title="Close menu"
                    >
                        x
                    </button>
                </div>
            </div>

            {!propIsCollapsed && (
                <div className="sb-user" style={{ overflow: "hidden", transition: "all 0.3s ease" }}>
                    <div className="sb-av" style={{ background: "#E8A020" }}>{initials}</div>
                    <div style={{ overflow: "hidden" }}>
                        <div className="sb-uname" style={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user?.name || "User"}</div>
                        <div className="sb-urole">{role}</div>
                    </div>
                </div>
            )}

            {propIsCollapsed && (
                <div style={{ padding: "20px 0", display: "flex", justifyContent: "center" }}>
                    <div className="sb-av" style={{ background: "#E8A020", width: "32px", height: "32px", fontSize: "12px" }}>{initials}</div>
                </div>
            )}

            {!propIsCollapsed && <div className="sb-sec">Navigation</div>}

            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                {NAV.filter(n => (n.id !== "/team" && n.id !== "/settings") || role === "Admin").map((n) => {
                    const isActive = pathname === n.id || (n.id !== "/" && pathname.startsWith(n.id))
                    return (
                        <Link key={n.id} href={n.id} title={propIsCollapsed ? n.label : undefined} className={`sb-item ${isActive ? "active" : ""}`}>
                            <span className="sb-icon">{n.icon}</span>
                            {!propIsCollapsed && <span style={{ marginLeft: "10px" }}>{n.label}</span>}
                        </Link>
                    )
                })}
            </div>

            <div className="sb-bot">
                <div style={{ fontSize: "10px", color: "var(--muted)", textAlign: "center", marginBottom: "9px" }}>
                    {!propIsCollapsed && `${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${new Date().getFullYear()}`}
                </div>
                <Link
                    href="/profile"
                    className="logout-btn"
                    title="My Profile"
                    style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                >
                    {!propIsCollapsed && <span>My Profile</span>}
                    {propIsCollapsed && <span>Me</span>}
                </Link>
                <button
                    className="logout-btn"
                    title="Sign Out"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}
                >
                    {!propIsCollapsed && <span>Sign Out</span>}
                    {propIsCollapsed && <span>Out</span>}
                </button>
            </div>
        </nav>
    )
}
