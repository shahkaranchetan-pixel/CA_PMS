"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewTaskPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [clients, setClients] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])

    useEffect(() => {
        fetch("/api/clients")
            .then(res => res.json())
            .then(data => setClients(Array.isArray(data) ? data : []))
            .catch(err => console.error("Failed to load clients", err))

        fetch("/api/employees")
            .then(res => res.json())
            .then(data => setEmployees(Array.isArray(data) ? data : []))
            .catch(err => console.error("Failed to load employees", err))

        fetch("/api/templates")
            .then(res => res.json())
            .then(data => setTemplates(Array.isArray(data) ? data : []))
            .catch(err => console.error("Failed to load templates", err))
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            title: formData.get("title"),
            taskType: formData.get("taskType"),
            description: formData.get("description"),
            dueDate: formData.get("dueDate"),
            period: formData.get("period"),
            clientId: formData.get("clientId"),
            frequency: formData.get("frequency"),
            assigneeId: formData.get("assigneeId") || null,
            templateId: formData.get("templateId") || null,
            priority: formData.get("priority") || "medium",
            estimatedMinutes: formData.get("estimatedMinutes") ? parseInt(formData.get("estimatedMinutes") as string) : null,
        }

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to create task")
            }

            router.push("/tasks")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="topbar">
                <div>
                    <Link href="/tasks" style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Tasks</Link>
                    <div className="ptitle">Create New Task</div>
                    <div className="psub">Create a compliance task or custom assignment for a client</div>
                </div>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,87,87,.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,87,87,.2)', fontSize: '13px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '800px' }}>
                <div className="ctitle">📋 Task Details</div>

                <div className="fg" style={{ marginTop: '16px' }}>
                    <div className="field">
                        <label htmlFor="clientId">Client Entity *</label>
                        <select id="clientId" name="clientId" required>
                            <option value="">Select a client...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="assigneeId">Assign To (User)</label>
                        <select id="assigneeId" name="assigneeId">
                            <option value="">Unassigned</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name || emp.email}</option>
                            ))}
                        </select>
                    </div>

                    <div className="fdiv">Compliance Setup</div>

                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="templateId">Auto-Apply Template Bundle</label>
                        <select id="templateId" name="templateId" style={{ background: 'var(--surface2)', border: '1px solid var(--gold)', color: 'var(--gold)' }}>
                            <option value="">No Template (Create Single Custom Task)</option>
                            {templates.map(tmp => (
                                <option key={tmp.id} value={tmp.id}>⚡ {tmp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="taskType">Statutory Task Type *</label>
                        <select id="taskType" name="taskType" required>
                            <option value="">Select Type...</option>
                            <option value="TDS_PAYMENT">TDS Payment (7th)</option>
                            <option value="GST_1">GSTR-1 (10th)</option>
                            <option value="PF_ESI_PT">PF / ESI / PT (15th)</option>
                            <option value="GSTR_3B">GSTR-3B (20th)</option>
                            <option value="ACCOUNTING">Accounting / Bookkeeping</option>
                            <option value="ITR">Income Tax Return</option>
                            <option value="AUDIT">Audit</option>
                            <option value="ROC">ROC Filing</option>
                            <option value="OTHER">Other Custom Task</option>
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="frequency">Repeat Frequency</label>
                        <select id="frequency" name="frequency" required defaultValue="ONCE">
                            <option value="ONCE">One-time / ONCE</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="QUARTERLY">Quarterly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </div>

                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="title">Task Title *</label>
                        <input type="text" id="title" name="title" required placeholder="e.g. File August 2026 GST Returns" />
                    </div>

                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="description">Notes / Instructions</label>
                        <textarea id="description" name="description" rows={3} placeholder="Add any specific context or instructions here..."></textarea>
                    </div>

                    <div className="fdiv">Priority & Effort</div>

                    <div className="field">
                        <label htmlFor="priority">Priority Level</label>
                        <select id="priority" name="priority" defaultValue="medium">
                            <option value="low">🟢 Low</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="high">🔴 High</option>
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="estimatedMinutes">Estimated Time (minutes)</label>
                        <input type="number" id="estimatedMinutes" name="estimatedMinutes" placeholder="e.g. 120" min="0" />
                    </div>

                    <div className="fdiv">Deadlines</div>

                    <div className="field">
                        <label htmlFor="dueDate">Due Date</label>
                        <input type="date" id="dueDate" name="dueDate" style={{ colorScheme: 'dark' }} />
                    </div>

                    <div className="field">
                        <label htmlFor="period">Applicable Period</label>
                        <input type="text" id="period" name="period" placeholder="e.g. Aug-2026" />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <button type="button" onClick={() => router.back()} className="btn btn-g">Cancel</button>
                    <button type="submit" disabled={loading} className="btn btn-p">
                        {loading ? "Creating..." : "Create Task"}
                    </button>
                </div>
            </form>
        </div>
    )
}
