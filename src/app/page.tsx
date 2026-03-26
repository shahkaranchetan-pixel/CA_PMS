import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation"
import ComplianceMatrix from "@/components/ComplianceMatrix"
import MyTasksDashboard from "@/components/MyTasksDashboard"

export const dynamic = "force-dynamic"

export default async function Home({ searchParams }: { searchParams: Promise<{ month?: string, year?: string }> }) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    const params = await searchParams;
    const now = new Date();
    const displayMonth = params.month ? parseInt(params.month) : now.getMonth();
    const displayYear = params.year ? parseInt(params.year) : now.getFullYear();

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const userId = (session?.user as any)?.id;

    const baseTaskWhere: any = userRole === 'ADMIN' ? {} : { taskAssignees: { some: { userId } } };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentPeriod = `${monthNames[displayMonth].substring(0, 3)}-${displayYear}`;

    const [totalClients, activeClients, dashboardTasks, recentLogs, team, statutoryTasksCount] = await Promise.all([
        prisma.client.count({ where: { deletedAt: null } }),
        prisma.client.findMany({ 
            where: { active: true, deletedAt: null }, 
            select: { name: true, id: true } 
        }),
        prisma.task.findMany({
            where: { 
                ...baseTaskWhere, 
                deletedAt: null 
            },
            include: { client: true, taskAssignees: { include: { user: true } } },
            orderBy: { dueDate: 'asc' }
        }),
        prisma.taskLog.findMany({
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, color: true } },
                task: { select: { title: true, id: true } }
            }
        }),
        prisma.user.findMany({
            include: { taskAssignees: { where: { task: { status: { not: 'COMPLETED' } } }, include: { task: { select: { id: true, priority: true } } } } }
        }),
        prisma.task.count({
            where: { 
                ...baseTaskWhere, 
                period: currentPeriod, 
                frequency: 'MONTHLY',
                deletedAt: null
            }
        })
    ]);

    // Optimized: use Prisma count instead of filtering full arrays in memory
    const [overdueTasksCount, completedThisMonth, blockedTasksCount, underReviewTasksCount] = await Promise.all([
        prisma.task.count({ where: { ...baseTaskWhere, deletedAt: null, status: { not: 'COMPLETED' }, dueDate: { lt: now } } }),
        prisma.task.count({ where: { ...baseTaskWhere, deletedAt: null, status: 'COMPLETED', updatedAt: { gte: new Date(displayYear, displayMonth, 1) } } }),
        prisma.task.count({ where: { ...baseTaskWhere, deletedAt: null, status: 'BLOCKED' } }),
        prisma.task.count({ where: { ...baseTaskWhere, deletedAt: null, status: 'UNDER_REVIEW' } }),
    ]);

    // Upcoming deadlines (next 7 tasks due)
    const upcomingDeadlines = dashboardTasks
        .filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) >= now)
        .slice(0, 7);

    // Calendar logic
    const firstDay = new Date(displayYear, displayMonth, 1).getDay();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

    const calDays: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) calDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calDays.push(i);

    const tasksByDay: Record<number, any[]> = {};
    dashboardTasks.forEach(task => {
        if (task.dueDate && task.dueDate.getMonth() === displayMonth && task.dueDate.getFullYear() === displayYear) {
            const d = task.dueDate.getDate();
            if (!tasksByDay[d]) tasksByDay[d] = [];
            tasksByDay[d].push(task);
        }
    });

    const STATUS_COLORS: Record<string, string> = {
        PENDING: '#FFB020',
        IN_PROGRESS: '#4FACFE',
        UNDER_REVIEW: '#B89AFF',
        BLOCKED: '#FF5757',
        COMPLETED: '#00CF84',
    };

    // Navigation URLs
    const prevMonth = displayMonth === 0 ? 11 : displayMonth - 1;
    const prevYear = displayMonth === 0 ? displayYear - 1 : displayYear;
    const nextMonth = displayMonth === 11 ? 0 : displayMonth + 1;
    const nextYear = displayMonth === 11 ? displayYear + 1 : displayYear;

    return (
        <div>
            {userRole === 'ADMIN' && statutoryTasksCount === 0 && (
                <div className="card" style={{ background: 'rgba(79, 172, 254, 0.05)', border: '1px solid rgba(79, 172, 254, 0.2)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>✨</div>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Monthly Statutory Tasks</div>
                            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>It looks like you haven't populated statutory tasks for {currentPeriod} yet.</div>
                        </div>
                    </div>
                    <Link href="/tasks" className="btn btn-p" style={{ background: '#4FACFE', color: 'var(--text)' }}>Populate Now</Link>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                    <div className="ptitle">Dashboard</div>
                    <div className="psub" style={{ marginBottom: 0 }}>{monthNames[displayMonth]} {displayYear} · KCS TaskPro</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href="/tasks/new" className="btn btn-p">+ New Task</Link>
                    <Link href="/tasks?view=kanban" className="btn btn-g">📋 Kanban</Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-dashboard">
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#4FACFE' }} />
                    <div style={{ fontSize: '18px' }}>👥</div>
                    <div className="scard-val" style={{ color: '#4FACFE' }}>{totalClients}</div>
                    <div className="scard-lbl">Active Clients</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#00CF84' }} />
                    <div style={{ fontSize: '18px' }}>✅</div>
                    <div className="scard-val" style={{ color: '#00CF84' }}>{completedThisMonth}</div>
                    <div className="scard-lbl">Completed This Month</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#FF5757' }} />
                    <div style={{ fontSize: '18px' }}>⚠️</div>
                    <div className="scard-val" style={{ color: '#FF5757' }}>{overdueTasksCount}</div>
                    <div className="scard-lbl">Overdue Tasks</div>
                    <div className="scard-trend">need attention</div>
                </div>
                <div className="scard">
                    <div className="scard-accent" style={{ background: '#B89AFF' }} />
                    <div style={{ fontSize: '18px' }}>🚧</div>
                    <div className="scard-val" style={{ color: '#B89AFF' }}>{blockedTasksCount}</div>
                    <div className="scard-lbl">Blocked Tasks</div>
                    <div className="scard-trend">{underReviewTasksCount} under review</div>
                </div>
            </div>

            {/* My Tasks Section */}
            <div style={{ marginBottom: '24px' }}>
                <MyTasksDashboard tasks={dashboardTasks} />
            </div>

            {/* Main Grid: Calendar Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px' }}>

                {/* Mini Calendar */}
                <div className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="ctitle" style={{ margin: 0 }}>📅 {monthNames[displayMonth]} {displayYear}</div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <Link href={`/?month=${prevMonth}&year=${prevYear}`} scroll={false} className="btn-ic" style={{ padding: '2px 8px', fontSize: '14px' }}>‹</Link>
                                <Link href={`/?month=${nextMonth}&year=${nextYear}`} scroll={false} className="btn-ic" style={{ padding: '2px 8px', fontSize: '14px' }}>›</Link>
                            </div>
                        </div>
                        <Link href="/calendar" style={{ fontSize: '11px', color: 'var(--gold)' }}>Full View →</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                        {/* Weekday Headers */}
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,.02)', padding: '6px', textAlign: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px' }}>
                                {d}
                            </div>
                        ))}
                        {/* Days */}
                        {calDays.map((dayNum, i) => {
                            const isToday = dayNum === now.getDate();
                            const dayTasks = dayNum ? (tasksByDay[dayNum] || []) : [];
                            const hasOverdue = dayTasks.some(t => t.status !== 'COMPLETED' && dayNum! < now.getDate());
                            const hasTasks = dayTasks.length > 0;

                            return (
                                <div key={i} style={{
                                    background: isToday ? 'rgba(232,160,32,.08)' : 'var(--surface)',
                                    minHeight: '52px',
                                    padding: '4px',
                                    position: 'relative'
                                }}>
                                    {dayNum && (
                                        <>
                                            <div style={{
                                                width: '22px', height: '22px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: '50%',
                                                background: isToday ? 'var(--gold)' : 'transparent',
                                                color: isToday ? '#000' : hasOverdue ? 'var(--danger)' : 'var(--text)',
                                                fontWeight: isToday ? 700 : 400,
                                                fontSize: '11px',
                                                margin: '0 auto 2px'
                                            }}>
                                                {dayNum}
                                            </div>
                                            {hasTasks && (
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', flexWrap: 'wrap' }}>
                                                    {dayTasks.slice(0, 3).map(t => (
                                                        <div key={t.id} style={{
                                                            width: '5px', height: '5px', borderRadius: '50%',
                                                            background: STATUS_COLORS[t.status] || 'var(--muted)'
                                                        }} title={t.title} />
                                                    ))}
                                                    {dayTasks.length > 3 && (
                                                        <span style={{ fontSize: '7px', color: 'var(--muted)' }}>+{dayTasks.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Today's Tasks */}
                    {tasksByDay[now.getDate()] && tasksByDay[now.getDate()].length > 0 && (
                        <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(232,160,32,.05)', borderRadius: '8px', border: '1px solid rgba(232,160,32,.15)' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                                📌 Due Today
                            </div>
                            {tasksByDay[now.getDate()].map((t: any) => (
                                <Link key={t.id} href={`/tasks/${t.id}`} style={{ display: 'block', fontSize: '11px', color: 'var(--text)', padding: '2px 0', fontWeight: 500 }}>
                                    • {t.client?.name} — {t.title}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Upcoming Deadlines + Activity Feed + Team Load */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>

                {/* Upcoming Deadlines */}
                <div className="card">
                    <div className="ctitle">
                        <span>🔔 Upcoming Deadlines</span>
                    </div>
                    {upcomingDeadlines.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>No upcoming deadlines</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {upcomingDeadlines.map(task => {
                                const daysLeft = task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
                                const urgencyColor = daysLeft <= 1 ? '#FF5757' : daysLeft <= 3 ? '#FFB020' : 'var(--muted)';
                                return (
                                    <Link key={task.id} href={`/tasks/${task.id}`} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 10px', background: 'var(--surface2)', borderRadius: '8px',
                                        border: '1px solid var(--border)', textDecoration: 'none',
                                        borderLeft: `3px solid ${urgencyColor}`
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {task.title}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '1px' }}>
                                                {task.client?.name}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'Playfair Display,serif', color: urgencyColor }}>
                                                {daysLeft}
                                            </div>
                                            <div style={{ fontSize: '8px', color: urgencyColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                {daysLeft === 1 ? 'day' : 'days'}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <div className="ctitle">
                        <span>📝 Recent Activity</span>
                    </div>
                    {recentLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>No recent activity</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                            {recentLogs.map(log => (
                                <div key={log.id} style={{ display: 'flex', gap: '8px', fontSize: '11.5px' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: (log.user as any)?.color || 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#000', marginTop: '2px' }}>
                                        {log.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 600 }}>{log.user?.name?.split(' ')[0] || 'User'}</span>
                                            {log.type === 'STATUS_CHANGE' ? (
                                                <span style={{ color: 'var(--muted)' }}>
                                                    changed status to <span className={`badge b-${log.newStatus?.toLowerCase()}`} style={{ fontSize: '8px', padding: '1px 4px' }}>{log.newStatus?.replace('_', ' ')}</span>
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--muted)' }}>commented</span>
                                            )}
                                        </div>
                                        <Link href={`/tasks/${log.taskId}`} style={{ fontSize: '10px', color: 'var(--gold)', display: 'block', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {log.task?.title}
                                        </Link>
                                        <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>
                                            {timeAgo(log.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Team Load */}
                <div className="card">
                    <div className="ctitle">
                        <span>📊 Team Load</span>
                        <Link href="/team" style={{ fontSize: '11px', color: 'var(--gold)' }}>View All →</Link>
                    </div>
                    {team.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>No team members</div>
                    ) : (
                        team.slice(0, 6).map(m => {
                            const taskCount = m.taskAssignees.length;
                            const load = Math.min((taskCount / 10) * 100, 100);
                            const color = load > 80 ? '#FF5757' : load > 50 ? '#FFB020' : '#00CF84';
                            return (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: 6, background: (m as any).color || 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#000' }}>
                                        {m.name?.substring(0, 2).toUpperCase() || 'U'}
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 500, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                                    <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${load}%`, height: '100%', background: color, borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color, minWidth: '16px', textAlign: 'right' }}>{taskCount}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

function timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
