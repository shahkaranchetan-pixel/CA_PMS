"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ClientListClient({ initialClients, templates, employees }: { initialClients: any[], templates: any[], employees: any[] }) {
    const router = useRouter()
    const [selectedClients, setSelectedClients] = useState<string[]>([])
    const [showBatchModal, setShowBatchModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [batchData, setBatchData] = useState({
        templateId: "",
        title: "",
        taskType: "ACCOUNTING",
        period: "",
        dueDate: "",
        priority: "medium",
        assigneeIds: [] as string[]
    })

    const toggleClient = (id: string) => {
        setSelectedClients(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedClients.length === initialClients.length) {
            setSelectedClients([])
        } else {
            setSelectedClients(initialClients.map(c => c.id))
        }
    }

    const handleBatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedClients.length === 0) return
        setLoading(true)

        try {
            const res = await fetch("/api/tasks/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientIds: selectedClients,
                    ...batchData
                })
            })

            if (res.ok) {
                alert(`Successfully created tasks for ${selectedClients.length} clients!`)
                setShowBatchModal(false)
                setSelectedClients([])
                router.refresh()
            } else {
                const err = await res.json()
                alert(err.error || "Failed to create batch tasks")
            }
        } catch (err) {
            console.error("Batch error", err)
            alert("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">Client Management</div>
                    <div className="psub">View and manage all active clients and their login vaults</div>
                </div>
                <div className="sep" />
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    {selectedClients.length > 0 && (
                        <button onClick={() => setShowBatchModal(true)} className="btn btn-b">⚡ Batch Template ({selectedClients.length})</button>
                    )}
                    <a href="/api/export/clients" className="btn btn-g">📤 Export CSV</a>
                    <Link href="/clients/new" className="btn btn-p">+ New Client</Link>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrapper">
<table className="tbl">
                    <thead style={{ background: 'rgba(255,255,255,.01)' }}>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input type="checkbox" checked={selectedClients.length === initialClients.length && initialClients.length > 0} onChange={toggleAll} />
                            </th>
                            <th>Entity Name</th>
                            <th>Health</th>
                            <th>Identifiers</th>
                            <th>Last Activity</th>
                            <th>Vault</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialClients.map(c => (
                            <tr key={c.id}>
                                <td>
                                    <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleClient(c.id)} />
                                </td>
                                <td>
                                    <Link href={`/clients/${c.id}`} style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
                                        {c.name}
                                    </Link>
                                    <div className={`badge ${c.entityType?.includes('Pvt') ? 'b-admin' : c.entityType?.includes('LLP') ? 'b-entity' : 'b-member'}`}>
                                        {c.entityType || 'Proprietorship'}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '50%', 
                                            background: c.healthScore > 80 ? 'rgba(0,207,132,0.1)' : c.healthScore > 50 ? 'rgba(255,176,32,0.1)' : 'rgba(255,87,87,0.1)',
                                            color: c.healthScore > 80 ? '#00CF84' : c.healthScore > 50 ? '#FFB020' : '#FF5757',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontWeight: 700, border: `1px solid ${c.healthScore > 80 ? 'rgba(0,207,132,0.2)' : c.healthScore > 50 ? 'rgba(255,176,32,0.2)' : 'rgba(255,87,87,0.2)'}`
                                        }}>
                                            {c.healthScore}
                                        </div>
                                        {c.overdueCount > 0 && <span className="badge b-high" style={{ fontSize: '9px' }}>{c.overdueCount} Overdue</span>}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '3px' }}>PAN: <span style={{ color: 'var(--text)', fontWeight: 500, fontFamily: 'monospace', letterSpacing: '1px' }}>{c.pan || '-'}</span></div>
                                    <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>GST: <span style={{ color: 'var(--text)', fontWeight: 500, fontFamily: 'monospace', letterSpacing: '1px' }}>{c.gstin || '-'}</span></div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{new Date(c.lastActivity).toLocaleDateString()}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Latest Interaction</div>
                                </td>
                                <td>
                                    <Link href={`/clients/${c.id}`} className="badge b-member" style={{ cursor: 'pointer' }}>
                                        🔐 View Vault
                                    </Link>
                                </td>
                                <td>
                                    <div className={`badge ${c.active ? 'b-active' : 'b-inactive'}`}>
                                        {c.active ? '● Active' : '○ Inactive'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
</div>
            </div>

            {showBatchModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
                        <div className="ctitle" style={{ fontSize: '18px' }}>⚡ Batch Template Application</div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>Apply a standard workflow to {selectedClients.length} selected clients.</div>
                        
                        <form onSubmit={handleBatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="field">
                                <label>Selection Template *</label>
                                <select required value={batchData.templateId} onChange={e => setBatchData({...batchData, templateId: e.target.value})}>
                                    <option value="">Select a template...</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label>Batch Title *</label>
                                <input type="text" required placeholder="e.g. FY2026 Onboarding" value={batchData.title} onChange={e => setBatchData({...batchData, title: e.target.value})} />
                            </div>
                            <div className="fg">
                                <div className="field">
                                    <label>Period</label>
                                    <input type="text" placeholder="e.g. Mar-2026" value={batchData.period} onChange={e => setBatchData({...batchData, period: e.target.value})} />
                                </div>
                                <div className="field">
                                    <label>Master Due Date *</label>
                                    <input type="date" required style={{colorScheme:'dark'}} value={batchData.dueDate} onChange={e => setBatchData({...batchData, dueDate: e.target.value})} />
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                                <button type="button" onClick={() => setShowBatchModal(false)} className="btn btn-g">Cancel</button>
                                <button type="submit" disabled={loading} className="btn btn-p">{loading ? "Processing..." : "Apply to Batch"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
