import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"

export const revalidate = 30

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import TaskFilters from "./TaskFilters";
import TaskStatusSelect from "./TaskStatusSelect";
import BoardView from "./BoardView";
import StatutoryTaskButton from "./StatutoryTaskButton";
import SearchInput from "@/components/SearchInput";
import TaskTableClient from "./TaskTableClient";

const TASK_MAP: Record<string, { label: string, color: string, icon: string }> = {
    TDS_PAYMENT: { label: 'TDS Payment', color: '#FF6B6B', icon: 'TDS' },
    TDS_RETURN: { label: 'TDS Return', color: '#FF6B6B', icon: 'TDS' },
    GSTR_1: { label: 'GSTR-1 Filing', color: '#FFB020', icon: 'G1' },
    GST_1: { label: 'GSTR-1 Filing', color: '#FFB020', icon: 'G1' },
    PF_ESI_PT: { label: 'PF / ESI / PT', color: '#4FACFE', icon: 'PF' },
    GSTR_3B: { label: 'GSTR-3B Filing', color: '#00D4AA', icon: '3B' },
    GSTR3B: { label: 'GSTR-3B Filing', color: '#00D4AA', icon: '3B' },
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
    const user = await prisma.user.findUnique({ where: { id: currentUserId } });
    const userDept = user?.dept || 'GST';

    // Build the query where clause
    const filterConditions: any = { 
        parentId: null,
        deletedAt: null // S4: exclude deleted tasks
    };

    if (userRole === 'ADMIN') {
        if (assigneeFilter) {
            if (assigneeFilter === 'unassigned') {
                filterConditions.taskAssignees = { none: {} };
            } else {
                filterConditions.taskAssignees = { some: { userId: assigneeFilter } };
            }
        }
    } else {
        filterConditions.taskAssignees = { some: { userId: currentUserId } };
    }
    if (typeFilter) {
        filterConditions.taskType = typeFilter;
    }

    const q = searchParams.q as string;
    if (q) {
        // Use AND to layer search on top of existing filters (including employee OR clause)
        if (!filterConditions.AND) filterConditions.AND = [];
        filterConditions.AND.push({
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { client: { name: { contains: q, mode: 'insensitive' } } }
            ]
        });
    }

    const tasks = await prisma.task.findMany({
        where: filterConditions,
        include: {
            client: { select: { id: true, name: true } },
            taskAssignees: { include: { user: { select: { id: true, name: true, color: true } } } },
            subtasks: {
                select: { id: true, status: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 100
    }) as any[]

    const users = await prisma.user.findMany({ select: { id: true, name: true } });

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">All Tasks</div>
                    <div className="psub">Manage monthly compliances, deadlines, and team workload</div>
                </div>
                <div className="sep" />
                <SearchInput />

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
                <TaskTableClient 
                    tasks={tasks} 
                    taskMap={TASK_MAP} 
                    users={users} 
                    currentUserRole={userRole} 
                />
            ) : (
                <BoardView tasks={tasks} taskMap={TASK_MAP} />
            )}
        </div>
    )
}
