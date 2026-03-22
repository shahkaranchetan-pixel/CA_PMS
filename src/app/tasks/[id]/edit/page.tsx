"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

export default function EditTaskPage() {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [users, setUsers] = useState<any[]>([])
    const [formData, setFormData] = useState<any>({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        assigneeIds: [],
        status: "PENDING",
    })

    useEffect(() => {
        // Fetch task and users in parallel
        Promise.all([
            fetch(`/api/tasks/${id}`).then(res => res.json()),
            fetch('/api/users').then(res => res.json())
        ])
            .then(([task, users]) => {
                if (task.error) throw new Error(task.error)
                setFormData({
                    title: task.title,
                    description: task.description || "",
                    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
                    priority: task.priority || "medium",
                    status: task.status,
                    assigneeIds: task.taskAssignees?.map((ta: any) => ta.userId) || [],
                })
                setUsers(users)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message || "Failed to load data")
                setLoading(false)
            })
    }, [id])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    const toggleAssignee = (uid: string) => {
        setFormData((prev: any) => {
            const current = [...prev.assigneeIds]
            if (current.includes(uid)) {
                return { ...prev, assigneeIds: current.filter(id => id !== uid) }
            } else {
                return { ...prev, assigneeIds: [...current, uid] }
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError("")

        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to update task")
            }

            router.push(`/tasks/${id}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--muted)' }}>Loading task data...</div>

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="topbar">
                <div>
                    <Link href={`/tasks/${id}`} style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Task Details</Link>
                    <div className="ptitle">Edit Task: {formData.title}</div>
                    <div className="psub">Update task title, assignees, deadlines and priority</div>
                </div>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,87,87,0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,87,87,0.2)', marginBottom: '20px', fontSize: '13px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="two-col">
                <div className="card">
                    <div className="ctitle">📝 Task Information</div>
                    <div className="fg" style={{ marginTop: '16px' }}>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label>Task Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                            />
                        </div>
                        <div className="field">
                            <label>Due Date</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="field">
                            <label>Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleChange}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="PENDING">Pending</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="UNDER_REVIEW">Under Review</option>
                                <option value="BLOCKED">Blocked</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="ctitle">👤 Reassignment</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                        {users.map(u => (
                            <div 
                                key={u.id} 
                                onClick={() => toggleAssignee(u.id)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', 
                                    background: formData.assigneeIds.includes(u.id) ? 'rgba(232,160,32,0.1)' : 'var(--surface2)',
                                    borderRadius: '8px', border: `1px solid ${formData.assigneeIds.includes(u.id) ? 'var(--gold)' : 'var(--border)'}`,
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ 
                                    width: 14, height: 14, borderRadius: 3, 
                                    border: `2px solid ${formData.assigneeIds.includes(u.id) ? 'var(--gold)' : 'var(--muted)'}`,
                                    background: formData.assigneeIds.includes(u.id) ? 'var(--gold)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {formData.assigneeIds.includes(u.id) && <span style={{ color: '#000', fontSize: '10px', fontWeight: 900 }}>✓</span>}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>{u.name}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button type="submit" disabled={saving} className="btn btn-p" style={{ width: '100%', justifyContent: 'center' }}>
                            {saving ? "Saving Changes..." : "Update Task"}
                        </button>
                        <button type="button" onClick={() => router.back()} className="btn btn-g" style={{ width: '100%', justifyContent: 'center' }}>
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
