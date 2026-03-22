"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PeriodSelector from "@/components/PeriodSelector"

export default function NewTaskPage() {
    const today = new Date();
    const prevMonthIdx = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
    const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
    const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [clients, setClients] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
    const [templatePreview, setTemplatePreview] = useState<any[] | null>(null)
    const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const [formValues, setFormValues] = useState({
        title: "",
        taskType: "",
        description: "",
        dueDate: "",
        period: `${MONTH_ABBRS[prevMonthIdx]}-${prevYear}`,
        clientId: "",
        frequency: "ONCE",
        templateId: "",
        priority: "medium",
        estimatedMinutes: ""
    })

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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setAssigneeDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const toggleAssignee = (id: string) => {
        setSelectedAssignees(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        )
    }

    const setFieldValue = (field: string, value: any) => {
        setFormValues(prev => ({ ...prev, [field]: value }))
    }

    const handleTaskTypeChange = (type: string) => {
        setFieldValue("taskType", type)
        
        // Smart Deadline Suggestion
        const now = new Date()
        let day = 0
        if (type === 'TDS_PAYMENT') day = 7
        else if (type === 'GST_1') day = 10
        else if (type === 'PF_ESI_PT') day = 15
        else if (type === 'GSTR_3B') day = 20
        
        if (day > 0) {
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            setFieldValue("dueDate", dateStr)
        }
    }

    const handleTemplateChange = (id: string) => {
        setFieldValue("templateId", id)
        if (!id) {
            setTemplatePreview(null)
            return
        }
        const selected = templates.find(t => t.id === id)
        if (selected) {
            setTemplatePreview(selected.items || [])
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        // Duplication Guard Check
        if (formValues.clientId && formValues.taskType && formValues.period) {
            try {
                const checkRes = await fetch(`/api/tasks?clientId=${formValues.clientId}&taskType=${formValues.taskType}&period=${formValues.period}`)
                const existing = await checkRes.json()
                if (Array.isArray(existing) && existing.length > 0) {
                    if (!confirm(`Warning: A ${formValues.taskType} task already exists for this client in ${formValues.period}. Create anyway?`)) {
                        setLoading(false)
                        return
                    }
                }
            } catch (e) {
                console.error("Duplicate check failed", e)
            }
        }

        const data = {
            ...formValues,
            assigneeIds: selectedAssignees,
            templateId: formValues.templateId || null,
            estimatedMinutes: formValues.estimatedMinutes ? parseInt(formValues.estimatedMinutes) : null,
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
                        <select id="clientId" name="clientId" required value={formValues.clientId} onChange={e => setFieldValue("clientId", e.target.value)}>
                            <option value="">Select a client...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="field" ref={dropdownRef} style={{ position: 'relative', zIndex: assigneeDropdownOpen ? 100 : 1 }}>
                        <label>Assign To (Multiple)</label>
                        <div
                            onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                            style={{
                                background: 'var(--surface2)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                minHeight: '38px',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px',
                                alignItems: 'center',
                                position: 'relative',
                                fontSize: '13px',
                                color: selectedAssignees.length === 0 ? 'var(--muted)' : 'var(--text)'
                            }}
                        >
                            {selectedAssignees.length === 0 ? (
                                <span>Select assignees...</span>
                            ) : (
                                selectedAssignees.map(id => {
                                    const emp = employees.find(e => e.id === id);
                                    return (
                                        <span key={id} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            background: 'var(--gold)', color: '#000',
                                            borderRadius: '99px', padding: '2px 10px 2px 6px',
                                            fontSize: '11.5px', fontWeight: 600
                                        }}>
                                            <span style={{
                                                width: 16, height: 16, borderRadius: '50%',
                                                background: emp?.color || '#4FACFE',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '8px', fontWeight: 700, color: '#000'
                                            }}>
                                                {emp?.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                            {emp?.name?.split(' ')[0] || emp?.email}
                                            <span
                                                onClick={(e) => { e.stopPropagation(); toggleAssignee(id); }}
                                                style={{ cursor: 'pointer', marginLeft: '2px', opacity: 0.7, fontSize: '13px' }}
                                            >×</span>
                                        </span>
                                    );
                                })
                            )}
                            <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--muted)' }}>▼</span>
                        </div>

                        {assigneeDropdownOpen && (
                            <div style={{
                                position: 'absolute', zIndex: 9999, left: 0, right: 0, top: '100%',
                                background: '#0e1c33', border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '8px', marginTop: '4px', maxHeight: '220px',
                                overflowY: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,.6)'
                            }}>
                                {employees.map(emp => (
                                    <label key={emp.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 12px', cursor: 'pointer',
                                        background: selectedAssignees.includes(emp.id) ? 'rgba(232,160,32,0.15)' : '#0e1c33',
                                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                                        fontSize: '13px'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedAssignees.includes(emp.id)}
                                            onChange={() => toggleAssignee(emp.id)}
                                            style={{ accentColor: 'var(--gold)' }}
                                        />
                                        <div style={{
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: emp.color || 'var(--gold)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '10px', fontWeight: 700, color: '#000'
                                        }}>
                                            {emp.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{emp.name || emp.email}</div>
                                            <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{emp.dept || emp.email}</div>
                                        </div>
                                    </label>
                                ))}
                                {employees.length === 0 && (
                                    <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '12px', textAlign: 'center' }}>
                                        No employees found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="fdiv">Compliance Setup</div>

                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="templateId">Auto-Apply Template Bundle</label>
                        <select id="templateId" name="templateId" style={{ background: 'var(--surface2)', border: '1px solid var(--gold)', color: 'var(--gold)' }} value={formValues.templateId} onChange={e => handleTemplateChange(e.target.value)}>
                            <option value="">No Template (Create Single Custom Task)</option>
                            {templates.map(tmp => (
                                <option key={tmp.id} value={tmp.id}>⚡ {tmp.name}</option>
                            ))}
                        </select>
                        {templatePreview && (
                            <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(232,160,32,0.05)', borderRadius: '8px', border: '1px dashed var(--gold)' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '6px' }}>Template Preview: จะสร้าง {templatePreview.length} งานย่อย</div>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {templatePreview.map((item, i) => (
                                        <span key={i} style={{ fontSize: '11px', background: 'var(--surface2)', padding: '2px 8px', borderRadius: '4px', color: 'var(--muted)' }}>
                                            • {item.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="field">
                        <label htmlFor="taskType">Statutory Task Type *</label>
                        <select id="taskType" name="taskType" required value={formValues.taskType} onChange={e => handleTaskTypeChange(e.target.value)}>
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
                        <select id="frequency" name="frequency" required value={formValues.frequency} onChange={e => setFieldValue("frequency", e.target.value)}>
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
                        <input type="text" id="title" name="title" required placeholder="e.g. File August 2026 GST Returns" value={formValues.title} onChange={e => setFieldValue("title", e.target.value)} />
                    </div>

                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="description">Notes / Instructions</label>
                        <textarea id="description" name="description" rows={3} placeholder="Add any specific context or instructions here..." value={formValues.description} onChange={e => setFieldValue("description", e.target.value)}></textarea>
                    </div>

                    <div className="fdiv">Priority & Effort</div>

                    <div className="field">
                        <label htmlFor="priority">Priority Level</label>
                        <select id="priority" name="priority" value={formValues.priority} onChange={e => setFieldValue("priority", e.target.value)}>
                            <option value="low">🟢 Low</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="high">🔴 High</option>
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="estimatedMinutes">Estimated Time (minutes)</label>
                        <input type="number" id="estimatedMinutes" name="estimatedMinutes" placeholder="e.g. 120" min="0" value={formValues.estimatedMinutes} onChange={e => setFieldValue("estimatedMinutes", e.target.value)} />
                    </div>

                    <div className="fdiv">Deadlines</div>

                    <div className="field">
                        <label htmlFor="dueDate">Due Date</label>
                        <input type="date" id="dueDate" name="dueDate" required style={{ colorScheme: 'dark' }} value={formValues.dueDate} onChange={e => setFieldValue("dueDate", e.target.value)} />
                    </div>

                    <PeriodSelector 
                        value={formValues.period} 
                        onChange={(val) => setFieldValue("period", val)} 
                    />
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
