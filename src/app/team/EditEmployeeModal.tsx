"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditEmployeeModal({ member, onClose }: { member: any, onClose: () => void }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: member.name || "",
        email: member.email || "",
        role: member.role || "EMPLOYEE",
        dept: member.dept || "GST",
        phone: member.phone || "",
        color: member.color || "#4FACFE"
    });

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
                const error = await res.json();
                alert(error.error || "Failed to update employee");
            }
        } catch (error) {
            console.error("Update error:", error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${member.name}? This will remove all their task assignments.`)) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/users/${member.id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                onClose();
                router.refresh();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to delete employee");
            }
        } catch (error) {
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <div 
                className="card" 
                style={{ width: '100%', maxWidth: '500px', padding: '24px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="ctitle" style={{ fontSize: '18px', marginBottom: 0 }}>⚙️ Edit Employee Details</div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="field">
                        <label>Full Name *</label>
                        <input 
                            type="text" 
                            required 
                            value={formData.name} 
                            onChange={e => setFormData({ ...formData, name: e.target.value })} 
                        />
                    </div>

                    <div className="field">
                        <label>Email Address *</label>
                        <input 
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={e => setFormData({ ...formData, email: e.target.value })} 
                        />
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Must match Gmail ID for Google Login</div>
                    </div>

                    <div className="fg">
                        <div className="field">
                            <label>Role</label>
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="EMPLOYEE">Employee (Standard View)</option>
                                <option value="ADMIN">Admin (Full Control)</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Department</label>
                            <input 
                                type="text" 
                                placeholder="e.g. GST, Audit"
                                value={formData.dept} 
                                onChange={e => setFormData({ ...formData, dept: e.target.value })} 
                            />
                        </div>
                    </div>

                    <div className="fg">
                        <div className="field">
                            <label>Phone Number</label>
                            <input 
                                type="text" 
                                value={formData.phone} 
                                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                            />
                        </div>
                        <div className="field">
                            <label>Theme Color</label>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                {['#E8A020', '#4FACFE', '#00CF84', '#FF5757', '#9D50BB', '#FFB020'].map(c => (
                                    <div 
                                        key={c} 
                                        onClick={() => setFormData({ ...formData, color: c })}
                                        style={{ 
                                            width: '24px', height: '24px', borderRadius: '4px', background: c, 
                                            cursor: 'pointer', border: formData.color === c ? '2px solid #fff' : 'none',
                                            boxShadow: formData.color === c ? '0 0 10px rgba(255,255,255,0.4)' : 'none'
                                        }} 
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                        <button 
                            type="button" 
                            onClick={handleDelete} 
                            className="btn btn-g" 
                            style={{ color: '#FF5757' }}
                            disabled={loading}
                        >
                            Delete Employee
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={onClose} className="btn btn-g">Cancel</button>
                            <button type="submit" className="btn btn-p" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
