"use client"

import { useState } from "react"

interface VaultProps {
    portal: string
    username?: string | null
    password?: string | null
    color: string
    icon: string
    clientId: string
}

export default function VaultCredential({ portal, username, password, color, icon, clientId }: VaultProps) {
    const [show, setShow] = useState(false)
    const hasCreds = username || password

    const handleReveal = async () => {
        const newShow = !show;
        setShow(newShow);
        if (newShow) {
            try {
                await fetch(`/api/clients/${clientId}/vault/audit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'VIEW', portalName: portal })
                });
            } catch (err) { console.error("Could not log audit event"); }
        }
    }

    const handleCopy = async () => {
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
        <div style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', background: `${color}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    {portal}
                    {hasCreds && (
                        <button onClick={handleCopy} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                            COPY PW
                        </button>
                    )}
                </div>
                {hasCreds ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</span>
                            <div style={{ fontSize: '12.5px', color: 'var(--text)', fontFamily: 'monospace', background: 'var(--surface2)', padding: '4px 8px', borderRadius: '4px', marginTop: '2px' }}>
                                {username || '-'}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Password
                                <button onClick={handleReveal} style={{ background: 'none', border: 'none', color: color, fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                    {show ? 'HIDE' : 'SHOW'}
                                </button>
                            </span>
                            <div style={{ fontSize: '12.5px', color: show ? 'var(--text)' : 'transparent', fontFamily: 'monospace', background: 'var(--surface2)', padding: '4px 8px', borderRadius: '4px', marginTop: '2px', position: 'relative' }}>
                                {show ? (password || '-') : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: '8px', color: 'var(--muted)', fontSize: '18px', letterSpacing: '2px', top: '2px' }}>••••••••</span>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>No credentials saved. Edit client to add.</div>
                )}
            </div>
        </div>
    )
}
