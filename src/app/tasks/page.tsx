import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import TaskFilters from "./TaskFilters";

export default async function TasksPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    const assigneeFilter = searchParams.assignee === 'all' ? undefined : (searchParams.assignee as string);
    const typeFilter = searchParams.type === 'all' ? undefined : (searchParams.type as string);

    // Build the query where clause
    const filterConditions: any = {};
    if (assigneeFilter && session) {
        filterConditions.assigneeId = assigneeFilter;
    }
    if (typeFilter) {
        filterConditions.taskType = typeFilter;
    }

    const tasks = await prisma.task.findMany({
        where: filterConditions,
        include: {
            client: true,
            assignee: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Tasks & Deadlines</h1>
                <Link
                    href="/tasks/new"
                    className="premium-btn text-sm"
                >
                    + New Task
                </Link>
            </div>

            <TaskFilters currentUserId={currentUserId} />

            <div className="glass-panel overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task & Type</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white/50">
                        {tasks.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl mb-3">📋</span>
                                        <p>No tasks found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            tasks.map((task: any) => (
                                <tr key={task.id} className="hover:bg-gray-50/50 transition duration-150">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        <div>{task.title}</div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{task.taskType.replace(/_/g, ' ')}</span>
                                            {task.frequency !== 'ONCE' && <span className="text-indigo-500">↻ {task.frequency}</span>}
                                            {task.period && <span>({task.period})</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                        {task.client.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                                        {task.assignee ? (
                                            <>
                                                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                                                    {task.assignee.name?.charAt(0) || 'U'}
                                                </div>
                                                {task.assignee.name || 'User'}
                                            </>
                                        ) : (
                                            <span className="text-gray-400 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-200' :
                                            task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                'bg-gray-100 text-gray-800 border-gray-200'
                                            } border`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {task.dueDate ? (
                                            <span className={`${new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'text-red-500 font-bold flex items-center gap-1' : 'text-gray-500'}`}>
                                                {new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' && '⚠️ '}
                                                {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/tasks/${task.id}`} className="text-indigo-600 hover:text-indigo-900 transition">View Details</Link>
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
