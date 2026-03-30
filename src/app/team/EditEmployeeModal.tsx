"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COLORS = [
    { hex: '#4FACFE', name: 'Sky Blue' },
    { hex: '#00CF84', name: 'Emerald' },
    { hex: '#E8A020', name: 'Gold' },
    { hex: '#FF5757', name: 'Coral' },
    { hex: '#9D50BB', name: 'Violet' },
    { hex: '#FFB020', name: 'Amber' },
    { hex: '#B89AFF', name: 'Lavender' },
    { hex: '#00D4FF', name: 'Cyan' },
];

const DEPTS = ['GST', 'Audit', 'Income Tax', 'TDS/TCS', 'MCA', 'Payroll', 'Accounts', 'General'];

export default function EditEmployeeModal({ member, onClose }: { member: any, onClose: () => void }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({
        name: member.name || "",
        email: member.email || "",
        role: member.role || "EMPLOYEE",
        dept: member.dept || "GST",
        phone: member.phone || "",
        color: member.color || "#4FACFE"
    });

    const initials = formData.name
        ? formData.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const handleChange = (field: string, value: string) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/users/${member.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                onClose();
                router.refresh();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to update employee");
            }
        } catch {
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/${member.id}`, { method: "DELETE" });
            if (res.ok) {
                onClose();
                router.refresh();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to delete employee");
                setShowDeleteConfirm(false);
            }
        } catch {
            alert("Something went wrong");
            setShowDeleteConfirm(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(4, 10, 22, 0.88)',
                zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                backdropFilter: 'blur(10px)',
                animation: 'eem-bg 0.2s ease'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '100%', maxWidth: '520px',
                    background: 'linear-gradient(145deg, #0c1829 0%, #0a1524 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
                    overflow: 'hidden',
                    animation: 'eem-in 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header strip */}
                <div style={{
                    background: 'linear-gradient(90deg, rgba(232,160,32,0.12) 0%, transparent 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    padding: '20px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '10px',
                            background: 'rgba(232,160,32,0.15)',
                            border: '1px solid rgba(232,160,32,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px'
                        }}>✏️</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Edit Employee</div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>Update profile details</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: '8px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer', color: 'var(--muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--text)'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--muted)'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                    >✕</button>
                </div>

                {/* Avatar Preview */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '20px 24px 0'
                }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '14px',
                        background: formData.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', fontWeight: 700, color: '#000',
                        boxShadow: `0 4px 20px ${formData.color}55`,
                        transition: 'all 0.3s ease',
                        flexShrink: 0
                    }}>
                        {initials}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                            {formData.name || 'Employee Name'}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                            <span style={{
                                fontSize: '10px', padding: '2px 8px', borderRadius: '99px', fontWeight: 700,
                                background: formData.role === 'ADMIN' ? 'rgba(232,160,32,0.15)' : 'rgba(79,172,254,0.12)',
                                color: formData.role === 'ADMIN' ? 'var(--gold)' : '#4FACFE',
                                border: `1px solid ${formData.role === 'ADMIN' ? 'rgba(232,160,32,0.3)' : 'rgba(79,172,254,0.25)'}`
                            }}>
                                {formData.role}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{formData.dept}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Section: Identity */}
                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(232,160,32,0.15)', paddingBottom: '6px' }}>
                        Identity
                    </div>

                    <div className="fg">
                        <div className="field">
                            <label>Full Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Ravi Sharma"
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label>Phone Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 9876543210"
                                value={formData.phone}
                                onChange={e => handleChange('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label>Email Address *</label>
                        <input
                            type="email"
                            required
                            placeholder="employee@gmail.com"
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                        />
                        <div style={{ fontSize: '10px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>ℹ️</span> Must match Gmail account for Google Sign-In
                        </div>
                    </div>

                    {/* Section: Access & Department */}
                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(232,160,32,0.15)', paddingBottom: '6px', marginTop: '4px' }}>
                        Access & Department
                    </div>

                    <div className="fg">
                        <div className="field">
                            <label>Role</label>
                            <select value={formData.role} onChange={e => handleChange('role', e.target.value)}>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Department</label>
                            <select value={formData.dept} onChange={e => handleChange('dept', e.target.value)}>
                                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                                <option value={formData.dept && !DEPTS.includes(formData.dept) ? formData.dept : '__custom__'} disabled={DEPTS.includes(formData.dept)}>
                                    {formData.dept && !DEPTS.includes(formData.dept) ? formData.dept : 'Other'}
                                </option>
                            </select>
                        </div>
                    </div>

                    {/* Section: Theme Color */}
                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(232,160,32,0.15)', paddingBottom: '6px', marginTop: '4px' }}>
                        Avatar Color
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {COLORS.map(c => (
                            <button
                                key={c.hex}
                                type="button"
                                title={c.name}
                                onClick={() => handleChange('color', c.hex)}
                                style={{
                                    width: '32px', height: '32px',
                                    borderRadius: '8px',
                                    background: c.hex,
                                    cursor: 'pointer',
                                    border: formData.color === c.hex
                                        ? '2.5px solid #fff'
                                        : '2.5px solid transparent',
                                    boxShadow: formData.color === c.hex
                                        ? `0 0 12px ${c.hex}99`
                                        : 'none',
                                    transform: formData.color === c.hex ? 'scale(1.15)' : 'scale(1)',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                            />
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginTop: '8px', paddingTop: '16px',
                        borderTop: '1px solid rgba(255,255,255,0.07)'
                    }}>
                        {!showDeleteConfirm ? (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn"
                                style={{
                                    background: 'rgba(255,87,87,0.08)',
                                    color: '#FF5757',
                                    border: '1px solid rgba(255,87,87,0.2)',
                                    fontSize: '12px'
                                }}
                                disabled={loading}
                            >
                                🗑 Delete
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', color: '#FF5757', fontWeight: 600 }}>Are you sure?</span>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="btn"
                                    style={{ background: '#FF5757', color: '#fff', border: 'none', fontSize: '11px', padding: '5px 10px' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Deleting...' : 'Yes, delete'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn btn-g"
                                    style={{ fontSize: '11px', padding: '5px 10px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={onClose} className="btn btn-g" disabled={loading}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-p"
                                disabled={loading}
                                style={{ minWidth: '110px', justifyContent: 'center' }}
                            >
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: 12, height: 12, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                        Saving...
                                    </span>
                                ) : '✓ Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes eem-bg { from { opacity: 0 } to { opacity: 1 } }
                @keyframes eem-in { from { opacity: 0; transform: scale(0.92) translateY(12px) } to { opacity: 1; transform: scale(1) translateY(0) } }
                @keyframes spin { to { transform: rotate(360deg) } }
            `}</style>
        </div>
    );
}
