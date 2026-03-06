import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function Home() {
    const totalClients = await prisma.client.count()

    // Pending tasks are anywhere not COMPLETED
    const pendingTasks = await prisma.task.count({
        where: {
            status: { not: "COMPLETED" }
        }
    })

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const completedThisMonth = await prisma.task.count({
        where: {
            status: "COMPLETED",
            updatedAt: { gte: startOfMonth }
        }
    })

    // Upcoming Deadlines (Pending tasks sorted by date)
    const upcomingTasks = await prisma.task.findMany({
        where: { status: { not: "COMPLETED" }, dueDate: { not: null } },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: { client: true }
    })

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 border-l-4 border-blue-500 hover:-translate-y-1 transition duration-200">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Clients</h3>
                    <p className="text-4xl font-bold text-blue-600">{totalClients}</p>
                </div>
                <div className="glass-panel p-6 border-l-4 border-red-400 hover:-translate-y-1 transition duration-200">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Pending/Overdue Tasks</h3>
                    <p className="text-4xl font-bold text-red-500">{pendingTasks}</p>
                </div>
                <div className="glass-panel p-6 border-l-4 border-emerald-400 hover:-translate-y-1 transition duration-200">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Completed (This Mth)</h3>
                    <p className="text-4xl font-bold text-emerald-500">{completedThisMonth}</p>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100/50 bg-gray-50/30 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Upcoming Deadlines</h2>
                    <Link href="/tasks" className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition">View All Tasks →</Link>
                </div>

                {upcomingTasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <span className="text-3xl block mb-2">🎉</span>
                        No immediate tasks due.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Details</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white/30">
                            {upcomingTasks.map((task: any) => (
                                <tr key={task.id} className="hover:bg-gray-50/50 transition duration-150">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            <Link href={`/tasks/${task.id}`} className="hover:text-indigo-600 transition">{task.title}</Link>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{task.client.name} • {task.taskType.replace(/_/g, ' ')}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {task.dueDate && (
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${new Date(task.dueDate) < new Date() ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                {new Date(task.dueDate) < new Date() && '⚠️'} {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <Link href={`/tasks/${task.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
