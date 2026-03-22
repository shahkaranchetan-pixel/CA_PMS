"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

export default function EditTemplatePage() {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        fetch(`/api/templates/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error)
                setName(data.name)
                setDescription(data.description || "")
                setItems(data.items || [])
                setLoading(false)
            })
            .catch(err => {
                setError(err.message || "Failed to load template data")
                setLoading(false)
            })
    }, [id])

    const addTaskItem = () => {
        setItems([...items, { title: '', taskType: 'ACCOUNTING', priority: 'medium', dueDayOffset: 0 }])
    }

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx))
    }

    const updateItem = (idx: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[idx] = { ...newItems[idx], [field]: value }
        setItems(newItems)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || items.length === 0) {
            setError("Template name and at least one task are required")
            return
        }

        setSaving(true)
        setError("")

        try {
            const res = await fetch(`/api/templates/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, items })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to update template")
            }

            router.push("/templates")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this template? This will not affect tasks already created from it.")) return;
        setSaving(true)
        try {
            const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
            if (res.ok) {
                router.push("/templates")
                router.refresh()
            } else {
                throw new Error("Failed to delete template")
            }
        } catch (err: any) {
            setError(err.message)
            setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--muted)' }}>Loading template data...</div>

    return (
        <div>
            <div className="topbar">
                <div>
                    <Link href="/templates" style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Templates</Link>
                    <div className="ptitle">Edit Template: {name}</div>
                    <div className="psub">Standardize your workflow by defining a set of recurring subtasks</div>
                </div>
                <div className="sep" />
                <button onClick={handleDelete} className="btn btn-d">🗑️ Delete Template</button>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,87,87,0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,87,87,0.2)', marginBottom: '20px', fontSize: '13px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="two-col">
                <div className="card">
                    <div className="ctitle">📋 Template Details</div>
                    <div className="fg" style={{ marginTop: '16px' }}>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label>Template Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Monthly GSTR-1 & 3B Bundle"
                                required
                            />
                        </div>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Optional description of this workflow"
                                rows={2}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <div className="ctitle">
                            <span>🛠️ Workflow Tasks</span>
                            <button type="button" onClick={addTaskItem} className="btn btn-b btn-sm">+ Add Task</button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                            {items.map((item, idx) => (
                                <div key={idx} style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => removeItem(idx)}
                                        style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                                    >
                                        ✕
                                    </button>
                                    
                                    <div className="fg">
                                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                                            <label>Task Title *</label>
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={e => updateItem(idx, 'title', e.target.value)}
                                                placeholder="e.g. Data Entry & Verification"
                                                required
                                            />
                                        </div>
                                        <div className="field">
                                            <label>Task Type</label>
                                            <select value={item.taskType} onChange={e => updateItem(idx, 'taskType', e.target.value)}>
                                                <option value="ACCOUNTING">Accounting</option>
                                                <option value="GST_FILING">GST Filing</option>
                                                <option value="INCOME_TAX">Income Tax</option>
                                                <option value="TDS_TCS">TDS/TCS</option>
                                                <option value="AUDIT">Audit</option>
                                                <option value="COMPLIANCE">General Compliance</option>
                                            </select>
                                        </div>
                                        <div className="field">
                                            <label>Due Day Offset (Fixed)</label>
                                            <input
                                                type="number"
                                                value={item.dueDayOffset}
                                                onChange={e => updateItem(idx, 'dueDayOffset', e.target.value)}
                                                placeholder="e.g. 10"
                                            />
                                            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Day of month (e.g. 10th)</div>
                                        </div>
                                        <div className="field">
                                            <label>Priority</label>
                                            <select value={item.priority} onChange={e => updateItem(idx, 'priority', e.target.value)}>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {items.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '30px', border: '2px dashed var(--border)', borderRadius: '12px', color: 'var(--muted)' }}>
                                    No tasks added to this template yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ height: 'fit-content' }}>
                    <div className="ctitle">💡 Usage Tip</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                        When you apply this template to a client, the "Due Day Offset" will be used to automatically set the deadline for that specific month.
                        <br/><br/>
                        For example, if you set it to <b>10</b> and create the task for <b>April 2026</b>, the subtask will be due on <b>10th April 2026</b>.
                    </div>
                    
                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button type="submit" disabled={saving} className="btn btn-p" style={{ width: '100%', justifyContent: 'center' }}>
                            {saving ? "Updating..." : "Update Template Bundle"}
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
