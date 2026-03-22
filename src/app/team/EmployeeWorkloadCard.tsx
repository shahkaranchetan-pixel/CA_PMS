"use client";

import React, { useState } from "react";
import Link from "next/link";
import ReassignButton from "./ReassignButton";
import EditEmployeeModal from "./EditEmployeeModal";

export default function EmployeeWorkloadCard({ member, allMembers, now, isAdmin }: any) {
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const activeTasks = member.tasks.filter((t: any) => t.status !== 'COMPLETED');
    const completedTasks = member.tasks.filter((t: any) => t.status === 'COMPLETED');
    const overdueTasks = member.tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date(now) && t.status !== 'COMPLETED');
    const blockedTasks = member.tasks.filter((t: any) => t.status === 'BLOCKED');
    const highPriority = activeTasks.filter((t: any) => t.priority === 'high');

    const MAX_CAPACITY = 10;
    const load = Math.min((activeTasks.length / MAX_CAPACITY) * 100, 100);
    const loadColor = load > 80 ? '#FF5757' : load > 50 ? '#FFB020' : '#00CF84';
    const loadLabel = load > 80 ? 'Overloaded' : load > 50 ? 'Moderate' : 'Available';

    return (
        <div 
            className={`wl-card ${expanded ? 'expanded' : ''}`} 
            style={{ cursor: 'pointer', transition: 'all 0.3s ease', transform: expanded ? 'scale(1.02)' : 'scale(1)', zIndex: expanded ? 10 : 1 }}
            onClick={() => setExpanded(!expanded)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', position: 'relative' }}>
                <div style={{
                    width: 42, height: 42, borderRadius: '12px',
                    background: member.color || 'var(--gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: '#000'
                }}>
                    {member.name?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{member.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={`badge ${member.role === 'ADMIN' ? 'b-high' : 'b-low'}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                            {member.role}
                        </span>
                        <span>{member.dept || 'General'}</span>
                    </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div>
                        <div style={{ fontSize: '9px', color: loadColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {loadLabel}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Playfair Display,serif', color: loadColor }}>
                            {Math.round(load)}%
                        </div>
                    </div>
                    {isAdmin && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit Employee"
                        >
                            ⚙️
                        </button>
                    )}
                </div>
            </div>

            {/* Load bar */}
            <div className="wl-bar-track">
                <div className="wl-bar-fill" style={{ width: `${load}%`, background: loadColor }} />
            </div>

            {/* Metrics */}
            <div className="wl-meta" style={{ gap: '12px' }}>
                <div className="wl-meta-item">
                    <span className="label">Active</span>
                    <span className="val" style={{ color: '#4FACFE', fontSize: '14px' }}>{activeTasks.length}</span>
                </div>
                <div className="wl-meta-item">
                    <span className="label">Done</span>
                    <span className="val" style={{ color: '#00CF84', fontSize: '14px' }}>{completedTasks.length}</span>
                </div>
                <div className="wl-meta-item">
                    <span className="label">Overdue</span>
                    <span className="val" style={{ color: overdueTasks.length > 0 ? '#FF5757' : 'var(--muted)', fontSize: '14px' }}>{overdueTasks.length}</span>
                </div>
                <div className="wl-meta-item">
                    <span className="label">Blocked</span>
                    <span className="val" style={{ color: blockedTasks.length > 0 ? '#FF5757' : 'var(--muted)', fontSize: '14px' }}>{blockedTasks.length}</span>
                </div>
                <div className="wl-meta-item">
                    <span className="label">Hot</span>
                    <span className="val" style={{ color: highPriority.length > 0 ? '#FF5757' : 'var(--muted)', fontSize: '14px' }}>{highPriority.length}</span>
                </div>
            </div>

            {/* Expanded task list */}
            {expanded && (
                <div 
                    style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)', animation: 'fadeIn 0.3s ease-in-out' }}
                    onClick={(e) => e.stopPropagation()} /* Prevent card collapse when clicking inside the tasks list */
                >
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                        All Active Tasks ({activeTasks.length})
                    </div>
                    {activeTasks.length === 0 ? (
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', padding: '10px 0' }}>No active tasks.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                            {activeTasks.map((t: any) => {
                                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date(now);
                                return (
                                    <div key={t.id} style={{ display: 'flex', flexDirection: 'column', padding: '8px', background: 'var(--surface2)', borderRadius: '6px', border: isOverdue ? '1px solid rgba(255,87,87,0.3)' : '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <Link href={`/tasks/${t.id}`} style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500, flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                                                {t.title}
                                            </Link>
                                            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: isOverdue ? 'rgba(255,87,87,0.1)' : 'var(--surface2)', color: isOverdue ? '#FF5757' : 'var(--muted)' }}>
                                                {t.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '10px', color: isOverdue ? '#FF5757' : 'var(--muted)' }}>
                                                {t.dueDate ? `Due: ${new Date(t.dueDate).toLocaleDateString()}` : 'No due date'}
                                            </div>
                                            <ReassignButton taskId={t.id} team={allMembers} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
            
            {/* Overdue task list (always visible if not expanded) */}
            {!expanded && overdueTasks.length > 0 && (
                <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(255,87,87,.05)', borderRadius: '8px', border: '1px solid rgba(255,87,87,.15)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#FF5757', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                        ⚠️ Overdue Tasks
                    </div>
                    {overdueTasks.slice(0, 3).map((t: any) => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--surface2)' }}>
                            <Link href={`/tasks/${t.id}`} style={{ fontSize: '11.5px', color: 'var(--text)', fontWeight: 500, flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                • {t.title}
                            </Link>
                            {/* Removed Reassign from mini view so they expand to see it cleanly, or we can keep it */}
                            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{new Date(t.dueDate).toLocaleDateString()}</div>
                        </div>
                    ))}
                    {overdueTasks.length > 3 && (
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>+{overdueTasks.length - 3} more overdue (Click to expand)</div>
                    )}
                </div>
            )}

            {isEditing && (
                <EditEmployeeModal member={member} onClose={() => setIsEditing(false)} />
            )}
            
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
