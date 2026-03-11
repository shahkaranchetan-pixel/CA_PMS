import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import TaskFilters from "./TaskFilters";
import TaskStatusSelect from "./TaskStatusSelect";
import BoardView from "./BoardView";
import StatutoryTaskButton from "./StatutoryTaskButton";

const TASK_MAP: Record<string, { label: string, color: string, icon: string }> = {
    tds: { label: 'TDS Payment', color: '#FF6B6B', icon: '🏦' },
    gstr1: { label: 'GSTR-1 Filing', color: '#FFB020', icon: '📋' },
    pf_esi_pt: { label: 'PF / ESI / PT', color: '#4FACFE', icon: '👥' },
    gstr3b: { label: 'GSTR-3B Filing', color: '#00D4AA', icon: '📊' },
};

export default async function TasksPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }
    const currentUserId = (session?.user as any)?.id;

    const assigneeFilter = searchParams.assignee === 'all' ? undefined : (searchParams.assignee as string);
    const typeFilter = searchParams.type === 'all' ? undefined : (searchParams.type as string);
    const view = searchParams.view === 'kanban' ? 'kanban' : 'list';

    const userRole = (session?.user as any)?.role || 'EMPLOYEE';

    // Build the query where clause
    const filterConditions: any = { parentId: null };

    if (userRole === 'ADMIN') {
        if (assigneeFilter) filterConditions.taskAssignees = { some: { userId: assigneeFilter } };
    } else {
        filterConditions.taskAssignees = { some: { userId: currentUserId } };
    }
    if (typeFilter) {
        filterConditions.taskType = typeFilter;
    }

    const tasks = await prisma.task.findMany({
        where: filterConditions,
        include: {
            client: true,
            taskAssignees: { include: { user: true } },
            subtasks: {
                include: { taskAssignees: { include: { user: true } } }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    }) as any[]

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">All Tasks</div>
                    <div className="psub">Manage monthly compliances, deadlines, and team workload</div>
                </div>
                <div className="sep" />
                <div className="sbox">
                    <span style={{ color: 'var(--muted)' }}>🔍</span>
                    <input type="text" placeholder="Search tasks or clients..." />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '4px', display: 'flex', gap: '4px' }}>
                        <Link href={`/tasks?${new URLSearchParams({ ...searchParams, view: 'list' } as any).toString()}`} className="btn" style={{ padding: '4px 12px', background: view === 'list' ? 'var(--surface)' : 'transparent', color: view === 'list' ? 'var(--text)' : 'var(--muted)', fontSize: '13px', border: view === 'list' ? '1px solid var(--border)' : '1px solid transparent' }}>
                            List
                        </Link>
                        <Link href={`/tasks?${new URLSearchParams({ ...searchParams, view: 'kanban' } as any).toString()}`} className="btn" style={{ padding: '4px 12px', background: view === 'kanban' ? 'var(--surface)' : 'transparent', color: view === 'kanban' ? 'var(--text)' : 'var(--muted)', fontSize: '13px', border: view === 'kanban' ? '1px solid var(--border)' : '1px solid transparent' }}>
                            Kanban
                        </Link>
                    </div>
                    {userRole === 'ADMIN' && (
                        <>
                            <StatutoryTaskButton />
                            <Link href="/tasks/bulk" className="btn btn-g">⚡ Bulk Create</Link>
                        </>
                    )}
                    <a href="/api/export/tasks" className="btn btn-g">📥 Export CSV</a>
                    <Link href="/tasks/new" className="btn btn-p">+ New Task</Link>
                </div>
            </div>

            <TaskFilters currentUserId={currentUserId} />

            {view === 'list' ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '16px' }}>
                    <table className="tbl">
                        <thead style={{ background: 'rgba(255,255,255,.01)' }}>
                            <tr>
                                <th style={{ width: 40 }}></th>
                                <th>Task Overview</th>
                                <th>Entity</th>
                                <th>Priority</th>
                                <th>Due Date</th>
                                <th>Assignee</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty">
                                            <div className="empty-i">📋</div>
                                            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>No tasks found</div>
                                            <div style={{ fontSize: '12.5px' }}>Adjust filters or create a new task.</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tasks.map(task => {
                                    const tm = TASK_MAP[task.taskType] || { label: task.taskType.replace(/_/g, ' '), color: 'var(--muted)', icon: '📝' };
                                    const s = task.status.toLowerCase();
                                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && s !== 'completed';

                                    return (
                                        <tr key={task.id}>
                                            <td style={{ textAlign: 'center' }}>
                                                <input type="checkbox" style={{ accentColor: 'var(--gold)', cursor: 'pointer' }} />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: tm.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                                        {tm.icon}
                                                    </div>
                                                    <div>
                                                        <Link href={`/tasks/${task.id}`} style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)' }}>
                                                            {task.title}
                                                        </Link>
                                                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                            <span>{tm.label}</span>
                                                            {task.subtasks.length > 0 && <span style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, color: 'var(--text)' }}>{task.subtasks.filter((t: any) => t.status === 'COMPLETED').length}/{task.subtasks.length} Subtasks</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{task.client.name}</td>
                                            <td>
                                                <span className={`badge b-${task.priority.toLowerCase()}`}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 500, color: isOverdue ? 'var(--danger)' : 'var(--text)' }}>
                                                {isOverdue && '⚠️ '}
                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
                                            </td>
                                            <td>
                                                {task.taskAssignees && task.taskAssignees.length > 0 ? (
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        {task.taskAssignees.slice(0, 3).map((ta: any, i: number) => (
                                                            <div key={ta.id} style={{ width: 24, height: 24, borderRadius: 6, background: ta.user?.color || 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#000', marginLeft: i > 0 ? '-6px' : 0, border: '2px solid var(--surface)', zIndex: 3 - i }} title={ta.user?.name}>
                                                                {ta.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                                                            </div>
                                                        ))}
                                                        {task.taskAssignees.length > 3 && (
                                                            <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--muted)' }}>+{task.taskAssignees.length - 3}</span>
                                                        )}
                                                        {task.taskAssignees.length === 1 && (
                                                            <span style={{ fontSize: '12px', marginLeft: '6px' }}>{task.taskAssignees[0].user?.name?.split(' ')[0]}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--muted)', fontSize: '12px', fontStyle: 'italic' }}>Unassigned</span>
                                                )}
                                            </td>
                                            <td>
                                                <TaskStatusSelect taskId={task.id} initialStatus={s} />
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <BoardView tasks={tasks} taskMap={TASK_MAP} />
            )}
        </div>
    )
}
