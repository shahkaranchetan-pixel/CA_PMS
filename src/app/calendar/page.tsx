import { prisma } from "@/lib/prisma"
import Link from "next/link"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation"

import ComplianceMatrix from "@/components/ComplianceMatrix"
import CalendarHeader from "@/components/CalendarHeader"

export const dynamic = "force-dynamic"

export default async function CalendarPage({ searchParams }: { searchParams: Promise<any> }) {
    const sParams = await searchParams;
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/login")
    }
    const userRole = (session?.user as any)?.role || 'EMPLOYEE'
    const userId = (session?.user as any)?.id

    const today = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Period handling
    let currentPeriod = sParams.period;
    if (!currentPeriod) {
        currentPeriod = `${months[today.getMonth()]}-${today.getFullYear()}`;
    }

    const [monthAbbr, yearStr] = currentPeriod.split('-');
    const currentMonth = months.indexOf(monthAbbr) !== -1 ? months.indexOf(monthAbbr) : today.getMonth();
    const currentYear = parseInt(yearStr) || today.getFullYear();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Compliance Matrix Data
    const clientsForMatrix = await prisma.client.findMany({ 
        where: { deletedAt: null },
        select: { id: true, name: true } 
    });
    const tasksForMatrix = await prisma.task.findMany({
        where: { period: currentPeriod, deletedAt: null },
        select: { id: true, clientId: true, taskType: true, status: true }
    });

    const statutoryTypeKeys = ['GST_1', 'GSTR_3B', 'TDS_PAYMENT', 'PF_ESI_PT', 'ACCOUNTING'];
    const applicableClients = clientsForMatrix.filter(c => 
        tasksForMatrix.some(t => t.clientId === c.id && statutoryTypeKeys.includes(t.taskType))
    );

    // Grid logic (Calendar)
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const baseTaskWhere: any = userRole === 'ADMIN'
        ? {}
        : { taskAssignees: { some: { userId } } };

    const tasks = await prisma.task.findMany({
        where: {
            ...baseTaskWhere,
            deletedAt: null,
            dueDate: {
                gte: new Date(currentYear, currentMonth, 1),
                lte: new Date(currentYear, currentMonth, daysInMonth, 23, 59, 59)
            }
        },
        include: {
            client: true,
            taskAssignees: { include: { user: true } }
        },
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
        <div style={{ padding: '0 24px 24px' }}>
            <CalendarHeader 
                currentPeriod={currentPeriod} 
                monthName={monthNames[currentMonth]} 
                year={currentYear} 
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                <div style={{ position: 'sticky', top: '20px' }}>
                    <ComplianceMatrix 
                        clients={applicableClients} 
                        tasks={tasksForMatrix} 
                        currentPeriod={currentPeriod}
                    />
                </div>

                <div className="card" style={{ padding: '16px', background: 'var(--surface)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Header */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} style={{ background: 'rgba(255,255,255,.02)', padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: 'var(--muted)' }}>
                            {day}
                        </div>
                    ))}

                    {/* Days */}
                    {days.map((dayNum, i) => {
                        const isToday = dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                        const dayTasks = dayNum ? (tasksByDay[dayNum] || []) : [];

                        return (
                            <div key={i} style={{
                                background: isToday ? 'rgba(232, 160, 32, 0.05)' : 'var(--surface)',
                                minHeight: '100px',
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
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {dayTasks.map(task => (
                                                <Link href={`/tasks/${task.id}`} key={task.id} style={{
                                                    textDecoration: 'none',
                                                    padding: '4px 6px',
                                                    background: task.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.1)' : 'var(--surface2)',
                                                    borderLeft: `2px solid ${task.status === 'COMPLETED' ? 'var(--success)' : (task.priority === 'high' ? 'var(--danger)' : 'var(--gold)')}`,
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }} title={`${task.client?.name} - ${task.title}`}>
                                                    <span style={{ fontWeight: 600, color: task.status === 'COMPLETED' ? 'var(--success)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {task.client?.name?.substring(0, 8)}
                                                    </span>
                                                    <span style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}> - {task.title}</span>
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
    </div>
    )
}
