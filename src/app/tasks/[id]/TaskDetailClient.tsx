"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "react-hot-toast"

const STATUS_MAP: Record<string, { label: string, color: string }> = {
    PENDING: { label: 'Pending', color: '#FFB020' },
    IN_PROGRESS: { label: 'In Progress', color: '#4FACFE' },
    UNDER_REVIEW: { label: 'Under Review', color: '#B89AFF' },
    BLOCKED: { label: 'Blocked', color: '#FF5757' },
    COMPLETED: { label: 'Completed', color: '#00CF84' },
}

export default function TaskDetailClient({ task, isAdmin }: { task: any, isAdmin?: boolean }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(task.status)
    const [notifyOnComplete, setNotifyOnComplete] = useState(true)
    const [comment, setComment] = useState("")
    const [submittingComment, setSubmittingComment] = useState(false)
    const [activities, setActivities] = useState(task.activities || [])

    const handleStatusChange = async (newStatus: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    status: newStatus,
                    notifyClient: newStatus === 'COMPLETED' ? notifyOnComplete : false
                }),
            })
            if (!res.ok) throw new Error("Failed to update status")
            setStatus(newStatus)
            router.refresh()
            const msg = (newStatus === 'COMPLETED' && notifyOnComplete) 
                ? `Task completed and client notified! 📧` 
                : `Task status updated to ${STATUS_MAP[newStatus]?.label || newStatus}`;
            toast.success(msg)
        } catch (error) {
            console.error(error)
            toast.error("Failed to update task status")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this task? This cannot be undone.")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Task deleted successfully")
                router.push("/tasks");
                router.refresh();
            } else {
                throw new Error("Failed to delete task");
            }
        } catch (err) {
            toast.error("Error deleting task");
        } finally {
            setLoading(false);
        }
    }

    const handleClone = async () => {
        setLoading(true);
        try {
            // Simply call existing Task GET and then POST to create a duplicate
            const res = await fetch(`/api/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `${task.title} (Clone)`,
                    description: task.description,
                    taskType: task.taskType,
                    clientId: task.clientId,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    period: task.period,
                    assigneeIds: task.taskAssignees?.map((ta: any) => ta.userId) || []
                }),
            });
            if (res.ok) {
                const newTask = await res.json();
                toast.success("Task cloned successfully")
                router.push(`/tasks/${newTask.id}/edit`);
                router.refresh();
            }
        } catch (err) { toast.error("Error cloning task"); }
        finally { setLoading(false); }
    };

    const toggleActivity = async (id: string, current: boolean) => {
        try {
            const res = await fetch(`/api/tasks/${task.id}/activities/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isCompleted: !current }),
            });
            if (res.ok) {
                setActivities(activities.map((a: any) => a.id === id ? { ...a, isCompleted: !current } : a));
                router.refresh();
            }
        } catch (err) { console.error(err); }
    };

    const submitComment = async () => {
        if (!comment.trim()) return;
        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/tasks/${task.id}/logs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: comment }),
            });
            if (res.ok) {
                setComment("");
                toast.success("Comment added")
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to add comment")
        } finally {
            setSubmittingComment(false);
        }
    };

    const st = STATUS_MAP[status] || { label: status, color: 'var(--muted)' };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <Link href="/tasks" style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                ← Back to Tasks
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', marginTop: '8px' }}>
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '26px', fontWeight: 700, marginBottom: '8px' }}>{task.title}</h1>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        <span className={`badge b-${status.toLowerCase()}`}>{st.label}</span>
                        <span className="badge b-entity">{task.taskType?.replace(/_/g, ' ')}</span>
                        {task.frequency !== 'ONCE' && (
                            <span style={{ background: 'rgba(79,172,254,.1)', color: '#4FACFE', border: '1px solid rgba(79,172,254,.2)', padding: '3px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600 }}>
                                ↻ {task.frequency}
                            </span>
                        )}
                        <span className={`badge b-${task.priority?.toLowerCase() || 'medium'}`}>
                            {task.priority?.toUpperCase() || 'MEDIUM'}
                        </span>
                    </div>
                </div>
                 <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {status !== 'COMPLETED' && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginRight: '8px', padding: '0 12px', background: 'var(--surface2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <input 
                                type="checkbox" 
                                checked={notifyOnComplete} 
                                onChange={e => setNotifyOnComplete(e.target.checked)}
                                style={{ width: '16px', height: '16px' }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 600 }}>📧 Notify Client?</span>
                        </label>
                    )}
                    {status === 'PENDING' && (
                        <button onClick={() => handleStatusChange('IN_PROGRESS')} disabled={loading} className="btn btn-g">
                            {loading ? "..." : "▶ Start Working"}
                        </button>
                    )}
                    {status === 'IN_PROGRESS' && (
                        <button onClick={() => handleStatusChange('UNDER_REVIEW')} disabled={loading} className="btn btn-b">
                            {loading ? "..." : "👁️ Send to Review"}
                        </button>
                    )}
                     {status !== 'COMPLETED' && (
                        <button onClick={() => handleStatusChange('COMPLETED')} disabled={loading} className="btn btn-p">
                            {loading ? "..." : "✅ Complete"}
                        </button>
                    )}
                     <Link href={`/tasks/${task.id}/edit`} className="btn btn-g">✏️ Edit</Link>
                    <button onClick={handleClone} disabled={loading} className="btn btn-g">👯 Clone</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Description */}
                    <div className="card">
                        <div className="ctitle">📝 Task Details</div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6, minHeight: '60px', padding: '10px', background: 'var(--surface2)', borderRadius: '8px' }}>
                            {task.description || "No description provided."}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600 }}>Period</div>
                                <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '3px' }}>{task.period || "N/A"}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600 }}>Due Date</div>
                                <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '3px', color: task.dueDate && new Date(task.dueDate) < new Date() && status !== 'COMPLETED' ? 'var(--danger)' : 'var(--text)' }}>
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activities (Checklist) */}
                    {activities.length > 0 && (
                        <div className="card">
                            <div className="ctitle">
                                <span>📋 Task Checklist</span>
                                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                    {activities.filter((a: any) => a.isCompleted).length}/{activities.length} completed
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {activities.map((act: any) => (
                                    <div 
                                        key={act.id} 
                                        onClick={() => toggleActivity(act.id, act.isCompleted)}
                                        style={{ 
                                            display: 'flex', gap: '10px', padding: '10px 12px', background: 'var(--surface2)', 
                                            borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer',
                                            transition: 'transform 0.1s'
                                        }}
                                    >
                                        <div style={{ 
                                            width: 18, height: 18, borderRadius: 4, 
                                            border: `2px solid ${act.isCompleted ? '#00CF84' : 'var(--muted)'}`,
                                            background: act.isCompleted ? '#00CF84' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {act.isCompleted && <span style={{ color: '#000', fontSize: '12px', fontWeight: 900 }}>✓</span>}
                                        </div>
                                        <div style={{ 
                                            fontSize: '13px', color: 'var(--text)', 
                                            textDecoration: act.isCompleted ? 'line-through' : 'none',
                                            opacity: act.isCompleted ? 0.6 : 1
                                        }}>
                                            {act.title}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subtasks (Child Tasks) */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="card">
                            <div className="ctitle">
                                <span>🔗 Child Tasks</span>
                                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                    {task.subtasks.filter((s: any) => s.status === 'COMPLETED').length}/{task.subtasks.length} done
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {task.subtasks.map((sub: any) => (
                                    <Link key={sub.id} href={`/tasks/${sub.id}`} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                                        background: 'var(--surface2)', borderRadius: '8px', fontSize: '12.5px',
                                        border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)'
                                    }}>
                                        <span style={{ color: sub.status === 'COMPLETED' ? '#00CF84' : 'var(--muted)', fontSize: '14px' }}>
                                            {sub.status === 'COMPLETED' ? '✅' : '○'}
                                        </span>
                                        <span style={{ flex: 1, fontWeight: 500, textDecoration: sub.status === 'COMPLETED' ? 'line-through' : 'none', opacity: sub.status === 'COMPLETED' ? 0.6 : 1 }}>
                                            {sub.title}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {sub.taskAssignees && sub.taskAssignees.map((ta: any, i: number) => (
                                                <div key={ta.id} style={{ width: 20, height: 20, borderRadius: '50%', background: ta.user?.color || 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#000', marginLeft: i > 0 ? '-4px' : 0, border: '2px solid var(--surface2)' }}>
                                                    {ta.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                                                </div>
                                            ))}
                                        </div>
                                        <span className={`badge b-${sub.status?.toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                                            {sub.status?.replace('_', ' ')}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Activity & Comments */}
                    <div className="card">
                        <div className="ctitle">💬 Activity & Comments</div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <input
                                type="text"
                                style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', outline: 'none' }}
                                placeholder="Add a comment..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && submitComment()}
                            />
                            <button
                                onClick={submitComment}
                                disabled={submittingComment || !comment.trim()}
                                className="btn btn-p"
                                style={{ opacity: (!comment.trim() || submittingComment) ? 0.5 : 1 }}
                            >
                                Post
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                            {task.logs?.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: '13px' }}>No activity yet.</div>
                            ) : (
                                task.logs?.map((log: any) => (
                                    <div key={log.id} style={{ display: 'flex', gap: '10px', fontSize: '12.5px' }}>
                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', color: 'var(--muted)' }}>
                                            {log.user?.name ? log.user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div style={{ flex: 1, background: 'var(--surface2)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600 }}>{log.user?.name || 'Unknown'}</span>
                                                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                            {log.type === 'STATUS_CHANGE' ? (
                                                <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                                                    Changed status from <span className={`badge b-${log.oldStatus?.toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 5px' }}>{log.oldStatus}</span> to <span className={`badge b-${log.newStatus?.toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 5px' }}>{log.newStatus}</span>
                                                </div>
                                            ) : (
                                                <div style={{ color: 'var(--text)' }}>{log.content}</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Assignment */}
                    <div className="card">
                        <div className="ctitle">👤 Assignment</div>
                        <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '6px' }}>Assigned To</div>
                            {task.taskAssignees && task.taskAssignees.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {task.taskAssignees.map((ta: any) => (
                                        <div key={ta.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '10px', background: ta.user?.color || 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: '#000' }}>
                                                {ta.user?.name ? ta.user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '13px' }}>{ta.user?.name || 'Unnamed User'}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{ta.user?.email}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--muted)', fontSize: '12px', fontStyle: 'italic', background: 'var(--surface2)', padding: '10px', borderRadius: '8px' }}>
                                    Unassigned
                                </div>
                            )}
                        </div>

                        <div>
                            <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '6px' }}>Client</div>
                            <Link href={`/clients/${task.clientId}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)' }}>
                                <span>🏢</span>
                                <span style={{ fontWeight: 500 }}>{task.client.name}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Time & Dependencies */}
                    <div className="card">
                        <div className="ctitle">⏱️ Time & Dependencies</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>Est. Minutes</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Playfair Display,serif' }}>{task.estimatedMinutes ?? '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>Time Logged</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Playfair Display,serif' }}>{task.timeLogged || '0'} min</div>
                            </div>
                            {task.estimatedMinutes && task.estimatedMinutes > 0 && (
                                <div>
                                    <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>Progress</div>
                                    <div className="wl-bar-track">
                                        <div className="wl-bar-fill" style={{ width: `${Math.min((task.timeLogged / task.estimatedMinutes) * 100, 100)}%`, background: (task.timeLogged / task.estimatedMinutes) > 1 ? '#FF5757' : '#00CF84' }} />
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{Math.round((task.timeLogged / task.estimatedMinutes) * 100)}% of estimate</div>
                                </div>
                            )}
                            {task.blockedBy && (
                                <div style={{ padding: '10px', background: 'rgba(255,87,87,.05)', borderRadius: '8px', border: '1px solid rgba(255,87,87,.15)' }}>
                                    <div style={{ fontSize: '9px', color: '#FF5757', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '4px' }}>🚧 Blocked By</div>
                                    <Link href={`/tasks/${task.blockedBy.id}`} style={{ fontWeight: 600, color: '#FF5757', fontSize: '12.5px' }}>
                                        {task.blockedBy.title}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <div className="ctitle">⚡ Quick Actions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {status !== 'BLOCKED' && (
                                <button onClick={() => handleStatusChange('BLOCKED')} disabled={loading} className="btn btn-d" style={{ width: '100%', justifyContent: 'center' }}>
                                    🚧 Mark as Blocked
                                </button>
                            )}
                            {status === 'BLOCKED' && (
                                <button onClick={() => handleStatusChange('IN_PROGRESS')} disabled={loading} className="btn btn-b" style={{ width: '100%', justifyContent: 'center' }}>
                                    🔄 Unblock & Resume
                                </button>
                            )}
                            {task.client?.contactPhone && (
                                <a 
                                    href={`https://wa.me/${task.client.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Dear ${task.client.name}, your ${task.title} for ${task.period || 'current period'} is due on ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'time'}. Please share your data at the earliest. - KCS Team`)}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="btn btn-g" 
                                    style={{ width: '100%', justifyContent: 'center', background: '#25D366', color: 'var(--text)', borderColor: '#25D366' }}
                                >
                                    💬 WhatsApp Reminder
                                </a>
                            )}
                            {status === 'COMPLETED' && (
                                <button onClick={() => handleStatusChange('PENDING')} disabled={loading} className="btn btn-g" style={{ width: '100%', justifyContent: 'center' }}>
                                    ↩ Reopen Task
                                </button>
                            )}
                            {isAdmin && (
                                <button onClick={handleDelete} disabled={loading} className="btn btn-d" style={{ width: '100%', justifyContent: 'center', marginTop: '8px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                                    🗑️ Delete Task
                                </button>
                            )}
                        </div>
                    </div>

                    {/* AI Quick Draft */}
                    <AIReminderDraft taskId={task.id} client={task.client} taskTitle={task.title} period={task.period} />
                </div>
            </div>
        </div>
    )
}

function AIReminderDraft({ taskId, client, taskTitle, period }: { taskId: string, client: any, taskTitle: string, period?: string }) {
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [channel, setChannel] = useState("whatsapp");
    const [urgency, setUrgency] = useState("gentle");

    const handleSendEmail = async () => {
        if (!client?.contactEmail) {
            alert("No contact email found for this client.");
            return;
        }
        setSendingEmail(true);
        try {
            const res = await fetch("/api/ai/send-reminder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: client.contactEmail,
                    subject: `Reminder: ${taskTitle} - KCS Team`,
                    content: draft
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Email sent successfully!");
            } else {
                throw new Error(data.error || "Failed to send email");
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSendingEmail(false);
        }
    };

    const handleDraft = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/ai/draft-reminder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, channel, urgency }),
            });
            const data = await res.json();
            if (data.draft) {
                setDraft(data.draft);
                toast.success("Draft generated!");
            } else throw new Error(data.error || "Failed to draft");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(draft);
        toast.success("Draft copied to clipboard!");
    };

    return (
        <div className="card" style={{ border: '1px solid var(--gold-soft)', background: 'rgba(232,160,32,0.03)' }}>
            <div className="ctitle" style={{ color: 'var(--gold)' }}>✨ AI Reminder Draft</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select 
                    value={channel} 
                    onChange={e => setChannel(e.target.value)}
                    style={{ flex: 1, fontSize: '11px', padding: '6px', borderRadius: '4px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                </select>
                <select 
                    value={urgency} 
                    onChange={e => setUrgency(e.target.value)}
                    style={{ flex: 1, fontSize: '11px', padding: '6px', borderRadius: '4px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                    <option value="gentle">Gentle Nudge</option>
                    <option value="firm">Firm/Urgent</option>
                </select>
            </div>
            {!draft ? (
                <button 
                    onClick={handleDraft} 
                    disabled={loading} 
                    className="btn btn-p" 
                    style={{ width: '100%', fontSize: '12px' }}
                >
                    {loading ? "Generating Draft..." : "Generate AI Draft"}
                </button>
            ) : (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ background: 'var(--surface2)', padding: '10px', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border)', maxHeight: '150px', overflowY: 'auto', marginBottom: '10px', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                        {draft}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleCopy} className="btn btn-g" style={{ flex: 1, fontSize: '11px' }}>📋 Copy</button>
                        <button onClick={() => setDraft("")} className="btn btn-d" style={{ flex: 1, fontSize: '11px', background: 'transparent' }}>Clear</button>
                    </div>
                    {channel === 'whatsapp' && client?.contactPhone && (
                        <a 
                            href={`https://wa.me/${client.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(draft)}`} 
                            target="_blank" 
                            className="btn btn-g" 
                            style={{ width: '100%', marginTop: '8px', background: '#25D366', color: 'var(--text)', fontSize: '11px', justifyContent: 'center' }}
                        >
                            Open in WhatsApp
                        </a>
                    )}
                    {channel === 'email' && client?.contactEmail && (
                        <button 
                            onClick={handleSendEmail} 
                            disabled={sendingEmail} 
                            className="btn btn-p" 
                            style={{ width: '100%', marginTop: '8px', fontSize: '11px' }}
                        >
                            {sendingEmail ? "Sending..." : `📧 Email to ${client.contactEmail}`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
