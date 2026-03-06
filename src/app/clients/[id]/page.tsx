import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
    const client = await prisma.client.findUnique({
        where: { id: params.id },
        include: {
            tasks: {
                orderBy: { dueDate: 'asc' },
                take: 5
            }
        }
    })

    if (!client) {
        notFound()
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link href="/clients" className="text-sm text-blue-600 hover:underline mb-2 inline-block">&larr; Back to Clients</Link>
                    <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                    <p className="text-gray-500 mt-1">{client.entityType}</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={`/tasks/new?clientId=${client.id}`}
                        className="premium-btn text-sm py-2 px-4 whitespace-nowrap"
                    >
                        + Add Task
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Basic Details */}
                <div className="glass-panel p-6 col-span-1">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Business Details</h2>
                    <dl className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">GSTIN</dt>
                            <dd className="mt-1 text-sm text-gray-900">{client.gstin || "Not provided"}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">PAN</dt>
                            <dd className="mt-1 text-sm text-gray-900">{client.pan || "Not provided"}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Client Since</dt>
                            <dd className="mt-1 text-sm text-gray-900">{new Date(client.createdAt).toLocaleDateString()}</dd>
                        </div>
                    </dl>
                </div>

                {/* Portal Credentials */}
                <div className="glass-panel p-6 col-span-1 md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Portal Credentials</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Income Tax */}
                        <div className="bg-white/50 border border-gray-100 p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Income Tax
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Login ID:</span>
                                    <span className="font-medium">{client.itxLogin || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Password:</span>
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{client.itxPassword || "-"}</span>
                                </div>
                            </div>
                        </div>

                        {/* GST */}
                        <div className="bg-white/50 border border-gray-100 p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                GST Portal
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Login ID:</span>
                                    <span className="font-medium">{client.gstLogin || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Password:</span>
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{client.gstPassword || "-"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Traces */}
                        <div className="bg-white/50 border border-gray-100 p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Traces Portal
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Login ID:</span>
                                    <span className="font-medium">{client.tracesLogin || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Password:</span>
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{client.tracesPassword || "-"}</span>
                                </div>
                            </div>
                        </div>

                        {/* PT / PF / ESI */}
                        <div className="bg-white/50 border border-gray-100 p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                PT / PF / ESI
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Login ID:</span>
                                    <span className="font-medium">{client.ptLogin || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Password:</span>
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{client.ptPassword || "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Tasks Overview */}
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-semibold text-gray-800">Upcoming Tasks</h2>
                    <Link href={`/tasks?client=${client.id}`} className="text-sm text-blue-600 hover:underline">View All</Link>
                </div>
                {client.tasks.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {client.tasks.map(task => (
                            <div key={task.id} className="py-3 flex justify-between items-center group">
                                <div>
                                    <div className="font-medium text-gray-900 group-hover:text-blue-600 transition">
                                        <Link href={`/tasks/${task.id}`}>{task.title}</Link>
                                    </div>
                                    <div className="text-sm text-gray-500">{task.taskType} &bull; {task.status}</div>
                                </div>
                                <div className="text-sm font-medium text-gray-700">
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm py-4">No tasks found for this client.</p>
                )}
            </div>

        </div>
    )
}
