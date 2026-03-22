"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface ComplianceMatrixProps {
    clients: any[];
    tasks: any[];
    currentPeriod: string;
}

function getStatusIcon(status: string) {
    const config: Record<string, { color: string, glow: string, label: string }> = {
        'COMPLETED': { color: '#00CF84', glow: 'rgba(0, 207, 132, 0.4)', label: 'Completed' },
        'IN_PROGRESS': { color: '#4FACFE', glow: 'rgba(79, 172, 254, 0.4)', label: 'In Progress' },
        'BLOCKED': { color: '#FF5757', glow: 'rgba(255, 87, 87, 0.4)', label: 'Blocked' },
        'UNDER_REVIEW': { color: '#B89AFF', glow: 'rgba(184, 154, 255, 0.4)', label: 'Under Review' },
        'PENDING': { color: 'var(--surface2)', glow: 'transparent', label: 'Pending' }
    };

    const s = config[status] || config['PENDING'];

    return (
        <div 
            title={s.label}
            style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                background: s.color,
                margin: '0 auto',
                boxShadow: status !== 'PENDING' ? `0 0 8px ${s.glow}` : 'none',
                border: status === 'PENDING' ? '1px solid var(--border)' : 'none'
            }} 
        />
    );
}

export default function ComplianceMatrix({ clients, tasks, currentPeriod }: ComplianceMatrixProps) {
    const router = useRouter();
    
    const STATUTORY_TYPES = [
        { key: 'GST_1', label: 'GST-1' },
        { key: 'GSTR_3B', label: 'GST-3B' },
        { key: 'TDS_PAYMENT', label: 'TDS' },
        { key: 'PF_ESI_PT', label: 'PF/ESI' },
        { key: 'ACCOUNTING', label: 'Acc.' }
    ];

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const periods = [];
    for (let i = -6; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        periods.push(`${months[d.getMonth()]}-${d.getFullYear()}`);
    }

    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.push(`/calendar?period=${e.target.value}`);
    };

    return (
        <div className="card glass-matrix" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1.5px', color: 'var(--gold)', textShadow: '0 0 10px rgba(232, 160, 32, 0.2)' }}>
                    STATUTORY COMPLIANCE MATRIX
                </div>
                <select 
                    value={currentPeriod} 
                    onChange={handlePeriodChange}
                    style={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontSize: '11px',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        outline: 'none',
                    }}
                >
                    {periods.map(p => (
                        <option key={p} value={p}>{p.replace('-', ' ')}</option>
                    ))}
                </select>
            </div>
            <div style={{ maxHeight: '500px', overflowX: 'auto', overflowY: 'auto' }}>
                <table className="tbl-matrix" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 20, minWidth: '140px', borderRight: '1px solid var(--border)', fontSize: '9px', letterSpacing: '1px', padding: '12px' }}>ENTITY NAME</th>
                            {STATUTORY_TYPES.map(type => (
                                <th key={type.key} style={{ textAlign: 'center', minWidth: '70px', fontSize: '9px', letterSpacing: '1px', padding: '12px' }}>{type.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => (
                            <tr key={client.id} className="matrix-row">
                                <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 5, fontWeight: 700, fontSize: '12px', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', fontStyle: 'italic', padding: '12px', transition: 'all 0.2s' }}>
                                    {client.name}
                                </td>
                                {STATUTORY_TYPES.map(type => {
                                    const task = tasks.find(t => t.clientId === client.id && t.taskType === type.key);
                                    return (
                                        <td key={type.key} style={{ textAlign: 'center', padding: '12px 6px' }}>
                                            {task ? (
                                                <Link href={`/tasks/${task.id}`} className="status-dot-link" style={{ textDecoration: 'none', display: 'block' }}>
                                                    {getStatusIcon(task.status)}
                                                </Link>
                                            ) : (
                                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', margin: '0 auto' }} />
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.01)', color: 'var(--muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00CF84', boxShadow: '0 0 5px rgba(0, 207, 132, 0.4)' }} /> Done</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FACFE', boxShadow: '0 0 5px rgba(79, 172, 254, 0.4)' }} /> Doing</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', border: '1px solid var(--surface2)' }} /> Todo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5757', boxShadow: '0 0 5px rgba(255, 87, 87, 0.4)' }} /> Stuck</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B89AFF', boxShadow: '0 0 5px rgba(184, 154, 255, 0.4)' }} /> Check</div>
            </div>

            <style jsx global>{`
                .matrix-row:hover td {
                    background: rgba(255,255,255,0.02) !important;
                }
                .status-dot-link {
                    transition: transform 0.2s;
                }
                .status-dot-link:hover {
                    transform: scale(1.4) !important;
                }
                .glass-matrix {
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
                }
                .tbl-matrix th {
                    background: rgba(255,255,255,0.01);
                }
            `}</style>
        </div>
    );
}
