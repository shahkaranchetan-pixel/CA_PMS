"use client"

import { useState, useEffect, useRef } from "react"
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

    const unreadCount = notifications.filter(n => !n.isRead).length

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 60000) // Poll every 60s
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            } else {
                console.error("Notifications API error:", await res.text())
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err)
        }
    }

    const markAsRead = async (id?: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            })
            if (id) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            }
        } catch (err) {
            console.error("Failed to mark notifications as read", err)
        }
    }

    return (
        <div className="nb-wrap" ref={dropdownRef}>
            <button className="nb-btn" onClick={() => setIsOpen(!isOpen)}>
                <span>🔔</span>
                {unreadCount > 0 && <span className="nb-badge">{unreadCount}</span>}
            </button>

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
                                        <div className="nb-time">{new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round((new Date(n.createdAt).getTime() - Date.now()) / 60000), 'minute')}</div>
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
