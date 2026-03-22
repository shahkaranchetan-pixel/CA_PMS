"use client"

import { useState, useEffect } from "react"

interface PeriodSelectorProps {
    value: string
    onChange: (value: string) => void
    label?: string
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function PeriodSelector({ value, onChange, label = "Applicable Period" }: PeriodSelectorProps) {
    const today = new Date();
    
    // Parse value (format: MMM-YYYY or empty)
    const initialMonthStr = value.split('-')[0] || "";
    const initialYearStr = value.split('-')[1] || today.getFullYear().toString();
    
    const [month, setMonth] = useState(initialMonthStr || MONTHS[today.getMonth() === 0 ? 11 : today.getMonth() - 1]);
    const [year, setYear] = useState(parseInt(initialYearStr) || (today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()));

    useEffect(() => {
        onChange(`${month}-${year}`)
    }, [month, year, onChange])

    const years = [];
    for (let i = today.getFullYear() - 2; i <= today.getFullYear() + 2; i++) {
        years.push(i);
    }

    return (
        <div className="field">
            <label>{label} *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                    style={{ flex: 1 }}
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)}
                >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select 
                    style={{ width: '100px' }}
                    value={year} 
                    onChange={(e) => setYear(parseInt(e.target.value))}
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
                Standard format: <strong>{month}-{year}</strong>
            </div>
        </div>
    )
}
