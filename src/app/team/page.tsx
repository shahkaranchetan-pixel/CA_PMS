import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function TeamPage() {
    const teamRaw = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        include: {
            taskAssignees: {
                include: {
                    task: {
                        select: { id: true, status: true, priority: true, dueDate: true, title: true }
                    }
                }
            }
        }
    });

    const team = teamRaw.map(u => ({
        ...u,
        tasks: u.taskAssignees.map(ta => ta.task)
    }));

    const now = new Date();

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">Team Workload</div>
                    <div className="psub">Capacity planning · Monitor team workload and redistribute tasks</div>
                </div>
                <div className="sep" />
                <Link href="/team/new" className="btn btn-p">+ Add Employee</Link>
            </div>

            {/* Summary Stats */}
            <div className="stats">
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#4FACFE' }} />
                    <div style={{ fontSize: '18px' }}>👥</div>
                    <div className="scard-val" style={{ color: '#4FACFE' }}>{team.length}</div>
                    <div className="scard-lbl">Team Members</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#FFB020' }} />
                    <div style={{ fontSize: '18px' }}>📋</div>
                    <div className="scard-val" style={{ color: '#FFB020' }}>
                        {team.reduce((acc, m) => acc + m.tasks.filter(t => t.status !== 'COMPLETED').length, 0)}
                    </div>
                    <div className="scard-lbl">Active Tasks</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#FF5757' }} />
                    <div style={{ fontSize: '18px' }}>⚠️</div>
                    <div className="scard-val" style={{ color: '#FF5757' }}>
                        {team.reduce((acc, m) => acc + m.tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED').length, 0)}
                    </div>
                    <div className="scard-lbl">Overdue Tasks</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#B89AFF' }} />
                    <div style={{ fontSize: '18px' }}>🚧</div>
                    <div className="scard-val" style={{ color: '#B89AFF' }}>
                        {team.reduce((acc, m) => acc + m.tasks.filter(t => t.status === 'BLOCKED').length, 0)}
                    </div>
                    <div className="scard-lbl">Blocked Tasks</div>
                </div>
            </div>

            {/* Workload Cards */}
            <div className="workload-grid">
                {team.map(member => {
                    const activeTasks = member.tasks.filter(t => t.status !== 'COMPLETED');
                    const completedTasks = member.tasks.filter(t => t.status === 'COMPLETED');
                    const overdueTasks = member.tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED');
                    const blockedTasks = member.tasks.filter(t => t.status === 'BLOCKED');
                    const highPriority = activeTasks.filter(t => t.priority === 'high');

                    const MAX_CAPACITY = 10;
                    const load = Math.min((activeTasks.length / MAX_CAPACITY) * 100, 100);
                    const loadColor = load > 80 ? '#FF5757' : load > 50 ? '#FFB020' : '#00CF84';
                    const loadLabel = load > 80 ? 'Overloaded' : load > 50 ? 'Moderate' : 'Available';

                    return (
                        <div key={member.id} className="wl-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: '12px',
                                    background: (member as any).color || 'var(--gold)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 15, fontWeight: 700, color: '#000'
                                }}>
                                    {member.name?.substring(0, 2).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{member.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span className={`badge ${member.role === 'ADMIN' ? 'b-high' : 'b-low'}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                                            {member.role}
                                        </span>
                                        <span>{(member as any).dept || 'General'}</span>
                                    </div>
                                </div>
                                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                    <div style={{ fontSize: '10px', color: loadColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                                        {loadLabel}
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Playfair Display,serif', color: loadColor }}>
                                        {Math.round(load)}%
                                    </div>
                                </div>
                            </div>

                            {/* Load bar */}
                            <div className="wl-bar-track">
                                <div className="wl-bar-fill" style={{ width: `${load}%`, background: loadColor }} />
                            </div>

                            {/* Metrics */}
                            <div className="wl-meta">
                                <div className="wl-meta-item">
                                    <span className="label">Active</span>
                                    <span className="val" style={{ color: '#4FACFE' }}>{activeTasks.length}</span>
                                </div>
                                <div className="wl-meta-item">
                                    <span className="label">Done</span>
                                    <span className="val" style={{ color: '#00CF84' }}>{completedTasks.length}</span>
                                </div>
                                <div className="wl-meta-item">
                                    <span className="label">Overdue</span>
                                    <span className="val" style={{ color: overdueTasks.length > 0 ? '#FF5757' : 'var(--muted)' }}>{overdueTasks.length}</span>
                                </div>
                                <div className="wl-meta-item">
                                    <span className="label">Blocked</span>
                                    <span className="val" style={{ color: blockedTasks.length > 0 ? '#FF5757' : 'var(--muted)' }}>{blockedTasks.length}</span>
                                </div>
                                <div className="wl-meta-item">
                                    <span className="label">🔥 High</span>
                                    <span className="val" style={{ color: highPriority.length > 0 ? '#FF5757' : 'var(--muted)' }}>{highPriority.length}</span>
                                </div>
                            </div>

                            {/* Overdue task list */}
                            {overdueTasks.length > 0 && (
                                <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(255,87,87,.05)', borderRadius: '8px', border: '1px solid rgba(255,87,87,.15)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#FF5757', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                                        ⚠️ Overdue Tasks
                                    </div>
                                    {overdueTasks.slice(0, 3).map(t => (
                                        <Link key={t.id} href={`/tasks/${t.id}`} style={{ display: 'block', fontSize: '11.5px', color: 'var(--text)', padding: '3px 0', fontWeight: 500 }}>
                                            • {t.title}
                                        </Link>
                                    ))}
                                    {overdueTasks.length > 3 && (
                                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>+{overdueTasks.length - 3} more</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
