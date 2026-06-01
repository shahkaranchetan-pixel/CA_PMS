'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import TaskStatusSelect from './TaskStatusSelect';

export default function TaskTableClient({ tasks, taskMap, users, currentUserRole }: { tasks: any[], taskMap: any, users: { id: string, name: string | null }[], currentUserRole: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [bulkAssignee, setBulkAssignee] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    const toggleSelectAll = () => {
        if (selectedTasks.length === tasks.length) {
            setSelectedTasks([]);
        } else {
            setSelectedTasks(tasks.map(t => t.id));
        }
    };

    const toggleTask = (taskId: string) => {
        setSelectedTasks(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
    };

    const handleBulkAssign = async () => {
        if (!bulkAssignee || selectedTasks.length === 0) return;
        setIsAssigning(true);
        try {
            const res = await fetch('/api/tasks/bulk-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskIds: selectedTasks, userId: bulkAssignee })
            });
            if (res.ok) {
                setSelectedTasks([]);
                setBulkAssignee('');
                router.refresh();
            } else {
                alert('Failed to assign tasks');
            }
        } catch (e) {
            console.error(e);
            alert('Error assigning tasks');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleAssigneeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        if (val === 'all') {
            params.delete('assignee');
        } else {
            params.set('assignee', val);
        }
        router.push(`/tasks?${params.toString()}`);
    };

    const currentAssignee = searchParams.get('assignee') || 'all';

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '16px' }}>
            {currentUserRole === 'ADMIN' && (
                <div style={{ padding: '12px 16px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: selectedTasks.length > 0 ? 'var(--text)' : 'var(--muted)' }}>
                        {selectedTasks.length} tasks selected
                    </span>
                    <select
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', opacity: selectedTasks.length > 0 ? 1 : 0.5 }}
                        value={bulkAssignee}
                        onChange={e => setBulkAssignee(e.target.value)}
                        disabled={selectedTasks.length === 0}
                    >
                        <option value="">Select Assignee for bulk assignment...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <button 
                        className="btn btn-p" 
                        style={{ padding: '6px 12px', fontSize: '13px', opacity: selectedTasks.length > 0 && bulkAssignee ? 1 : 0.5 }}
                        onClick={handleBulkAssign}
                        disabled={isAssigning || !bulkAssignee || selectedTasks.length === 0}
                    >
                        {isAssigning ? 'Assigning...' : 'Bulk Assign'}
                    </button>
                </div>
            )}
            <div className="table-wrapper">
                <table className="tbl">
                    <thead style={{ background: 'rgba(255,255,255,.01)' }}>
                        <tr>
                            {currentUserRole === 'ADMIN' && (
                                <th style={{ width: 40, padding: '12px', textAlign: 'center' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedTasks.length > 0 && selectedTasks.length === tasks.length}
                                        onChange={toggleSelectAll}
                                        style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                                    />
                                </th>
                            )}
                            <th style={{ width: currentUserRole === 'ADMIN' ? 40 : 60, padding: '12px' }}>#</th>
                            <th>Task Overview</th>
                            <th>Entity</th>
                            <th>Priority</th>
                            <th>Due Date</th>
                            <th>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Assignee
                                    {currentUserRole === 'ADMIN' && (
                                        <select 
                                            value={currentAssignee} 
                                            onChange={handleAssigneeFilter}
                                            style={{ 
                                                padding: '2px 4px', 
                                                fontSize: '11px', 
                                                borderRadius: '4px', 
                                                border: '1px solid var(--border)', 
                                                background: 'var(--surface2)', 
                                                color: 'var(--text)',
                                                fontWeight: 'normal',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="all">All</option>
                                            <option value="unassigned">Unassigned</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    )}
                                </div>
                            </th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.length === 0 ? (
                            <tr>
                                <td colSpan={currentUserRole === 'ADMIN' ? 8 : 7}>
                                    <div className="empty">
                                        <div className="empty-i">📋</div>
                                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>No tasks found</div>
                                        <div style={{ fontSize: '12.5px' }}>Adjust filters or create a new task.</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            tasks.map((task, index) => {
                                const tm = taskMap[task.taskType] || { label: task.taskType.replace(/_/g, ' '), color: 'var(--muted)', icon: '📝' };
                                const s = task.status.toLowerCase();
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && s !== 'completed';

                                return (
                                    <tr key={task.id} style={{ background: selectedTasks.includes(task.id) ? 'var(--surface2)' : 'transparent' }}>
                                        {currentUserRole === 'ADMIN' && (
                                            <td style={{ textAlign: 'center' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedTasks.includes(task.id)}
                                                    onChange={() => toggleTask(task.id)}
                                                    style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                                                />
                                            </td>
                                        )}
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{index + 1}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: tm.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                                    {tm.icon}
                                                </div>
                                                <div>
                                                    <Link href={`/tasks/${task.id}`} style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)' }}>
                                                        {task.title}
                                                    </Link>
                                                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                        <span>{tm.label}</span>
                                                        {task.subtasks.length > 0 && <span style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, color: 'var(--text)' }}>{task.subtasks.filter((t: any) => t.status === 'COMPLETED').length}/{task.subtasks.length} Subtasks</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{task.client?.name}</td>
                                        <td>
                                            <span className={`badge b-${task.priority.toLowerCase()}`}>
                                                {task.priority.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500, color: isOverdue ? 'var(--danger)' : 'var(--text)' }}>
                                            {isOverdue && '⚠️ '}
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
                                        </td>
                                        <td>
                                            {task.taskAssignees && task.taskAssignees.length > 0 ? (
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    {task.taskAssignees.slice(0, 3).map((ta: any, i: number) => (
                                                        <div key={ta.id} style={{ width: 24, height: 24, borderRadius: 6, background: ta.user?.color || 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#000', marginLeft: i > 0 ? '-6px' : 0, border: '2px solid var(--surface)', zIndex: 3 - i }} title={ta.user?.name}>
                                                            {ta.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                                                        </div>
                                                    ))}
                                                    {task.taskAssignees.length > 3 && (
                                                        <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--muted)' }}>+{task.taskAssignees.length - 3}</span>
                                                    )}
                                                    {task.taskAssignees.length === 1 && (
                                                        <span style={{ fontSize: '12px', marginLeft: '6px' }}>{task.taskAssignees[0].user?.name?.split(' ')[0]}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--muted)', fontSize: '12px', fontStyle: 'italic' }}>Unassigned</span>
                                            )}
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <TaskStatusSelect taskId={task.id} initialStatus={s} />
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
