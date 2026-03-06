"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewClientPage() {
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
            entityType: formData.get("entityType"),
            gstin: formData.get("gstin"),
            pan: formData.get("pan"),
            itxLogin: formData.get("itxLogin"),
            itxPassword: formData.get("itxPassword"),
            gstLogin: formData.get("gstLogin"),
            gstPassword: formData.get("gstPassword"),
            tracesLogin: formData.get("tracesLogin"),
            tracesPassword: formData.get("tracesPassword"),
            ptLogin: formData.get("ptLogin"),
            ptPassword: formData.get("ptPassword"),
        }

        try {
            const res = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                throw new Error("Failed to create client")
            }

            router.push("/clients")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Add New Client</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-8">
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Basic Details</h2>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Client/Business Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            className="input-modern mt-1"
                        />
                    </div>

                    <div>
                        <label htmlFor="entityType" className="block text-sm font-medium text-gray-700">Entity Type</label>
                        <select
                            id="entityType"
                            name="entityType"
                            required
                            className="input-modern mt-1 bg-white"
                        >
                            <option value="">Select an entity type...</option>
                            <option value="Proprietorship">Proprietorship</option>
                            <option value="Partnership">Partnership</option>
                            <option value="LLP">LLP</option>
                            <option value="Private Limited">Private Limited</option>
                            <option value="Public Limited">Public Limited</option>
                            <option value="HUF">HUF</option>
                            <option value="Trust/Society">Trust/Society</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label htmlFor="gstin" className="block text-sm font-medium text-gray-700">GSTIN (Optional)</label>
                            <input
                                type="text"
                                id="gstin"
                                name="gstin"
                                className="input-modern mt-1"
                                placeholder="e.g. 22AAAAA0000A1Z5"
                            />
                        </div>

                        <div>
                            <label htmlFor="pan" className="block text-sm font-medium text-gray-700">PAN (Optional)</label>
                            <input
                                type="text"
                                id="pan"
                                name="pan"
                                className="input-modern mt-1"
                                placeholder="e.g. ABCDE1234F"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Portal Credentials</h2>

                    {/* IT/GST */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Income Tax Login</label>
                            <input type="text" name="itxLogin" className="input-modern mb-2" placeholder="User ID" />
                            <input type="password" name="itxPassword" className="input-modern" placeholder="Password" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">GST Login</label>
                            <input type="text" name="gstLogin" className="input-modern mb-2" placeholder="Username" />
                            <input type="password" name="gstPassword" className="input-modern" placeholder="Password" />
                        </div>
                    </div>

                    {/* Traces/PT */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Traces Login</label>
                            <input type="text" name="tracesLogin" className="input-modern mb-2" placeholder="User ID" />
                            <input type="password" name="tracesPassword" className="input-modern" placeholder="Password" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">PT / PF / ESI Login</label>
                            <input type="text" name="ptLogin" className="input-modern mb-2" placeholder="User ID" />
                            <input type="password" name="ptPassword" className="input-modern" placeholder="Password" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="premium-btn"
                    >
                        {loading ? "Adding..." : "Add Client"}
                    </button>
                </div>
            </form>
        </div>
    )
}
