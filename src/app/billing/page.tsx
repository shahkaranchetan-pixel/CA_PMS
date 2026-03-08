import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function BillingPage() {
    const invoices = await prisma.invoice.findMany({
        include: {
            client: true,
            items: true
        },
        orderBy: { date: 'desc' }
    })

    const totalBilled = invoices.reduce((acc, inv) => acc + inv.items.reduce((s, i) => s + i.amount, 0), 0)
    const paidInvoices = invoices.filter(i => i.status === 'paid')
    const totalCollected = paidInvoices.reduce((acc, inv) => acc + inv.items.reduce((s, i) => s + i.amount, 0), 0)
    const overdueInvoices = invoices.filter(i => i.status === 'overdue' || (i.status !== 'paid' && new Date(i.dueDate) < new Date()))
    const totalOverdue = overdueInvoices.reduce((acc, inv) => acc + inv.items.reduce((s, i) => s + i.amount, 0), 0)

    const fmt = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">Billing & Invoicing</div>
                    <div className="psub">Manage client invoices and track payments</div>
                </div>
                <div className="sep" />
                <button className="btn btn-g">📥 Export CSV</button>
                <Link href="/billing/new" className="btn btn-p">+ New Invoice</Link>
            </div>

            <div className="stats">
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#4FACFE' }} />
                    <div style={{ fontSize: '18px' }}>🧾</div>
                    <div className="scard-val" style={{ color: '#4FACFE' }}>{fmt(totalBilled)}</div>
                    <div className="scard-lbl">Total Billed</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#00CF84' }} />
                    <div style={{ fontSize: '18px' }}>💰</div>
                    <div className="scard-val" style={{ color: '#00CF84' }}>{fmt(totalCollected)}</div>
                    <div className="scard-lbl">Total Collected</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#FF5757' }} />
                    <div style={{ fontSize: '18px' }}>⚠️</div>
                    <div className="scard-val" style={{ color: '#FF5757' }}>{fmt(totalOverdue)}</div>
                    <div className="scard-lbl">Overdue Amount</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#FFB020' }} />
                    <div style={{ fontSize: '18px' }}>⏳</div>
                    <div className="scard-val" style={{ color: '#FFB020' }}>{invoices.length - paidInvoices.length}</div>
                    <div className="scard-lbl">Active Invoices</div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="tbl">
                    <thead style={{ background: 'rgba(255,255,255,.01)' }}>
                        <tr>
                            <th>Inv Number</th>
                            <th>Entity Name</th>
                            <th>Date & Due</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="empty">
                                        <div className="empty-i">🧾</div>
                                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>No invoices found</div>
                                        <div style={{ fontSize: '12.5px' }}>Create your first invoice to get started.</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            invoices.map(inv => {
                                const amount = inv.items.reduce((s, i) => s + i.amount, 0)
                                const isOverdue = inv.status !== 'paid' && new Date(inv.dueDate) < new Date()
                                const s = isOverdue ? 'overdue' : inv.status

                                return (
                                    <tr key={inv.id}>
                                        <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px' }}>{inv.number}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{inv.client.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{inv.client.gstin || 'No GSTIN'}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '12.5px' }}>{new Date(inv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                            <div style={{ fontSize: '11px', color: isOverdue ? 'var(--danger)' : 'var(--muted)', marginTop: '2px' }}>
                                                Due: {new Date(inv.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`badge b-${s}`}>
                                                {s.toUpperCase()}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'Playfair Display,serif', fontSize: '16px', color: 'var(--gold)' }}>
                                            {fmt(amount)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn btn-g btn-sm">PDF</button>
                                            <Link href={`/billing/${inv.id}`} className="btn btn-b btn-sm" style={{ marginLeft: '6px' }}>View</Link>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
