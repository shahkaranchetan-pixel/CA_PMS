"use client"

import NotificationBell from "./NotificationBell"

export default function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
    return (
        <header className="topbar-main">
            <button className="mobile-show hamburger" onClick={onToggleSidebar} style={{ background: 'none', border: 'none' }}>
                ☰
            </button>
            <div className="sep" />
            <NotificationBell />
        </header>
    )
}
