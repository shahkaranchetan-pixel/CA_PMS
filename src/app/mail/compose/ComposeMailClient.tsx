"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"

function merge(input: string, values: Record<string, string>) {
    return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => values[key] || "")
}

export default function ComposeMailClient({ clients, templates }: { clients: any[]; templates: any[] }) {
    const router = useRouter()
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
    const [templateId, setTemplateId] = useState("")
    const [subject, setSubject] = useState("")
    const [body, setBody] = useState("")
    const [sending, setSending] = useState(false)

    const selectedClients = useMemo(
        () => clients.filter(client => selectedClientIds.includes(client.id)),
        [clients, selectedClientIds]
    )

    const firstClient = selectedClients[0]
    const previewValues = {
        clientName: firstClient?.name || "Client Name",
        firmName: "KCS Team",
        taskTitle: "Task title",
        period: "Current period",
        completedBy: "KCS Team",
    }

    const previewSubject = merge(subject, previewValues)
    const previewBody = merge(body, previewValues)

    const toggleClient = (id: string) => {
        setSelectedClientIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
    }

    const applyTemplate = (id: string) => {
        setTemplateId(id)
        const template = templates.find(item => item.id === id)
        if (!template) return
        setSubject(template.subject)
        setBody(template.body)
    }

    const send = async (event: React.FormEvent) => {
        event.preventDefault()
        if (selectedClients.length === 0) {
            toast.error("Select at least one client with an email")
            return
        }

        setSending(true)
        try {
            const recipients = selectedClients.map(client => ({
                email: client.contactEmail,
                name: client.contactPerson || client.name,
                clientId: client.id,
            }))

            const res = await fetch("/api/mail/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    body,
                    category: "CLIENT_UPDATE",
                    clientId: selectedClients.length === 1 ? selectedClients[0].id : null,
                    recipients,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to send mail")
            toast.success(data.status === "SENT" ? "Mail sent" : "Mail saved with errors")
            router.push("/mail")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSending(false)
        }
    }

    return (
        <div>
            <div className="topbar">
                <div>
                    <Link href="/mail" style={{ color: "var(--muted)", fontSize: "12px", textDecoration: "none" }}>Back to outbox</Link>
                    <div className="ptitle">Compose Mail</div>
                    <div className="psub">Send tracked updates to clients with a reusable template or custom message</div>
                </div>
            </div>

            <form onSubmit={send} className="mail-compose-grid">
                <div className="card">
                    <div className="ctitle">Message</div>
                    <div className="fg" style={{ gridTemplateColumns: "1fr" }}>
                        <div className="field">
                            <label>Template</label>
                            <select value={templateId} onChange={event => applyTemplate(event.target.value)}>
                                <option value="">Start from blank</option>
                                {templates.map(template => (
                                    <option key={template.id} value={template.id}>{template.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label>Subject</label>
                            <input required value={subject} onChange={event => setSubject(event.target.value)} placeholder="e.g. Update on your compliance work" />
                        </div>
                        <div className="field">
                            <label>Body</label>
                            <textarea required value={body} onChange={event => setBody(event.target.value)} rows={12} placeholder="Dear {{clientName}},&#10;&#10;Write your update here.&#10;&#10;Regards,&#10;{{firmName}}" />
                        </div>
                    </div>
                    <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <Link href="/mail" className="btn btn-g">Cancel</Link>
                        <button className="btn btn-p" disabled={sending}>{sending ? "Sending..." : "Send Mail"}</button>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="card">
                        <div className="ctitle">
                            <span>Recipients</span>
                            <span className="badge b-member">{selectedClients.length} selected</span>
                        </div>
                        <div className="recipient-list">
                            {clients.map(client => (
                                <label key={client.id} className="recipient-row">
                                    <input type="checkbox" checked={selectedClientIds.includes(client.id)} onChange={() => toggleClient(client.id)} />
                                    <span>
                                        <strong>{client.name}</strong>
                                        <small>{client.contactEmail}</small>
                                    </span>
                                </label>
                            ))}
                            {clients.length === 0 && <div className="empty" style={{ padding: "24px 0" }}>No clients with email addresses found.</div>}
                        </div>
                    </div>

                    <div className="card">
                        <div className="ctitle">Preview</div>
                        <div className="mail-preview">
                            <div className="mail-preview-subject">{previewSubject || "Subject preview"}</div>
                            <div className="mail-preview-body">{previewBody || "Message preview"}</div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
