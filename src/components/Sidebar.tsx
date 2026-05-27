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

function getIcon(name: string) {
    const props = {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.5",
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        style: { display: "block" }
    }

    switch (name) {
        case "Home":
            return (
                <svg {...props}>
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            )
        case "Cal":
            return (
                <svg {...props}>
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
            )
        case "Client":
            return (
                <svg {...props}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        case "Task":
            return (
                <svg {...props}>
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                </svg>
            )
        case "Mail":
            return (
                <svg {...props}>
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
            )
        case "Train":
            return (
                <svg {...props}>
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
            )
        case "Team":
            return (
                <svg {...props}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        case "Tpl":
            return (
                <svg {...props}>
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M21 9H3" />
                    <path d="M21 15H3" />
                    <path d="M12 3v18" />
                </svg>
            )
        case "Set":
            return (
                <svg {...props}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            )
        default:
            return <span>•</span>
    }
}

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
                    <div className="sb-brand">
                        <span>KC Shah</span>
                        <span style={{ color: "var(--gold)" }}> & Associates</span>
                    </div>
                    <div className="sb-sub">TaskPro PMS</div>
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
                    <div className="sb-av" style={{ background: "var(--navy)", color: "#ffffff", border: "1px solid var(--border)" }}>{initials}</div>
                    <div style={{ overflow: "hidden" }}>
                        <div className="sb-uname" style={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user?.name || "User"}</div>
                        <div className="sb-urole">{role}</div>
                    </div>
                </div>
            )}

            {propIsCollapsed && (
                <div style={{ padding: "20px 0", display: "flex", justifyContent: "center" }}>
                    <div className="sb-av" style={{ background: "var(--navy)", color: "#ffffff", border: "1px solid var(--border)", width: "32px", height: "32px", fontSize: "12px" }}>{initials}</div>
                </div>
            )}

            {!propIsCollapsed && <div className="sb-sec">Navigation</div>}

            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                {NAV.filter(n => (n.id !== "/team" && n.id !== "/settings") || role === "Admin").map((n) => {
                    const isActive = pathname === n.id || (n.id !== "/" && pathname.startsWith(n.id))
                    return (
                        <Link key={n.id} href={n.id} title={propIsCollapsed ? n.label : undefined} className={`sb-item ${isActive ? "active" : ""}`}>
                            <span className="sb-icon" style={{ color: isActive ? "var(--gold)" : "currentColor" }}>{getIcon(n.icon)}</span>
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
