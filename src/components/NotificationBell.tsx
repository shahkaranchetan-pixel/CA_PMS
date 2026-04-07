"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"

interface Notification {
    id: string
    title: string
    message: string
    isRead: boolean
    link: string | null
    createdAt: string
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const unreadCount = notifications.filter(n => !n.isRead).length

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (err) {
            // Silent fail for background polling
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
        
        // Poll every 60s instead of 15s to reduce API load
        const startPolling = () => {
            intervalRef.current = setInterval(fetchNotifications, 60000)
        }
        startPolling()

        // Stop polling when tab is hidden, restart when visible
        const handleVisibility = () => {
            if (document.hidden) {
                if (intervalRef.current) clearInterval(intervalRef.current)
            } else {
                fetchNotifications() // Fetch immediately on return
                startPolling()
            }
        }
        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [fetchNotifications])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const markAsRead = async (id?: string) => {
        // Optimistic update
        if (id) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        }

        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            })
        } catch (err) {
            console.error("Failed to mark notifications as read", err)
        }
    }

    return (
        <div className="nb-wrap" ref={dropdownRef}>
            <button className="nb-btn" onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }} style={{ position: 'relative' }}>
                <span style={{ fontSize: '20px' }}>🔔</span>
                {unreadCount > 0 && (
                    <span className="nb-badge pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            <style jsx global>{`
                .nb-badge.pulse {
                    animation: bell-pulse 2s infinite;
                    box-shadow: 0 0 0 0 rgba(232, 160, 32, 0.7);
                }
                @keyframes bell-pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(232, 160, 32, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(232, 160, 32, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(232, 160, 32, 0); }
                }
            `}</style>

            {isOpen && (
                <div className="nb-drop">
                    <div className="nb-header">
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAsRead()}
                                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="nb-list">
                        {notifications.length === 0 ? (
                            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`nb-item ${!n.isRead ? 'unread' : ''}`}
                                    onClick={() => {
                                        if (!n.isRead) markAsRead(n.id)
                                        if (n.link) window.location.href = n.link
                                    }}
                                >
                                    <div className="nb-content">
                                        <div className="nb-title">{n.title}</div>
                                        <div className="nb-msg">{n.message}</div>
                                        <div className="nb-time">
                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div style={{ padding: '10px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Showing last 20 alerts</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
