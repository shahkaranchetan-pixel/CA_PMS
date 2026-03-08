"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [client, setClient] = useState<any>(null)

    useEffect(() => {
        if (!id) return;
        fetch(`/api/clients/${id}`)
            .then(res => res.json())
            .then(data => {
                setClient(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setError("Failed to load client details")
                setLoading(false)
            })
    }, [id])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSaving(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name"),
            entityType: formData.get("entityType"),
            gstin: formData.get("gstin"),
            pan: formData.get("pan"),
            tan: formData.get("tan"),
            contact: formData.get("contact"),
            active: formData.get("active") === "true",
            itxLogin: formData.get("itxLogin"),
            itxPassword: formData.get("itxPassword"),
            gstLogin: formData.get("gstLogin"),
            gstPassword: formData.get("gstPassword"),
            tracesLogin: formData.get("tracesLogin"),
            tracesPassword: formData.get("tracesPassword"),
            pfLogin: formData.get("pfLogin"),
            pfPassword: formData.get("pfPassword"),
            esiLogin: formData.get("esiLogin"),
            esiPassword: formData.get("esiPassword"),
            ptLogin: formData.get("ptLogin"),
            ptPassword: formData.get("ptPassword"),
        }

        try {
            const res = await fetch(`/api/clients/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                throw new Error("Failed to update client")
            }

            router.push(`/clients/${id}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: '20px', color: 'var(--muted)' }}>Loading client data...</div>
    if (!client) return <div style={{ padding: '20px', color: 'var(--danger)' }}>Client not found.</div>

    return (
        <div>
            <div className="topbar">
                <div>
                    <Link href={`/clients/${id}`} style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Client</Link>
                    <div className="ptitle">Edit Client: {client.name}</div>
                    <div className="psub">Update primary information and standard login vault</div>
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
                            <input type="text" id="name" name="name" defaultValue={client.name} required />
                        </div>
                        <div className="field">
                            <label htmlFor="entityType">Entity Type *</label>
                            <select id="entityType" name="entityType" defaultValue={client.entityType} required>
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
                            <label htmlFor="active">Client Status *</label>
                            <select id="active" name="active" defaultValue={client.active ? "true" : "false"}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="contact">Contact Person / Phone</label>
                            <input type="text" id="contact" name="contact" defaultValue={client.contact || ''} />
                        </div>

                        <div className="fdiv">Tax Identifiers</div>

                        <div className="field">
                            <label htmlFor="pan">PAN Number</label>
                            <input type="text" id="pan" name="pan" defaultValue={client.pan || ''} style={{ textTransform: 'uppercase' }} />
                        </div>
                        <div className="field">
                            <label htmlFor="tan">TAN Number</label>
                            <input type="text" id="tan" name="tan" defaultValue={client.tan || ''} style={{ textTransform: 'uppercase' }} />
                        </div>
                        <div className="field">
                            <label htmlFor="gstin">GSTIN</label>
                            <input type="text" id="gstin" name="gstin" defaultValue={client.gstin || ''} style={{ textTransform: 'uppercase' }} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="ctitle">
                        <span>🔐 Login Vault Initiation</span>
                        <span className="badge b-high" style={{ fontSize: '9px' }}>CONFIDENTIAL</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                        Leave passwords empty if you do not want to overwrite them.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#4FACFE', marginBottom: '8px' }}>🏦 Income Tax Portal</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="itxLogin" defaultValue={client.itxLogin || ''} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="text" name="itxPassword" defaultValue={client.itxPassword || ''} />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#B89AFF', marginBottom: '8px' }}>📊 GST Portal</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="gstLogin" defaultValue={client.gstLogin || ''} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="text" name="gstPassword" defaultValue={client.gstPassword || ''} />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#00CF84', marginBottom: '8px' }}>📋 Traces / TDS</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="tracesLogin" defaultValue={client.tracesLogin || ''} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="text" name="tracesPassword" defaultValue={client.tracesPassword || ''} />
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
                                    <input type="text" name="pfLogin" defaultValue={client.pfLogin || ''} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="text" name="pfPassword" defaultValue={client.pfPassword || ''} />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#FF6B6B', marginBottom: '8px' }}>🏥 ESI (ESIC)</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="esiLogin" defaultValue={client.esiLogin || ''} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="text" name="esiPassword" defaultValue={client.esiPassword || ''} />
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#4FACFE', marginBottom: '8px' }}>💼 Professional Tax (PT)</div>
                            <div className="fg">
                                <div className="field">
                                    <label>User ID</label>
                                    <input type="text" name="ptLogin" defaultValue={client.ptLogin || ''} />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input type="text" name="ptPassword" defaultValue={client.ptPassword || ''} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => router.back()} className="btn btn-g">Cancel</button>
                        <button type="submit" disabled={saving} className="btn btn-p">
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
