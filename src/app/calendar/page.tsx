import { prisma } from "@/lib/prisma"
import Link from "next/link"

import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/route"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role || 'EMPLOYEE'
    const userId = (session?.user as any)?.id

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Grid logic
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const baseTaskWhere = userRole === 'ADMIN' ? {} : { assigneeId: userId };

    const tasks = await prisma.task.findMany({
        where: {
            ...baseTaskWhere,
            dueDate: {
                gte: new Date(currentYear, currentMonth, 1),
                lte: new Date(currentYear, currentMonth, daysInMonth, 23, 59, 59)
            }
        },
        include: { client: true, assignee: true },
        orderBy: { dueDate: 'asc' }
    });

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    // Group tasks by day
    const tasksByDay: Record<number, any[]> = {};
    tasks.forEach(task => {
        if (task.dueDate) {
            const d = task.dueDate.getDate();
            if (!tasksByDay[d]) tasksByDay[d] = [];
            tasksByDay[d].push(task);
        }
    });

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">Schedule Calendar</div>
                    <div className="psub">{monthNames[currentMonth]} {currentYear} Overview</div>
                </div>
                <div className="sep" />
                <Link href="/tasks/new" className="btn btn-p">+ New Task</Link>
            </div>

            <div className="card" style={{ padding: '24px', background: 'var(--surface)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Header */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} style={{ background: 'rgba(255,255,255,.02)', padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: 'var(--muted)' }}>
                            {day}
                        </div>
                    ))}

                    {/* Days */}
                    {days.map((dayNum, i) => {
                        const isToday = dayNum === today.getDate();
                        const dayTasks = dayNum ? (tasksByDay[dayNum] || []) : [];

                        return (
                            <div key={i} style={{
                                background: isToday ? 'rgba(232, 160, 32, 0.05)' : 'var(--surface)',
                                minHeight: '120px',
                                padding: '8px',
                                borderTop: '1px solid var(--border)'
                            }}>
                                {dayNum && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{
                                                width: '24px', height: '24px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: '50%',
                                                background: isToday ? 'var(--gold)' : 'transparent',
                                                color: isToday ? '#000' : 'var(--text)',
                                                fontWeight: isToday ? 700 : 500,
                                                fontSize: '13px'
                                            }}>
                                                {dayNum}
                                            </span>
                                            {dayTasks.length > 0 && (
                                                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{dayTasks.length} due</span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {dayTasks.map(task => (
                                                <Link href="/tasks" key={task.id} style={{
                                                    textDecoration: 'none',
                                                    padding: '4px 6px',
                                                    background: task.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.1)' : 'var(--surface2)',
                                                    borderLeft: `2px solid ${task.status === 'COMPLETED' ? 'var(--success)' : (task.priority === 'high' ? 'var(--danger)' : 'var(--gold)')}`,
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    display: 'block',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }} title={`${task.client?.name} - ${task.title}`}>
                                                    <span style={{ fontWeight: 600, color: task.status === 'COMPLETED' ? 'var(--success)' : 'var(--text)' }}>
                                                        {task.client?.name?.substring(0, 10)}
                                                    </span>
                                                    <span style={{ color: 'var(--muted)' }}> - {task.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
