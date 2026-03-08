"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const CATEGORIES = [
    { id: 'PAN', label: 'PAN Card', icon: '🆔' },
    { id: 'TAN', label: 'TAN Certificate', icon: '📋' },
    { id: 'GST_CERT', label: 'GST Certificate', icon: '📊' },
    { id: 'PARTNER_KYC', label: 'Partner KYC', icon: '👤' },
    { id: 'DIRECTOR_KYC', label: 'Director KYC', icon: '👤' },
    { id: 'COI', label: 'Certificate of Incorporation', icon: '🏛️' },
    { id: 'MOA', label: 'Memorandum of Association', icon: '📜' },
    { id: 'AOA', label: 'Articles of Association', icon: '📜' },
    { id: 'PARTNERSHIP_DEED', label: 'Partnership Deed', icon: '🤝' },
    { id: 'BOARD_RESOLUTION', label: 'Board Resolution', icon: '📑' },
    { id: 'BANK_STATEMENT', label: 'Bank Statement', icon: '🏦' },
    { id: 'ADDRESS_PROOF', label: 'Address Proof', icon: '🏠' },
    { id: 'OTHER', label: 'Other Document', icon: '📄' },
]

interface DocSectionProps {
    clientId: string
    documents: { id: string; category: string; fileName: string; filePath: string; fileSize: number | null; notes: string | null; uploadedAt: string }[]
}

export default function DocumentUploadSection({ clientId, documents }: DocSectionProps) {
    const router = useRouter()
    const [showUpload, setShowUpload] = useState(false)
    const [category, setCategory] = useState("OTHER")
    const [notes, setNotes] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const handleUpload = async () => {
        if (!file) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("category", category)
            formData.append("notes", notes)

            const res = await fetch(`/api/clients/${clientId}/documents`, {
                method: "POST",
                body: formData
            })
            if (res.ok) {
                setFile(null); setCategory("OTHER"); setNotes(""); setShowUpload(false)
                router.refresh()
            }
        } catch (err) { console.error(err) }
        finally { setUploading(false) }
    }

    const handleDelete = async (docId: string) => {
        if (!confirm("Remove this document?")) return
        try {
            await fetch(`/api/clients/${clientId}/documents`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ docId })
            })
            router.refresh()
        } catch (err) { console.error(err) }
    }

    const formatSize = (bytes: number | null) => {
        if (!bytes) return '—'
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1048576).toFixed(1)} MB`
    }

    const getCatLabel = (id: string) => CATEGORIES.find(c => c.id === id) || { label: id, icon: '📄' }

    // Group docs by category
    const grouped: Record<string, typeof documents> = {}
    documents.forEach(d => {
        if (!grouped[d.category]) grouped[d.category] = []
        grouped[d.category].push(d)
    })

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div className="ctitle" style={{ margin: 0 }}>📁 Company Permanent Files</div>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="btn btn-p"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                    {showUpload ? '✕ Cancel' : '📤 Upload Document'}
                </button>
            </div>

            {/* Upload Form */}
            {showUpload && (
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="field">
                            <label>Document Category *</label>
                            <select value={category} onChange={e => setCategory(e.target.value)}>
                                {CATEGORIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label>Notes (Optional)</label>
                            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Director 1 - Aadhaar Card" />
                        </div>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label>Choose File *</label>
                            <input
                                type="file"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 11px', color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', fontSize: '12px', width: '100%' }}
                            />
                            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
                                Accepted: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX · Max 10MB
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button onClick={handleUpload} disabled={uploading || !file} className="btn btn-p" style={{ fontSize: '12px', padding: '7px 16px' }}>
                            {uploading ? 'Uploading...' : '📤 Upload'}
                        </button>
                    </div>
                </div>
            )}

            {/* Documents list grouped by category */}
            {documents.length === 0 && !showUpload ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📁</div>
                    No documents uploaded yet. Upload PAN, TAN, GST certificates, and KYC documents.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.keys(grouped).map(cat => {
                        const catInfo = getCatLabel(cat)
                        const docs = grouped[cat]
                        return (
                            <div key={cat}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{catInfo.icon}</span> {catInfo.label}
                                </div>
                                {docs.map(doc => (
                                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '4px' }}>
                                        <div style={{ width: '34px', height: '34px', background: 'rgba(79,172,254,.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                                            {doc.fileName.endsWith('.pdf') ? '📕' : doc.fileName.match(/\.(jpg|jpeg|png)$/i) ? '🖼️' : '📄'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {doc.fileName}
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                                                <span>{formatSize(doc.fileSize)}</span>
                                                <span>{new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                {doc.notes && <span style={{ fontStyle: 'italic' }}>📝 {doc.notes}</span>}
                                            </div>
                                        </div>
                                        <a href={doc.filePath} target="_blank" rel="noreferrer" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                                            View
                                        </a>
                                        <button onClick={() => handleDelete(doc.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '13px', padding: '4px' }} title="Delete">
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
