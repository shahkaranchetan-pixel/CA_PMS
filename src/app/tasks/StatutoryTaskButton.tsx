"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"

export default function StatutoryTaskButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleGenerate = async () => {
        if (!confirm("This will automatically create TDS, GST, and Accounting tasks for all eligible clients for the current month. Proceed?")) {
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/tasks/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            })

            const data = await res.json()
            if (res.ok) {
                toast.success(`Successfully generated ${data.count} statutory tasks!`)
                router.refresh()
            } else {
                toast.error("Error: " + (data.error || "Failed to generate tasks"))
            }
        } catch (error) {
            console.error(error)
            toast.error("Something went wrong while generating tasks.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn btn-g"
            style={{
                background: 'rgba(79, 172, 254, 0.1)',
                color: '#4FACFE',
                border: '1px solid rgba(79, 172, 254, 0.3)',
                fontWeight: 600
            }}
        >
            {loading ? "⏳ Generating..." : "✨ Populate Monthly Tasks"}
        </button>
    )
}
