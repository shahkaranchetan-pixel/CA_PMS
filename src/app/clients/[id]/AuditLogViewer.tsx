"use client"

import { useState, useEffect } from "react"

interface AuditLog {
    id: string
    action: string
    portalName: string
    createdAt: string
    user: {
        name: string | null
        email: string | null
        role: string
    }
}

export default function AuditLogViewer({ clientId }: { clientId: string }) {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/clients/${clientId}/vault/audit`)
            .then(async res => {
                if (!res.ok) throw new Error(await res.text())
                return res.json()
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setLogs(data)
                } else {
                    // Handle cases where data might not be an array, or log an error
                    console.error("Received non-array data for audit logs:", data);
                    setLogs([]); // Clear logs or handle appropriately
                }
                setLoading(false)
            })
            .catch(err => {
                console.error("Failed to fetch logs", err)
                setLoading(false)
            })
    }, [clientId])

    if (loading) return <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '10px' }}>Loading audit logs...</div>

    return (
        <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge b-high">ADMIN ONLY</span>
                Vault Access History
            </div>

            {logs.length === 0 ? (
                <div style={{ fontSize: '11px', color: 'var(--muted)', padding: '10px', border: '1px dashed var(--border)', borderRadius: '6px', textAlign: 'center' }}>
                    No access events recorded yet.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                    {logs.map(log => (
                        <div key={log.id} style={{ fontSize: '11px', background: 'var(--surface2)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, color: log.action === 'COPY' ? 'var(--gold)' : '#4FACFE' }}>
                                {log.action}
                            </div>
                            <div>
                                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{log.user.name}</span>
                                <span style={{ color: 'var(--muted)', margin: '0 4px' }}>accessed</span>
                                <span style={{ color: 'var(--text)' }}>{log.portalName}</span>
                            </div>
                            <div style={{ color: 'var(--muted)' }}>
                                {new Date(log.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
