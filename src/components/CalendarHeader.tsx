"use client"

import { useRouter } from "next/navigation"

interface CalendarHeaderProps {
    currentPeriod: string
    monthName: string
    year: number
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CalendarHeader({ currentPeriod, monthName, year }: CalendarHeaderProps) {
    const router = useRouter()
    
    // Generate valid periods for selection (Last 12 months, next 6)
    const now = new Date();
    const periods = [];
    for (let i = -12; i <= 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        periods.push(`${MONTHS[d.getMonth()]}-${d.getFullYear()}`);
    }

    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        router.push(`/calendar?period=${val}`);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
                <div className="ptitle">Schedule Calendar</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="psub" style={{ marginBottom: 0 }}>{monthName} {year} Overview</div>
                    <select 
                        value={currentPeriod} 
                        onChange={handlePeriodChange}
                        style={{
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                            color: 'var(--gold)',
                            fontSize: '12px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            outline: 'none'
                        }}
                    >
                        {periods.map(p => (
                            <option key={p} value={p}>{p.replace('-', ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <a href="/tasks/new" className="btn btn-p" style={{ textDecoration: 'none' }}>+ New Task</a>
                <a href="/calendar" className="btn btn-ic" style={{ padding: '6px 12px' }} title="Reset to today">Today</a>
            </div>
        </div>
    )
}
