"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewTaskPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [clients, setClients] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])

    useEffect(() => {
        // Fetch clients
        fetch("/api/clients")
            .then(res => res.json())
            .then(data => setClients(data))
            .catch(err => console.error("Failed to load clients", err))

        // Fetch employees for assignment
        fetch("/api/employees")
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error("Failed to load employees", err))
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            title: formData.get("title"),
            taskType: formData.get("taskType"),
            description: formData.get("description"),
            dueDate: formData.get("dueDate"),
            period: formData.get("period"),
            clientId: formData.get("clientId"),
            frequency: formData.get("frequency"),
            assigneeId: formData.get("assigneeId") || null,
        }

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to create task")
            }

            router.push("/tasks")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Create New Task</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-panel p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="clientId" className="block text-sm font-semibold text-gray-700 mb-2">Client</label>
                        <select
                            id="clientId"
                            name="clientId"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border bg-white"
                        >
                            <option value="">Select a client...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="assigneeId" className="block text-sm font-semibold text-gray-700 mb-2">Assign To (Employee)</label>
                        <select
                            id="assigneeId"
                            name="assigneeId"
                            className="input-modern bg-white appearance-none"
                        >
                            <option value="">Unassigned</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name || emp.email}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                    <div>
                        <label htmlFor="taskType" className="block text-sm font-semibold text-gray-700 mb-2">Statutory Type</label>
                        <select
                            id="taskType"
                            name="taskType"
                            required
                            className="input-modern bg-white appearance-none"
                        >
                            <option value="">Select Type...</option>
                            <option value="TDS_PAYMENT">TDS Payment (7th)</option>
                            <option value="GST_1">GSTR-1 (10th)</option>
                            <option value="PF_ESI_PT">PF / ESI / PT (15th)</option>
                            <option value="GSTR_3B">GSTR-3B (20th)</option>
                            <option value="ACCOUNTING">Accounting / Bookkeeping</option>
                            <option value="OTHER">Other Task</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="frequency" className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                        <select
                            id="frequency"
                            name="frequency"
                            required
                            defaultValue="ONCE"
                            className="input-modern bg-white appearance-none"
                        >
                            <option value="ONCE">One-time</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="QUARTERLY">Quarterly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        className="input-modern"
                        placeholder="e.g. June 2026 GST Returns"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Description / Notes</label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="input-modern"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                        <input
                            type="date"
                            id="dueDate"
                            name="dueDate"
                            className="input-modern"
                        />
                    </div>

                    <div>
                        <label htmlFor="period" className="block text-sm font-semibold text-gray-700 mb-2">Period / Month</label>
                        <input
                            type="text"
                            id="period"
                            name="period"
                            className="input-modern"
                            placeholder="e.g. Oct-2023"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-8 border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm bg-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="premium-btn px-6 py-2.5"
                    >
                        {loading ? "Creating..." : "Create Task"}
                    </button>
                </div>
            </form>
        </div>
    )
}
