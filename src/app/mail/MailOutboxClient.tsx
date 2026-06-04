"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"

const statusClass: Record<string, string> = {
    SENT: "b-completed",
    FAILED: "b-blocked",
    QUEUED: "b-pending",
    DRAFT: "b-draft",
}

export default function MailOutboxClient({ initialMessages, isAdmin }: { initialMessages: any[]; isAdmin: boolean }) {
    const [messages, setMessages] = useState(initialMessages)
    const [resendingId, setResendingId] = useState<string | null>(null)

    const resend = async (id: string) => {
        setResendingId(id)
        try {
            const res = await fetch(`/api/mail/messages/${id}/resend`, { method: "POST" })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to resend mail")
            setMessages(prev => [data, ...prev])
            toast.success(data.status === "SENT" ? "Mail resent" : "Mail logged with errors")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setResendingId(null)
        }
    }

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">Mail Outbox</div>
                    <div className="psub">{isAdmin ? "All client and team emails sent from KCS TaskPro" : "Emails sent by you from KCS TaskPro"}</div>
                </div>
                <div className="sep" />
                {isAdmin && <Link href="/mail/templates" className="btn btn-g">Templates</Link>}
                <Link href="/mail/compose" className="btn btn-p">Compose Mail</Link>
            </div>

            <div className="card data-panel">
                <div className="table-wrapper">
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Recipients</th>
                                <th>Linked To</th>
                                {isAdmin && <th>Sender</th>}
                                <th>Status</th>
                                <th>Sent</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 7 : 6}>
                                        <div className="empty">
                                            <div className="empty-i">Mail</div>
                                            <div style={{ fontWeight: 600, color: "var(--text)" }}>No emails yet</div>
                                            <div style={{ fontSize: "13px" }}>Compose your first client update to start the outbox history.</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : messages.map(message => {
                                const failedRecipient = message.recipients?.find((r: any) => r.status === "FAILED")
                                return (
                                    <tr key={message.id}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: "var(--text)", maxWidth: 360, whiteSpace: "normal" }}>{message.subject}</div>
                                            <div style={{ color: "var(--muted)", fontSize: "11px", marginTop: 3 }}>{message.category || "GENERAL"}</div>
                                            {(message.failureReason || failedRecipient?.error) && (
                                                <div style={{ color: "var(--danger)", fontSize: "11px", marginTop: 4, maxWidth: 420, whiteSpace: "normal" }}>
                                                    {message.failureReason || failedRecipient.error}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                {message.recipients?.slice(0, 3).map((recipient: any) => (
                                                    <span key={recipient.id} style={{ color: recipient.status === "FAILED" ? "var(--danger)" : "var(--text)" }}>
                                                        {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
                                                    </span>
                                                ))}
                                                {message.recipients?.length > 3 && <span style={{ color: "var(--muted)" }}>+{message.recipients.length - 3} more</span>}
                                            </div>
                                        </td>
                                        <td>
                                            {message.task ? (
                                                <Link href={`/tasks/${message.task.id}`} style={{ color: "var(--ca-saffron)", fontWeight: 600 }}>{message.task.title}</Link>
                                            ) : message.client ? (
                                                <Link href={`/clients/${message.client.id}`} style={{ color: "var(--ca-saffron)", fontWeight: 600 }}>{message.client.name}</Link>
                                            ) : (
                                                <span style={{ color: "var(--muted)" }}>General</span>
                                            )}
                                        </td>
                                        {isAdmin && <td>{message.sender?.name || message.sender?.email || "User"}</td>}
                                        <td><span className={`badge ${statusClass[message.status] || "b-draft"}`}>{message.status}</span></td>
                                        <td>{message.sentAt ? new Date(message.sentAt).toLocaleString("en-IN") : new Date(message.createdAt).toLocaleString("en-IN")}</td>
                                        <td style={{ textAlign: "right" }}>
                                            <button className="btn btn-g btn-sm" disabled={resendingId === message.id} onClick={() => resend(message.id)}>
                                                {resendingId === message.id ? "Sending..." : "Resend"}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
