"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewClientPage() {
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
            entityType: formData.get("entityType"),
            gstin: formData.get("gstin"),
            pan: formData.get("pan"),
            contact: formData.get("contact"),
            itxLogin: formData.get("itxLogin"),
            itxPassword: formData.get("itxPassword"),
            gstLogin: formData.get("gstLogin"),
            gstPassword: formData.get("gstPassword"),
            tracesLogin: formData.get("tracesLogin"),
            tracesPassword: formData.get("tracesPassword"),
            ptLogin: formData.get("ptLogin"),
            ptPassword: formData.get("ptPassword"),
        }

        try {
            const res = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                throw new Error("Failed to create client")
            }

            router.push("/clients")
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
                    <Link href="/clients" style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Clients</Link>
                    <div className="ptitle">Onboard New Client</div>
                    <div className="psub">Add basic details and login credentials to the vault</div>
                </div>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,87,87,.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,87,87,.2)', fontSize: '13px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="two-col">
                <div className="card">
                    <div className="ctitle">🏢 Primary Information</div>
                    <div className="fg" style={{ marginTop: '16px' }}>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="name">Entity Name *</label>
                            <input type="text" id="name" name="name" required placeholder="e.g. Acme Industries Ltd" />
                        </div>
                        <div className="field">
                            <label htmlFor="entityType">Entity Type *</label>
                            <select id="entityType" name="entityType" required>
                                <option value="Proprietorship">Proprietorship</option>
                                <option value="Partnership">Partnership</option>
                                <option value="LLP">LLP</option>
                                <option value="Pvt Ltd">Private Limited (Pvt Ltd)</option>
                                <option value="Public Limited">Public Limited</option>
                                <option value="HUF">HUF</option>
                                <option value="Trust/Society">Trust/Society</option>
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="contact">Contact Person / Phone</label>
                            <input type="text" id="contact" name="contact" placeholder="e.g. John Doe - 9876543210" />
                        </div>

                        <div className="fdiv">Tax Identifiers</div>

                        <div className="field">
                            <label htmlFor="pan">PAN Number</label>
                            <input type="text" id="pan" name="pan" placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} />
                        </div>
                        <div className="field">
                            <label htmlFor="tan">TAN Number</label>
                            <input type="text" id="tan" name="tan" placeholder="ABCD12345E" style={{ textTransform: 'uppercase' }} />
                        </div>
                        <div className="field">
                            <label htmlFor="gstin">GSTIN</label>
                            <input type="text" id="gstin" name="gstin" placeholder="22AAAAA0000A1Z5" style={{ textTransform: 'uppercase' }} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="ctitle">
                        <span>🔐 Login Vault Initiation</span>
                        <span className="badge b-high" style={{ fontSize: '9px' }}>OPTIONAL</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                        You can also add other custom logins (e.g. MCA, MSME) from the client's profile page later.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#4FACFE', marginBottom: '8px' }}>🏦 Income Tax Portal</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="itxLogin" placeholder="Enter ID" />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="itxPassword" placeholder="Enter Password" />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#B89AFF', marginBottom: '8px' }}>📊 GST Portal</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="gstLogin" placeholder="Enter ID" />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="gstPassword" placeholder="Enter Password" />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#00CF84', marginBottom: '8px' }}>📋 Traces / TDS</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="tracesLogin" placeholder="Enter ID" />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="tracesPassword" placeholder="Enter Password" />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '12px', fontSize: '10px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1.5px', textTransform: 'uppercase', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                            Labour & Statutory
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFB020', marginBottom: '8px' }}>🏛️ PF (EPFO)</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="pfLogin" placeholder="Enter ID" />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="pfPassword" placeholder="Enter Password" />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#FF6B6B', marginBottom: '8px' }}>🏥 ESI (ESIC)</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="esiLogin" placeholder="Enter ID" />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="esiPassword" placeholder="Enter Password" />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#4FACFE', marginBottom: '8px' }}>💼 Professional Tax (PT)</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="ptLogin" placeholder="Enter ID" />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="ptPassword" placeholder="Enter Password" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => router.back()} className="btn btn-g">Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-p">
                            {loading ? "Saving..." : "Create Client"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
