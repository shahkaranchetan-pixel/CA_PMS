"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"

const blankTemplate = {
    name: "",
    category: "GENERAL",
    subject: "",
    body: "",
}

export default function TemplateManager({ initialTemplates }: { initialTemplates: any[] }) {
    const [templates, setTemplates] = useState(initialTemplates)
    const [form, setForm] = useState(blankTemplate)
    const [saving, setSaving] = useState(false)

    const createTemplate = async (event: React.FormEvent) => {
        event.preventDefault()
        setSaving(true)
        try {
            const res = await fetch("/api/mail/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to create template")
            setTemplates(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
            setForm(blankTemplate)
            toast.success("Template created")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    const removeTemplate = async (id: string) => {
        if (!confirm("Archive this template?")) return
        try {
            const res = await fetch(`/api/mail/templates/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to archive template")
            setTemplates(prev => prev.filter(template => template.id !== id))
            toast.success("Template archived")
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    return (
        <div>
            <div className="topbar">
                <div>
                    <Link href="/mail" style={{ color: "var(--muted)", fontSize: "12px", textDecoration: "none" }}>Back to outbox</Link>
                    <div className="ptitle">Mail Templates</div>
                    <div className="psub">Reusable messages for client updates and task completion workflows</div>
                </div>
            </div>

            <div className="two-col">
                <form className="card" onSubmit={createTemplate}>
                    <div className="ctitle">New Template</div>
                    <div className="fg" style={{ gridTemplateColumns: "1fr" }}>
                        <div className="field">
                            <label>Name</label>
                            <input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Task completed update" />
                        </div>
                        <div className="field">
                            <label>Category</label>
                            <select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>
                                <option value="GENERAL">General</option>
                                <option value="TASK_COMPLETION">Task completion</option>
                                <option value="CLIENT_UPDATE">Client update</option>
                                <option value="REMINDER">Reminder</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Subject</label>
                            <input required value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} placeholder="Task completed: {{taskTitle}}" />
                        </div>
                        <div className="field">
                            <label>Body</label>
                            <textarea required rows={9} value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} placeholder="Dear {{clientName}},&#10;&#10;Your {{taskTitle}} for {{period}} has been completed.&#10;&#10;Regards,&#10;{{firmName}}" />
                        </div>
                    </div>
                    <button className="btn btn-p" disabled={saving} style={{ marginTop: 16 }}>{saving ? "Saving..." : "Create Template"}</button>
                </form>

                <div className="card">
                    <div className="ctitle">Active Templates</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {templates.map(template => (
                            <div key={template.id} className="template-row">
                                <div>
                                    <div style={{ fontWeight: 700 }}>{template.name}</div>
                                    <div style={{ color: "var(--muted)", fontSize: "11px", marginTop: 2 }}>{template.category}</div>
                                    <div style={{ color: "var(--text)", fontSize: "12px", marginTop: 8 }}>{template.subject}</div>
                                </div>
                                <button className="btn btn-d btn-sm" type="button" onClick={() => removeTemplate(template.id)}>Archive</button>
                            </div>
                        ))}
                        {templates.length === 0 && <div className="empty" style={{ padding: "28px 0" }}>No templates yet.</div>}
                    </div>
                </div>
            </div>
        </div>
    )
}
