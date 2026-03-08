"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

export default function ProfilePage() {
    const { data: session } = useSession()
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const user = session?.user as any

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match")
            return
        }

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters")
            return
        }

        setLoading(true)

        try {
            const res = await fetch("/api/profile/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to update password")
            }

            setSuccess("Password updated successfully")
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return <div style={{ padding: '20px', color: 'var(--muted)' }}>Loading profile...</div>
    }

    return (
        <div>
            <div className="topbar">
                <div>
                    <div className="ptitle">My Profile</div>
                    <div className="psub">Manage your personal details and account security</div>
                </div>
            </div>

            <div className="two-col">
                <div className="card">
                    <div className="ctitle">👤 Personal Details</div>
                    <div className="fg" style={{ marginTop: '16px' }}>
                        <div className="field">
                            <label>Name</label>
                            <input type="text" value={user.name || ''} disabled style={{ background: 'var(--surface2)', cursor: 'not-allowed' }} />
                        </div>
                        <div className="field">
                            <label>Email Address</label>
                            <input type="text" value={user.email || ''} disabled style={{ background: 'var(--surface2)', cursor: 'not-allowed' }} />
                        </div>
                        <div className="field">
                            <label>Role</label>
                            <input type="text" value={user.role || 'EMPLOYEE'} disabled style={{ background: 'var(--surface2)', cursor: 'not-allowed' }} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="ctitle">🔐 Security / Change Password</div>

                    {error && (
                        <div style={{ background: 'rgba(255,87,87,.1)', color: 'var(--danger)', padding: '10px 12px', borderRadius: '8px', marginTop: '16px', border: '1px solid rgba(255,87,87,.2)', fontSize: '12px' }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ background: 'rgba(0,207,132,.1)', color: 'var(--success)', padding: '10px 12px', borderRadius: '8px', marginTop: '16px', border: '1px solid rgba(0,207,132,.2)', fontSize: '12px' }}>
                            ✅ {success}
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="fg" style={{ marginTop: '16px' }}>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label>Current Password *</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Enter current password"
                            />
                        </div>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label>New Password *</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                placeholder="Enter new password (min. 6 chars)"
                            />
                        </div>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label>Confirm New Password *</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Re-enter new password"
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button type="submit" disabled={loading || !currentPassword || !newPassword || !confirmPassword} className="btn btn-p">
                                {loading ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
