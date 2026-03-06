"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TaskDetailClient({ task }: { task: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(task.status)

    const handleStatusChange = async (newStatus: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })

            if (!res.ok) throw new Error("Failed to update status")

            setStatus(newStatus)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to update task status")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <Link href="/tasks" className="text-sm border flex items-center gap-2 px-3 py-1 rounded-full w-fit hover:bg-gray-50 mb-4 transition text-gray-500 border-gray-200 bg-white shadow-sm">
                        ← Back to Tasks
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
                    <div className="flex flex-wrap gap-3 items-center mt-2">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${status === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-200' :
                                status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    'bg-gray-100 text-gray-800 border-gray-200'
                            } border`}>
                            {status.replace('_', ' ')}
                        </span>
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                            {task.taskType.replace(/_/g, ' ')}
                        </span>
                        {task.frequency !== 'ONCE' && (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1">
                                ↻ {task.frequency}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {status !== 'COMPLETED' && (
                        <button
                            onClick={() => handleStatusChange('COMPLETED')}
                            disabled={loading}
                            className="premium-btn text-sm px-4 py-2"
                        >
                            {loading ? "Completing..." : "Mark Completed"}
                        </button>
                    )}
                    {status === 'PENDING' && (
                        <button
                            onClick={() => handleStatusChange('IN_PROGRESS')}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm bg-white"
                        >
                            {loading ? "Starting..." : "Start Working"}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="glass-panel p-6">
                        <h2 className="text-lg font-semibold border-b border-gray-100 pb-3 mb-4 text-gray-800">Task Details</h2>
                        <div className="space-y-4 text-sm text-gray-600">
                            <div>
                                <span className="font-semibold block text-gray-900">Description:</span>
                                <p className="mt-1 bg-gray-50 p-3 rounded-md border border-gray-100 min-h-[4rem]">{task.description || "No description provided."}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="font-semibold text-gray-900">Period/Month:</span>
                                    <p>{task.period || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-900">Due Date:</span>
                                    <p className={`${task.dueDate && new Date(task.dueDate) < new Date() && status !== 'COMPLETED' ? 'text-red-500 font-bold' : ''}`}>
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-6">
                        <h2 className="text-lg font-semibold border-b border-gray-100 pb-3 mb-4 text-gray-800">Assignment</h2>

                        <div className="mb-4">
                            <span className="text-xs text-gray-500 block mb-1 uppercase tracking-wider font-semibold">Assigned To</span>
                            {task.assignee ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                                        {task.assignee.name ? task.assignee.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{task.assignee.name || 'Unnamed User'}</p>
                                        <p className="text-xs text-gray-500">{task.assignee.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-400 italic bg-gray-50 border border-gray-100 rounded-md p-3 text-sm">
                                    Unassigned
                                </div>
                            )}
                        </div>

                        <div>
                            <span className="text-xs text-gray-500 block mb-1 uppercase tracking-wider font-semibold">Client</span>
                            <Link href={`/clients/${task.clientId}`} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition border border-transparent hover:border-gray-200">
                                <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 shadow-sm">
                                    🏢
                                </div>
                                <span className="font-medium text-blue-600 truncate">{task.client.name}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
