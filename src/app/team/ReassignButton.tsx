"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ReassignButton({ taskId, team }: { taskId: string, team: { id: string, name: string }[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReassign = async (userId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assigneeIds: [userId] }),
            });
            if (res.ok) {
                setOpen(false);
                router.refresh();
            } else {
                throw new Error("Failed to reassign");
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
                onClick={() => setOpen(!open)} 
                className="btn btn-g" 
                style={{ fontSize: '10px', padding: '2px 6px', height: 'auto' }}
            >
                🔄 Reassign
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 100,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '8px', minWidth: '150px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginTop: '4px'
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)', textTransform: 'uppercase' }}>Assign to:</div>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {team.map(m => (
                            <button 
                                key={m.id}
                                onClick={() => handleReassign(m.id)}
                                disabled={loading}
                                style={{
                                    textAlign: 'left', background: 'var(--surface2)',
                                    border: 'none', padding: '6px 8px', borderRadius: '4px',
                                    fontSize: '11px', color: 'var(--text)', cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={e => (e.currentTarget.style.background = 'var(--gold-soft)')}
                                onMouseOut={e => (e.currentTarget.style.background = 'var(--surface2)')}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
