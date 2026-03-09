"use client"

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BoardView({ tasks, taskMap }: { tasks: any[], taskMap: any }) {
    const router = useRouter();
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const columns = [
        { id: "PENDING", title: "To Do", color: "#FFB020", icon: "📝" },
        { id: "IN_PROGRESS", title: "In Progress", color: "#4FACFE", icon: "🔄" },
        { id: "UNDER_REVIEW", title: "Under Review", color: "#B89AFF", icon: "👁️" },
        { id: "BLOCKED", title: "Blocked", color: "#FF5757", icon: "🚧" },
        { id: "COMPLETED", title: "Done", color: "#00CF84", icon: "✅" }
    ];

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (!draggingId) return;

        const task = tasks.find(t => t.id === draggingId);
        if (task && task.status !== status) {
            try {
                const res = await fetch(`/api/tasks/${draggingId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                if (res.ok) {
                    router.refresh();
                }
            } catch (err) {
                console.error(err);
            }
        }
        setDraggingId(null);
    };

    return (
        <div style={{ display: 'flex', gap: '14px', marginTop: '16px', overflowX: 'auto', paddingBottom: '16px', minHeight: '600px' }}>
            {columns.map(col => {
                const colTasks = tasks.filter(t => t.status === col.id);
                return (
                    <div
                        key={col.id}
                        style={{
                            flex: 1,
                            minWidth: '240px',
                            background: 'var(--surface)',
                            borderRadius: '12px',
                            padding: '14px',
                            borderTop: `4px solid ${col.color}`
                        }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{col.icon}</span> {col.title}
                            </h3>
                            <span style={{ fontSize: '11px', background: col.color + '20', color: col.color, padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>{colTasks.length}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {colTasks.map(task => {
                                const tm = taskMap[task.taskType] || { label: task.taskType?.replace(/_/g, ' ') || 'Task', color: 'var(--muted)', icon: '📝' };
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

                                return (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        style={{
                                            background: 'var(--surface2)',
                                            borderRadius: '10px',
                                            padding: '14px',
                                            border: `1px solid ${col.id === 'BLOCKED' ? 'rgba(255,87,87,.2)' : 'var(--border)'}`,
                                            cursor: 'grab',
                                            opacity: draggingId === task.id ? 0.5 : 1,
                                            transition: 'all .2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 600, color: tm.color, background: tm.color + '15', padding: '2px 6px', borderRadius: '4px' }}>
                                                {tm.icon} {tm.label}
                                            </span>
                                            <span className={`badge b-${task.priority?.toLowerCase() || 'medium'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                                                {task.priority?.toUpperCase() || 'MEDIUM'}
                                            </span>
                                        </div>

                                        <Link href={`/tasks/${task.id}`} style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', display: 'block', marginBottom: '4px', lineHeight: 1.3 }}>
                                            {task.title}
                                        </Link>

                                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
                                            {task.client?.name}
                                        </div>

                                        {/* Subtask progress */}
                                        {task.subtasks && task.subtasks.length > 0 && (
                                            <div style={{ marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>
                                                    <span>Subtasks</span>
                                                    <span>{task.subtasks.filter((s: any) => s.status === 'COMPLETED').length}/{task.subtasks.length}</span>
                                                </div>
                                                <div style={{ height: '4px', background: 'rgba(255,255,255,.06)', borderRadius: '99px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${(task.subtasks.filter((s: any) => s.status === 'COMPLETED').length / task.subtasks.length) * 100}%`, background: col.color, borderRadius: '99px' }} />
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                {task.taskAssignees && task.taskAssignees.length > 0 ? (
                                                    task.taskAssignees.slice(0, 3).map((ta: any, i: number) => (
                                                        <div key={ta.id} style={{ width: 22, height: 22, borderRadius: '50%', background: ta.user?.color || 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#000', marginLeft: i > 0 ? '-6px' : 0, border: '2px solid var(--surface2)', zIndex: 3 - i }} title={ta.user?.name}>
                                                            {ta.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1px dashed var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--muted)' }} title="Unassigned">
                                                        ?
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ color: isOverdue ? 'var(--danger)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                                                {isOverdue && '⚠️ '}
                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {colTasks.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--muted)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                                    Drop tasks here
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
