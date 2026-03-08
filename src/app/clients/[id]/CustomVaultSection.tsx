"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface CustomVaultProps {
    clientId: string
    entries: { id: string; portalName: string; username: string | null; password: string | null; notes: string | null }[]
}

export default function CustomVaultSection({ clientId, entries }: CustomVaultProps) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [portalName, setPortalName] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [notes, setNotes] = useState("")
    const [saving, setSaving] = useState(false)
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

    const handleAdd = async () => {
        if (!portalName.trim()) return
        setSaving(true)
        try {
            const res = await fetch(`/api/clients/${clientId}/vault`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ portalName, username, password, notes })
            })
            if (res.ok) {
                setPortalName(""); setUsername(""); setPassword(""); setNotes(""); setShowForm(false)
                router.refresh()
            }
        } catch (err) { console.error(err) }
        finally { setSaving(false) }
    }

    const handleDelete = async (entryId: string) => {
        if (!confirm("Remove this login entry?")) return
        try {
            await fetch(`/api/clients/${clientId}/vault`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entryId })
            })
            router.refresh()
        } catch (err) { console.error(err) }
    }

    const handleReveal = async (entryId: string, portal: string) => {
        const currentlyShown = !!showPasswords[entryId];
        setShowPasswords(p => ({ ...p, [entryId]: !currentlyShown }));

        if (!currentlyShown) {
            try {
                await fetch(`/api/clients/${clientId}/vault/audit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'VIEW', portalName: portal })
                });
            } catch (err) { }
        }
    }

    const handleCopy = async (password: string, portal: string) => {
        if (!password) return;
        await navigator.clipboard.writeText(password);
        try {
            await fetch(`/api/clients/${clientId}/vault/audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'COPY', portalName: portal })
            });
        } catch (err) { }
    }

    return (
        <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                    🔑 Custom Logins
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
                >
                    {showForm ? '✕ Cancel' : '+ Add Login'}
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label>Portal / Website Name *</label>
                            <input type="text" value={portalName} onChange={e => setPortalName(e.target.value)} placeholder="e.g. MCA Portal, E-Way Bill, MSME Portal" />
                        </div>
                        <div className="field">
                            <label>User ID</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter user ID" />
                        </div>
                        <div className="field">
                            <label>Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
                        </div>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label>Notes (Optional)</label>
                            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Secondary credentials, OTP contact number" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button onClick={handleAdd} disabled={saving || !portalName.trim()} className="btn btn-p" style={{ fontSize: '12px', padding: '7px 16px' }}>
                            {saving ? 'Saving...' : '💾 Save Login'}
                        </button>
                    </div>
                </div>
            )}

            {/* Custom entries list */}
            {entries.length === 0 && !showForm && (
                <div style={{ textAlign: 'center', padding: '14px', color: 'var(--muted)', fontSize: '11.5px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                    No custom logins added yet
                </div>
            )}

            <div style={{ display: 'grid', gap: '6px' }}>
                {entries.map(entry => (
                    <div key={entry.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: 'rgba(232,160,32,.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'var(--gold)', flexShrink: 0 }}>
                            🔑
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                {entry.portalName}
                                {entry.password && (
                                    <button onClick={() => handleCopy(entry.password!, entry.portalName)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                                        COPY PW
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User ID</span>
                                    <div style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'monospace', background: 'var(--surface2)', padding: '3px 7px', borderRadius: '4px', marginTop: '2px' }}>
                                        {entry.username || '-'}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Password
                                        <button onClick={() => handleReveal(entry.id, entry.portalName)} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                            {showPasswords[entry.id] ? 'HIDE' : 'SHOW'}
                                        </button>
                                    </span>
                                    <div style={{ fontSize: '12px', color: showPasswords[entry.id] ? 'var(--text)' : 'transparent', fontFamily: 'monospace', background: 'var(--surface2)', padding: '3px 7px', borderRadius: '4px', marginTop: '2px', position: 'relative' }}>
                                        {showPasswords[entry.id] ? (entry.password || '-') : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: '7px', color: 'var(--muted)', fontSize: '16px', letterSpacing: '2px' }}>••••••</span>}
                                    </div>
                                </div>
                            </div>
                            {entry.notes && (
                                <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginTop: '6px', fontStyle: 'italic' }}>📝 {entry.notes}</div>
                            )}
                        </div>
                        <button onClick={() => handleDelete(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '14px', padding: '4px', flexShrink: 0 }} title="Delete">
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
