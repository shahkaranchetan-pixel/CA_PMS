"use client"

import { useState } from "react"
import Link from "next/link"

interface MyTasksDashboardProps {
    tasks: any[]
}

export default function MyTasksDashboard({ tasks }: MyTasksDashboardProps) {
    const [activeTab, setActiveTab] = useState("Open")
    const [search, setSearch] = useState("")
    const now = new Date()

    const tabs = [
        "Processing", "Open", "Finalized for Submission", "Overdue", "Stuck", "Completed", "Under Consultation"
    ]

    const filterTasks = () => {
        let filtered = tasks;
        const now = new Date();

        // 1. Filter by Search
        if (search) {
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(search.toLowerCase()) || 
                t.client?.name?.toLowerCase().includes(search.toLowerCase())
            )
        }

        // 2. Filter by Tab Logic
        switch (activeTab) {
            case "Processing":
                return filtered.filter(t => t.status === "IN_PROGRESS");
            case "Open":
                return filtered.filter(t => t.status === "PENDING" && (!t.dueDate || new Date(t.dueDate) >= now));
            case "Finalized for Submission":
                return filtered.filter(t => t.status === "FINALIZED" || t.status === "UNDER_REVIEW");
            case "Overdue":
                return filtered.filter(t => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < now);
            case "Stuck":
                return filtered.filter(t => t.status === "BLOCKED");
            case "Completed":
                return filtered.filter(t => t.status === "COMPLETED");
            case "Under Consultation":
                return filtered.filter(t => t.status === "CONSULTATION");
            default:
                return filtered;
        }
    }

    const displayedTasks = filterTasks()

    return (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#4FACFE', margin: 0 }}>My Tasks</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            placeholder="Search Tasks" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                background: 'var(--surface2)',
                                border: '1px solid var(--border)',
                                color: 'var(--text)',
                                fontSize: '13px',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                width: '220px',
                                outline: 'none'
                             }}
                        />
                    </div>
                    <Link href="/tasks/new" style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface2)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)',
                        textDecoration: 'none', border: '1px solid var(--border)', fontSize: '20px',
                        transition: 'all 0.2s'
                    }} title="Create Task">+</Link>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ 
                display: 'flex', gap: '24px', padding: '0 20px', borderBottom: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.01)', overflowX: 'auto'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '14px 0',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #4FACFE' : '2px solid transparent',
                            color: activeTab === tab ? '#4FACFE' : 'var(--muted)',
                            fontSize: '13px',
                            fontWeight: activeTab === tab ? 600 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Table Header */}
            <div style={{ overflowX: 'auto' }}>
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Task Name</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Reviewer</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Client</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTasks.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '60px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.3 }}>
                                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>📥</div>
                                        <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>No data</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayedTasks.map(task => (
                                <tr key={task.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '14px 20px' }}>
                                        <Link href={`/tasks/${task.id}`} style={{ textDecoration: 'none', fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                                            {task.title}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {task.taskAssignees?.map((ta: any) => (
                                                <div key={ta.id} style={{ 
                                                    width: '24px', height: '24px', borderRadius: '50%', background: ta.user?.color || 'var(--gold)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#000'
                                                }} title={ta.user?.name}>
                                                    {ta.user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            ))}
                                            {(!task.taskAssignees || task.taskAssignees.length === 0) && (
                                                <span style={{ fontSize: '12px', color: 'var(--muted2)' }}>-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--muted)' }}>
                                        {task.client?.name}
                                    </td>
                                    <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                        {task.dueDate ? (
                                            <span style={{ 
                                                color: new Date(task.dueDate) < now && task.status !== 'COMPLETED' ? 'var(--danger)' : 'var(--text)',
                                                fontWeight: 500
                                            }}>
                                                {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        ) : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
