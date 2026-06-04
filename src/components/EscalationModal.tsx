"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface EscalationModalProps {
    taskId: string
    onClose: () => void
}

export default function EscalationModal({ taskId, onClose }: EscalationModalProps) {
    const [users, setUsers] = useState<any[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [note, setNote] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Fetch all users to select from
        fetch("/api/users")
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error(err))
    }, [])

    const handleEscalate = async () => {
        if (selectedUsers.length === 0) return alert("Please select at least one user to escalate to.")
        
        setLoading(true)
        try {
            const res = await fetch(`/api/tasks/${taskId}/escalate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientIds: selectedUsers, note })
            })
            if (!res.ok) throw new Error("Failed to escalate")
            
            router.refresh()
            onClose()
        } catch (error) {
            console.error(error)
            alert("Error escalating task")
        } finally {
            setLoading(false)
        }
    }

    const toggleUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(prev => prev.filter(id => id !== userId))
        } else {
            setSelectedUsers(prev => [...prev, userId])
        }
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ width: '400px', maxWidth: '90%', padding: '24px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--text)' }}>Escalate Task</h3>
                
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Select Users to Escalate To</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', background: 'var(--surface2)' }}>
                        {users.map(u => (
                            <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedUsers.includes(u.id)} 
                                    onChange={() => toggleUser(u.id)}
                                />
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: u.color || 'var(--ca-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#000', fontWeight: 'bold' }}>
                                    {u.name?.charAt(0).toUpperCase()}
                                </div>
                                {u.name}
                            </label>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Personal Note (Optional)</label>
                    <textarea 
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Add a note for the escalated person..."
                        style={{ width: '100%', height: '80px', padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', resize: 'none', fontSize: '13px' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} className="btn btn-g" disabled={loading}>Cancel</button>
                    <button onClick={handleEscalate} className="btn btn-p" disabled={loading}>
                        {loading ? 'Escalating...' : 'Escalate'}
                    </button>
                </div>
            </div>
        </div>
    )
}
