"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewTemplatePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [items, setItems] = useState([{ title: "", taskType: "", priority: "medium", dueDayOffset: 0 }])

    const handleAddItem = () => {
        setItems([...items, { title: "", taskType: "", priority: "medium", dueDayOffset: 0 }])
    }

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems: any = [...items]
        newItems[index][field] = value
        setItems(newItems)
    }

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name"),
            description: formData.get("description"),
            items
        }

        try {
            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to create template")
            }

            router.push("/templates")
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
                    <Link href="/templates" style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Templates</Link>
                    <div className="ptitle">Create Workflow Template</div>
                    <div className="psub">Define a reusable bundle of tasks (e.g., Monthly Accounting)</div>
                </div>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,87,87,.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,87,87,.2)', fontSize: '13px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '900px' }}>
                <div className="ctitle">⚙️ Template Details</div>

                <div className="fg" style={{ marginTop: '16px', marginBottom: '32px' }}>
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="name">Template Name *</label>
                        <input type="text" id="name" name="name" required placeholder="e.g. Monthly Accounting & Payroll" />
                    </div>

                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="description">Description (Optional)</label>
                        <textarea id="description" name="description" rows={2} placeholder="What is this workflow used for?"></textarea>
                    </div>
                </div>

                <div className="ctitle">📋 Subtasks Included in this Template</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', marginBottom: '16px' }}>
                    These tasks will be automatically generated whenever this template is applied to a client.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {items.map((item, index) => (
                        <div key={index} style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr 120px 40px', gap: '12px', alignItems: 'end' }}>
                            <div className="field" style={{ margin: 0 }}>
                                <label>Task Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Bank Reconciliation"
                                    value={item.title}
                                    onChange={(e) => handleItemChange(index, "title", e.target.value)}
                                />
                            </div>

                            <div className="field" style={{ margin: 0 }}>
                                <label>Task Type *</label>
                                <select
                                    required
                                    value={item.taskType}
                                    onChange={(e) => handleItemChange(index, "taskType", e.target.value)}
                                >
                                    <option value="">Select...</option>
                                    <option value="ACCOUNTING">Accounting</option>
                                    <option value="TDS_PAYMENT">TDS</option>
                                    <option value="GST_1">GST</option>
                                    <option value="PF_ESI_PT">Payroll (PF/ESI)</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="field" style={{ margin: 0 }}>
                                <label>Priority</label>
                                <select
                                    value={item.priority}
                                    onChange={(e) => handleItemChange(index, "priority", e.target.value)}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div className="field" style={{ margin: 0 }}>
                                <label>Due Day (Optional)</label>
                                <input
                                    type="number"
                                    min="1" max="31"
                                    placeholder="e.g. 5"
                                    value={item.dueDayOffset || ""}
                                    onChange={(e) => handleItemChange(index, "dueDayOffset", parseInt(e.target.value) || 0)}
                                    title="Day of the month this task is typically due"
                                />
                            </div>

                            {items.length > 1 && (
                                <button
                                    type="button"
                                    className="btn-ic"
                                    style={{ height: '42px' }}
                                    onClick={() => handleRemoveItem(index)}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '16px' }}>
                    <button type="button" className="btn btn-g btn-sm" onClick={handleAddItem}>+ Add Subtask</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <button type="button" onClick={() => router.back()} className="btn btn-g">Cancel</button>
                    <button type="submit" disabled={loading} className="btn btn-p">
                        {loading ? "Saving..." : "Save Template"}
                    </button>
                </div>
            </form>
        </div>
    )
}
