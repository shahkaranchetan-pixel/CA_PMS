"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function TaskStatusSelect({ taskId, initialStatus }: { taskId: string, initialStatus: string }) {
    const router = useRouter()
    const [status, setStatus] = useState(initialStatus.toUpperCase())

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value
        setStatus(newStatus)

        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                router.refresh()
            }
        } catch (err) {
            console.error(err)
            setStatus(initialStatus.toUpperCase())
        }
    }

    const statusColors: Record<string, string> = {
        'PENDING': '#FFB020',
        'IN_PROGRESS': '#4FACFE',
        'UNDER_REVIEW': '#B89AFF',
        'BLOCKED': '#FF5757',
        'COMPLETED': '#00CF84'
    }

    return (
        <select
            className="sel-status"
            value={status}
            onChange={handleChange}
            style={{
                color: statusColors[status] || 'var(--text)',
                borderColor: (statusColors[status] || 'var(--border)') + '40'
            }}
        >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
        </select>
    )
}
