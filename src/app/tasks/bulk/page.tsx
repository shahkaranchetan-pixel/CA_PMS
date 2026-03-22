"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const TASK_TYPES = [
    { value: 'gst_1', label: 'GSTR-1 Filing' },
    { value: 'gst_3b', label: 'GSTR-3B Filing' },
    { value: 'tds', label: 'TDS Payment' },
    { value: 'pf_esi_pt', label: 'PF / ESI / PT' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'audit', label: 'Audit / Verification' },
    { value: 'other', label: 'Other Compliances' }
]

export default function BulkTaskCreationPage() {
    const router = useRouter()
    const [clients, setClients] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Form states
    const [title, setTitle] = useState("")
    const [taskType, setTaskType] = useState("gst_1")
    const [frequency, setFrequency] = useState("monthly")
    const [period, setPeriod] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [priority, setPriority] = useState("medium")
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
    const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Client selection map: clientId -> boolean
    const [selectedClients, setSelectedClients] = useState<Record<string, boolean>>({})

    useEffect(() => {
        Promise.all([
            fetch('/api/clients').then(res => res.json()),
            fetch('/api/users').then(res => res.json())
        ])
            .then(([clientsData, usersData]) => {
                const activeClients = clientsData.filter((c: any) => c.active !== false)
                setClients(activeClients)
                setUsers(usersData)

                // pre-select none
                const sel: Record<string, boolean> = {}
                activeClients.forEach((c: any) => sel[c.id] = false)
                setSelectedClients(sel)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setError("Failed to load reference data")
                setLoading(false)
            })
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

    const handleSelectAll = (checked: boolean) => {
        const sel: Record<string, boolean> = {}
        clients.forEach(c => sel[c.id] = checked)
        setSelectedClients(sel)
    }

    const toggleAssignee = (id: string) => {
        setSelectedAssignees(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        )
    }

    const getSelectedCount = () => Object.values(selectedClients).filter(v => v).length

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        const selectedIds = Object.keys(selectedClients).filter(id => selectedClients[id])
        if (selectedIds.length === 0) {
            setError("Please select at least one client to generate tasks for.")
            return
        }
        if (!title || !dueDate) {
            setError("Title and Due Date are required.")
            return
        }

        setSaving(true)

        try {
            const res = await fetch("/api/tasks/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientIds: selectedIds,
                    title,
                    taskType,
                    frequency,
                    period,
                    dueDate,
                    priority,
                    assigneeIds: selectedAssignees
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "Failed to generate tasks")

            setSuccess(`Successfully generated ${data.count} tasks! Redirecting...`)
            setTimeout(() => {
                router.push("/tasks")
                router.refresh()
            }, 1500)

        } catch (err: any) {
            setError(err.message)
            setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: '20px', color: 'var(--muted)' }}>Loading...</div>

    return (
        <div>
            <div className="topbar">
                <div>
                    <Link href="/tasks" style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Tasks</Link>
                    <div className="ptitle">Bulk Create Tasks</div>
                    <div className="psub">Generate identical compliance tasks for multiple clients at once</div>
                </div>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,87,87,.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,87,87,.2)', fontSize: '13px' }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ background: 'rgba(0,207,132,.1)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(0,207,132,.2)', fontSize: '13px' }}>
                    ✅ {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card">
                <div className="two-col" style={{ alignItems: 'flex-start', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>

                    {/* Left Col: Task Template */}
                    <div className="fg" style={{ paddingRight: '16px' }}>
                        <div className="fdiv">1. Define Task Template</div>

                        <div className="field">
                            <label>Task Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                placeholder="e.g. Q1 GSTR-1 Filing"
                            />
                        </div>

                        <div className="field">
                            <label>Task Type</label>
                            <select value={taskType} onChange={e => setTaskType(e.target.value)}>
                                {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="field">
                                <label>Frequency</label>
                                <select value={frequency} onChange={e => setFrequency(e.target.value)}>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="annually">Annually</option>
                                    <option value="one_time">One-time</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Period / Tag</label>
                                <input
                                    type="text"
                                    value={period}
                                    onChange={e => setPeriod(e.target.value)}
                                    placeholder="e.g. Q1 2026 or April"
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label>Due Date *</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="field">
                            <label>Priority</label>
                            <select value={priority} onChange={e => setPriority(e.target.value)}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className="field" ref={dropdownRef} style={{ position: 'relative', zIndex: assigneeDropdownOpen ? 100 : 1 }}>
                            <label>Assignees (Multiple)</label>
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
                                    fontSize: '13px',
                                    color: selectedAssignees.length === 0 ? 'var(--muted)' : 'var(--text)'
                                }}
                            >
                                {selectedAssignees.length === 0 ? (
                                    <span>Select assignees...</span>
                                ) : (
                                    selectedAssignees.map(id => {
                                        const u = users.find(usr => usr.id === id);
                                        return (
                                            <span key={id} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                background: 'var(--gold)', color: '#000',
                                                borderRadius: '99px', padding: '2px 10px 2px 6px',
                                                fontSize: '11.5px', fontWeight: 600
                                            }}>
                                                <span style={{
                                                    width: 16, height: 16, borderRadius: '50%',
                                                    background: u?.color || '#4FACFE',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '8px', fontWeight: 700, color: '#000'
                                                }}>
                                                    {u?.name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                                {u?.name?.split(' ')[0] || 'User'}
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
                                    background: '#0e1c33', border: '1px solid var(--surface2)',
                                    borderRadius: '8px', marginTop: '4px', maxHeight: '220px',
                                    overflowY: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,.6)'
                                }}>
                                    {users.map(u => (
                                        <label key={u.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 12px', cursor: 'pointer',
                                            background: selectedAssignees.includes(u.id) ? 'rgba(232,160,32,0.15)' : '#0e1c33',
                                            borderBottom: '1px solid var(--surface2)',
                                            fontSize: '13px'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedAssignees.includes(u.id)}
                                                onChange={() => toggleAssignee(u.id)}
                                                style={{ accentColor: 'var(--gold)' }}
                                            />
                                            <div style={{
                                                width: 24, height: 24, borderRadius: '50%',
                                                background: u.color || 'var(--gold)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '10px', fontWeight: 700, color: '#000'
                                            }}>
                                                {u.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{u.name}</div>
                                                <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{u.dept || u.email}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Client Selection */}
                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="fdiv">2. Select Clients</div>

                        <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>
                                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{getSelectedCount()}</span> of {clients.length} selected
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => handleSelectAll(true)} className="btn btn-g btn-sm">Select All</button>
                                <button type="button" onClick={() => handleSelectAll(false)} className="btn btn-g btn-sm">Clear</button>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', overflowY: 'auto', maxHeight: '420px', padding: '4px' }}>
                            {clients.map(client => (
                                <label key={client.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', cursor: 'pointer', borderRadius: '4px', background: selectedClients[client.id] ? 'rgba(232, 160, 32, 0.1)' : 'transparent' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedClients[client.id] || false}
                                        onChange={(e) => setSelectedClients(prev => ({ ...prev, [client.id]: e.target.checked }))}
                                        style={{ accentColor: 'var(--gold)' }}
                                    />
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{client.name}</div>
                                        <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{client.entityType || 'Proprietorship'} {client.gstin ? `· ${client.gstin}` : ''}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                    <button type="button" onClick={() => router.back()} className="btn btn-g">Cancel</button>
                    <button type="submit" disabled={saving || getSelectedCount() === 0} className="btn btn-p">
                        {saving ? "Generating..." : `Create ${getSelectedCount()} Tasks`}
                    </button>
                </div>

            </form>
        </div>
    )
}
