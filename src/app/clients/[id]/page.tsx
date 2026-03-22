import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import VaultCredential from "./VaultCredential"
import CustomVaultSection from "./CustomVaultSection"
import DocumentUploadSection from "./DocumentUploadSection"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";

import AuditLogViewer from "./AuditLogViewer"

export const dynamic = "force-dynamic"

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role || 'EMPLOYEE'
    const userId = (session?.user as any)?.id

    const baseTaskWhere: any = userRole === 'ADMIN' ? {} : { taskAssignees: { some: { userId } } };

    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            tasks: {
                where: baseTaskWhere,
                orderBy: { dueDate: 'asc' },
                take: 5
            },
            notes: {
                orderBy: { date: 'desc' },
                include: { author: true }
            },
            vaultEntries: {
                orderBy: { createdAt: 'asc' }
            },
            documents: {
                orderBy: { uploadedAt: 'desc' }
            }
        }
    })

    if (!client) {
        notFound()
    }

    return (
        <div>
            <div className="topbar">
                <div>
                    <Link href="/clients" style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Clients</Link>
                    <div className="ptitle">{client.name}</div>
                    <div className="psub">
                        <span className={`badge ${client.entityType?.includes('Pvt') ? 'b-admin' : client.entityType?.includes('LLP') ? 'b-entity' : 'b-member'}`} style={{ marginRight: '8px' }}>
                            {client.entityType || 'Proprietorship'}
                        </span>
                        Client Profile & Vault
                    </div>
                </div>
                <div className="sep" />
                <Link href={`/clients/${client.id}/edit`} className="btn btn-g">✏️ Edit Client</Link>
                <Link href={`/tasks/new?clientId=${client.id}`} className="btn btn-p">+ New Task</Link>
            </div>

            <div className="two-col">
                {/* Entity Details */}
                <div className="card">
                    <div className="ctitle">🏢 Entity Details</div>
                    <div className="fg" style={{ marginTop: '16px' }}>
                        <div className="field">
                            <label>PAN Number</label>
                            <div style={{ color: 'var(--text)', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px', background: 'rgba(255,255,255,.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                {client.pan || 'Not provided'}
                            </div>
                        </div>
                        <div className="field">
                            <label>TAN Number</label>
                            <div style={{ color: 'var(--text)', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px', background: 'rgba(255,255,255,.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                {client.tan || 'Not provided'}
                            </div>
                        </div>
                        <div className="field">
                            <label>GSTIN</label>
                            <div style={{ color: 'var(--text)', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px', background: 'rgba(255,255,255,.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                {client.gstin || 'Not provided'}
                            </div>
                        </div>
                        <div className="field">
                            <label>Contact Person</label>
                            <div style={{ color: 'var(--text)', fontSize: '13px', background: 'rgba(255,255,255,.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                {client.contactPerson || '—'}
                            </div>
                        </div>
                        <div className="field">
                            <label>Contact Email</label>
                            <div style={{ color: 'var(--text)', fontSize: '13px', background: 'rgba(255,255,255,.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                {client.contactEmail || '—'}
                            </div>
                        </div>
                        <div className="field">
                            <label>Contact Phone</label>
                            <div style={{ color: 'var(--text)', fontSize: '13px', background: 'rgba(255,255,255,.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                {client.contactPhone || '—'}
                            </div>
                        </div>
                        <div className="field">
                            <label>Status</label>
                            <div style={{ padding: '8px 0' }}>
                                <span className={`badge ${client.active ? 'b-active' : 'b-inactive'}`}>
                                    {client.active ? '● Active' : '○ Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Vault */}
                <div className="card">
                    <div className="ctitle">
                        <span>🔐 Login Vault Initiation</span>
                        <span className="badge b-high" style={{ fontSize: '9px' }}>CONFIDENTIAL</span>
                    </div>

                    {/* Standard Portals */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '12px' }}>
                        <VaultCredential clientId={client.id} portal="Income Tax Portal" username={client.itxLogin} password={client.itxPassword} color="#4FACFE" icon="🏦" />
                        <VaultCredential clientId={client.id} portal="GST Portal" username={client.gstLogin} password={client.gstPassword} color="#B89AFF" icon="📊" />
                        <VaultCredential clientId={client.id} portal="Traces / TDS" username={client.tracesLogin} password={client.tracesPassword} color="#00CF84" icon="📋" />
                    </div>

                    {/* Separated PF, ESI, PT */}
                    <div style={{ marginTop: '12px', fontSize: '10px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1.5px', textTransform: 'uppercase', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                        Labour & Statutory
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '8px' }}>
                        <VaultCredential clientId={client.id} portal="PF (EPFO)" username={(client as any).pfLogin} password={(client as any).pfPassword} color="#FFB020" icon="🏛️" />
                        <VaultCredential clientId={client.id} portal="ESI (ESIC)" username={(client as any).esiLogin} password={(client as any).esiPassword} color="#FF6B6B" icon="🏥" />
                        <VaultCredential clientId={client.id} portal="Professional Tax (PT)" username={client.ptLogin} password={client.ptPassword} color="#4FACFE" icon="💼" />
                    </div>

                    {/* Custom Logins */}
                    <CustomVaultSection clientId={client.id} entries={client.vaultEntries as any} />

                    {userRole === 'ADMIN' && (
                        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <AuditLogViewer clientId={client.id} />
                        </div>
                    )}
                </div>
            </div>

            {/* KYC Documents Section - Full Width */}
            <div className="card" style={{ marginTop: '16px' }}>
                <DocumentUploadSection clientId={client.id} documents={client.documents as any} />
            </div>

            <div className="two-col" style={{ marginTop: '16px' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="ctitle" style={{ padding: '16px 16px 0' }}>Recent Tasks for {client.name}</div>
                    {client.tasks.length === 0 ? (
                        <div className="empty">
                            <div className="empty-i">📋</div>
                            <div style={{ fontSize: '13px' }}>No active tasks found.</div>
                        </div>
                    ) : (
                        <table className="tbl" style={{ marginTop: '12px' }}>
                            <tbody>
                                {client.tasks.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{t.title}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{t.taskType.replace(/_/g, ' ')}</div>
                                        </td>
                                        <td>
                                            <div className={`badge b-${t.status.toLowerCase()}`}>
                                                {t.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Link href={`/tasks/${t.id}`} className="btn btn-g btn-sm">View</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="card">
                    <div className="ctitle">📝 Client Notes & Activity</div>
                    {client.notes.length === 0 ? (
                        <div className="empty" style={{ padding: '20px 0' }}>
                            <div className="empty-i">📝</div>
                            <div style={{ fontSize: '13px' }}>No notes explicitly added yet.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                            {client.notes.map(n => (
                                <div key={n.id} style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span className="badge b-member" style={{ fontSize: '10px' }}>{n.type}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{new Date(n.date).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.5 }}>{n.text}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '8px', textAlign: 'right' }}>— {n.author.name || 'User'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
