"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

export default function EditClientPage() {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState<any>({
        name: "",
        entityType: "Proprietorship",
        gstin: "",
        pan: "",
        tan: "",
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        active: true,
        itxLogin: "",
        itxPassword: "",
        gstLogin: "",
        gstPassword: "",
        tracesLogin: "",
        tracesPassword: "",
        pfLogin: "",
        pfPassword: "",
        esiLogin: "",
        esiPassword: "",
        ptLogin: "",
        ptPassword: "",
    })

    useEffect(() => {
        fetch(`/api/clients/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error)
                setFormData({
                    ...data,
                    itxPassword: data.itxPassword || "",
                    gstPassword: data.gstPassword || "",
                    tracesPassword: data.tracesPassword || "",
                    pfPassword: data.pfPassword || "",
                    esiPassword: data.esiPassword || "",
                    ptPassword: data.ptPassword || "",
                })
                setLoading(false)
            })
            .catch(err => {
                setError(err.message || "Failed to load client data")
                setLoading(false)
            })
    }, [id])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSaving(true)
        setError("")

        try {
            const res = await fetch(`/api/clients/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to update client")
            }

            router.push(`/clients/${id}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--muted)' }}>Loading client data...</div>

    return (
        <div>
            <div className="topbar">
                <div>
                    <Link href={`/clients/${id}`} style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Client Profile</Link>
                    <div className="ptitle">Edit Client: {formData.name}</div>
                    <div className="psub">Update entity details and login vault credentials</div>
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
                            <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} />
                        </div>
                        <div className="field">
                            <label htmlFor="entityType">Entity Type *</label>
                            <select id="entityType" name="entityType" required value={formData.entityType} onChange={handleChange}>
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
                             <label>Status</label>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0' }}>
                                 <input type="checkbox" name="active" id="active" checked={formData.active} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                                 <label htmlFor="active" style={{ textTransform: 'none', fontSize: '13px', color: 'var(--text)' }}>Active Client</label>
                             </div>
                        </div>
                        <div className="field">
                            <label htmlFor="contactPerson">Contact Person Name</label>
                            <input type="text" id="contactPerson" name="contactPerson" value={formData.contactPerson || ""} onChange={handleChange} />
                        </div>
                        <div className="field">
                            <label htmlFor="contactEmail">Contact Email</label>
                            <input type="email" id="contactEmail" name="contactEmail" value={formData.contactEmail || ""} onChange={handleChange} />
                        </div>
                        <div className="field">
                            <label htmlFor="contactPhone">Contact Phone</label>
                            <input type="text" id="contactPhone" name="contactPhone" value={formData.contactPhone || ""} onChange={handleChange} />
                        </div>

                        <div className="fdiv">Tax Identifiers</div>

                        <div className="field">
                            <label htmlFor="pan">PAN Number</label>
                            <input type="text" id="pan" name="pan" value={formData.pan || ""} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
                        </div>
                        <div className="field">
                            <label htmlFor="tan">TAN Number</label>
                            <input type="text" id="tan" name="tan" value={formData.tan || ""} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
                        </div>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="gstin">GSTIN</label>
                            <input type="text" id="gstin" name="gstin" value={formData.gstin || ""} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="ctitle">
                        <span>🔐 Login Vault Update</span>
                        <span className="badge b-high" style={{ fontSize: '9px' }}>SENSITIVE</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                        Leave password as <b>••••••••</b> to keep it unchanged.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#4FACFE', marginBottom: '8px' }}>🏦 Income Tax Portal</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="itxLogin" value={formData.itxLogin || ""} onChange={handleChange} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="itxPassword" value={formData.itxPassword || ""} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#B89AFF', marginBottom: '8px' }}>📊 GST Portal</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="gstLogin" value={formData.gstLogin || ""} onChange={handleChange} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="gstPassword" value={formData.gstPassword || ""} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#00CF84', marginBottom: '8px' }}>📋 Traces / TDS</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="tracesLogin" value={formData.tracesLogin || ""} onChange={handleChange} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="tracesPassword" value={formData.tracesPassword || ""} onChange={handleChange} />
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
                                    <input type="text" name="pfLogin" value={formData.pfLogin || ""} onChange={handleChange} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="pfPassword" value={formData.pfPassword || ""} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#FF6B6B', marginBottom: '8px' }}>🏥 ESI (ESIC)</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="esiLogin" value={formData.esiLogin || ""} onChange={handleChange} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="esiPassword" value={formData.esiPassword || ""} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#4FACFE', marginBottom: '8px' }}>💼 Professional Tax (PT)</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="ptLogin" value={formData.ptLogin || ""} onChange={handleChange} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="password" name="ptPassword" value={formData.ptPassword || ""} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => router.back()} className="btn btn-g">Cancel</button>
                        <button type="submit" disabled={saving} className="btn btn-p">
                            {saving ? "Saving Changes..." : "Update Client"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
