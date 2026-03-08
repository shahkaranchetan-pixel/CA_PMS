import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ClientsPage() {
    const clients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">Client Management</div>
                    <div className="psub">View and manage all active clients and their login vaults</div>
                </div>
                <div className="sep" />
                <div className="sbox">
                    <span style={{ color: 'var(--muted)' }}>🔍</span>
                    <input type="text" placeholder="Search entity, PAN, or GSTIN..." />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <a href="/api/export/clients" className="btn btn-g">📤 Export CSV</a>
                    <Link href="/clients/new" className="btn btn-p">+ New Client</Link>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="tbl">
                    <thead style={{ background: 'rgba(255,255,255,.01)' }}>
                        <tr>
                            <th>Entity Name</th>
                            <th>Identifiers</th>
                            <th>Contact</th>
                            <th>Vault</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(c => (
                            <tr key={c.id}>
                                <td>
                                    <Link href={`/clients/${c.id}`} style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
                                        {c.name}
                                    </Link>
                                    <div className={`badge ${c.entityType?.includes('Pvt') ? 'b-admin' : c.entityType?.includes('LLP') ? 'b-entity' : 'b-member'}`}>
                                        {c.entityType || 'Proprietorship'}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '3px' }}>PAN: <span style={{ color: 'var(--text)', fontWeight: 500, fontFamily: 'monospace', letterSpacing: '1px' }}>{c.pan || '-'}</span></div>
                                    <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>GST: <span style={{ color: 'var(--text)', fontWeight: 500, fontFamily: 'monospace', letterSpacing: '1px' }}>{c.gstin || '-'}</span></div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '12.5px', color: 'var(--text)' }}>{c.contact || '-'}</div>
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
                {clients.length === 0 && (
                    <div className="empty">
                        <div className="empty-i">👥</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>No clients found</div>
                        <div style={{ fontSize: '12.5px' }}>Add a new client to get started.</div>
                    </div>
                )}
            </div>
        </div>
    )
}
