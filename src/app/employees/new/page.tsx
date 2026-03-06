"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewEmployeePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            role: formData.get("role"),
        }

        try {
            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to add employee")
            }

            router.push("/employees")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">Invite New Employee</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-100 shadow-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-panel p-8 space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="input-modern"
                        placeholder="e.g. Rahul Sharma"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="input-modern"
                        placeholder="rahul@firm.com"
                    />
                </div>

                <div>
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                    <select
                        id="role"
                        name="role"
                        required
                        className="input-modern bg-white appearance-none"
                    >
                        <option value="EMPLOYEE">Employee (Standard Access)</option>
                        <option value="ADMIN">Admin (Full Access & Management)</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">Admins can manage other employees and access all settings.</p>
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
                        {loading ? "Sending Invite..." : "Add Employee directly"}
                    </button>
                </div>
            </form>
        </div>
    )
}
