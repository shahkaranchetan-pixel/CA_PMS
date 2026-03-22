"use client"

import { useState, useEffect } from "react"
import NotificationBell from "./NotificationBell"

export default function Topbar({ 
    onToggleSidebar,
    onQuickTask
}: { 
    onToggleSidebar?: () => void,
    onQuickTask?: () => void
}) {
    const [theme, setTheme] = useState("dark")

    useEffect(() => {
        const saved = localStorage.getItem("theme") || "dark"
        setTheme(saved)
        document.documentElement.setAttribute("data-theme", saved)
    }, [])

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark"
        setTheme(next)
        document.documentElement.setAttribute("data-theme", next)
        localStorage.setItem("theme", next)
    }

    return (
        <header className="topbar-main">
            <button className="mobile-show hamburger" onClick={onToggleSidebar} style={{ background: 'none', border: 'none' }}>
                ☰
            </button>
            <div className="sep" />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                    onClick={onQuickTask}
                    title="Quick Create Task"
                    style={{
                        background: 'var(--gold)',
                        color: '#07101f',
                        border: 'none',
                        borderRadius: '10px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: 700,
                        transition: 'all .2s'
                    }}
                >
                    +
                </button>
                <button
                    onClick={toggleTheme}
                    title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    style={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: 'all .2s'
                    }}
                >
                    {theme === "dark" ? "☀️" : "🌙"}
                </button>
                <NotificationBell />
            </div>
        </header>
    )
}
