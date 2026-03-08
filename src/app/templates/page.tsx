import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function TemplatesPage() {
    const templates = await prisma.taskTemplate.findMany({
        include: { items: { orderBy: { dueDayOffset: 'asc' } } },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">Task Templates</div>
                    <div className="psub">Manage standard workflows and compliance bundles</div>
                </div>
                <div className="sep" />
                <Link href="/templates/new" className="btn btn-p">+ New Template</Link>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="tbl">
                    <thead style={{ background: 'rgba(255,255,255,.01)' }}>
                        <tr>
                            <th>Template Name</th>
                            <th>Description</th>
                            <th>Tasks Included</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {templates.length === 0 ? (
                            <tr>
                                <td colSpan={4}>
                                    <div className="empty">
                                        <div className="empty-i">⚙️</div>
                                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>No templates configured</div>
                                        <div style={{ fontSize: '12.5px' }}>Create templates to standardize your team's workflow.</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            templates.map(tmp => (
                                <tr key={tmp.id}>
                                    <td style={{ fontWeight: 600 }}>{tmp.name}</td>
                                    <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{tmp.description || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {tmp.items.map((item: any, idx) => (
                                                <span key={item.id} style={{ background: 'var(--surface2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                    {idx + 1}. {item.title}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-g btn-sm">Edit</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
