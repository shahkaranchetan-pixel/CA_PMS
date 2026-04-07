"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"

export default function TaskStatusSelect({ taskId, initialStatus }: { taskId: string, initialStatus: string }) {
    const [status, setStatus] = useState(initialStatus.toUpperCase())
    const [updating, setUpdating] = useState(false)

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value
        const oldStatus = status
        setStatus(newStatus) // Optimistic update — instant UI

        setUpdating(true)
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (!res.ok) {
                setStatus(oldStatus) // Revert on failure
                toast.error('Failed to update status')
            } else {
                toast.success(`Status → ${newStatus.replace('_', ' ')}`)
            }
        } catch (err) {
            console.error(err)
            setStatus(oldStatus)
            toast.error('Failed to update status')
        } finally {
            setUpdating(false)
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
            disabled={updating}
            style={{
                color: statusColors[status] || 'var(--text)',
                borderColor: (statusColors[status] || 'var(--border)') + '40',
                opacity: updating ? 0.6 : 1
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
