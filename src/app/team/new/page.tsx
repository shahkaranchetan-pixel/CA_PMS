"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewEmployeePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
            role: formData.get("role"),
            dept: formData.get("dept"),
            phone: formData.get("phone"),
            color: formData.get("color"),
        }

        try {
            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to create employee")
            }

            router.push("/team")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="topbar">
                <div>
                    <Link href="/team" style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Team</Link>
                    <div className="ptitle">Onboard Employee</div>
                    <div className="psub">Add a new team member to your workspace</div>
                </div>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,87,87,.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,87,87,.2)', fontSize: '13px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="two-col">
                <div className="card">
                    <div className="ctitle">👤 Profile Information</div>

                    <div className="fg" style={{ marginTop: '16px' }}>
                        <div className="field">
                            <label htmlFor="name">Full Name *</label>
                            <input type="text" id="name" name="name" required placeholder="e.g. Rahul Sharma" />
                        </div>

                        <div className="field">
                            <label htmlFor="email">Email Address *</label>
                            <input type="email" id="email" name="email" required placeholder="name@capractice.com" />
                        </div>

                        <div className="field">
                            <label htmlFor="phone">Phone Number</label>
                            <input type="text" id="phone" name="phone" placeholder="+91 98765 43210" />
                        </div>

                        <div className="field">
                            <label htmlFor="color">Avatar Color</label>
                            <input type="color" id="color" name="color" defaultValue="#4FACFE" style={{ height: '42px', padding: '4px', background: 'var(--surface2)', borderRadius: '8px' }} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="ctitle">🔐 Access & Security</div>

                    <div className="fg" style={{ marginTop: '16px' }}>
                        <div className="field">
                            <label htmlFor="role">Platform Role *</label>
                            <select id="role" name="role" required>
                                <option value="EMPLOYEE">Standard Employee</option>
                                <option value="ADMIN">Administrator</option>
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="dept">Department</label>
                            <select id="dept" name="dept">
                                <option value="Audit">Audit</option>
                                <option value="Taxation">Taxation</option>
                                <option value="Compliance">Compliance</option>
                                <option value="Accounting">Accounting</option>
                                <option value="Admin">Admin / HR</option>
                            </select>
                        </div>

                        <div className="fdiv">Authentication</div>

                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="password">Temporary Password *</label>
                            <input type="text" id="password" name="password" required placeholder="Set a temporary password" />
                            <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px' }}>The employee will use this to sign in.</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => router.back()} className="btn btn-g">Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-p">
                            {loading ? "Creating..." : "Create Account"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
