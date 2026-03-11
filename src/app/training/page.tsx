"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function TrainingPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const userRole = (session?.user as any)?.role

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    const [modules, setModules] = useState<any[]>([])
    const [progress, setProgress] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [showAdminModal, setShowAdminModal] = useState(false)
    const [showAIModal, setShowAIModal] = useState(false)
    const [newModule, setNewModule] = useState({ title: '', category: 'Excel', description: '' })
    const [aiTopic, setAiTopic] = useState('')
    const [aiCategory, setAiCategory] = useState('Excel')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [modulesRes, progressRes] = await Promise.all([
                fetch('/api/training'),
                fetch('/api/training/progress')
            ])
            const modulesData = await modulesRes.json()
            const progressData = await progressRes.json()

            if (Array.isArray(modulesData)) setModules(modulesData)
            if (Array.isArray(progressData)) setProgress(progressData)
        } catch (error) {
            console.error("Fetch Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/training', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newModule)
            })
            if (res.ok) {
                setShowAdminModal(false)
                setNewModule({ title: '', category: 'Excel', description: '' })
                fetchData()
            }
        } catch (error) {
            console.error("Create Error:", error)
        }
    }

    const handleAIGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setGenerating(true)
        try {
            const res = await fetch('/api/training/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: aiCategory, topic: aiTopic })
            })
            if (res.ok) {
                setShowAIModal(false)
                setAiTopic('')
                fetchData()
            }
        } catch (error) {
            console.error("AI Error:", error)
        } finally {
            setGenerating(false)
        }
    }

    const handleDeleteModule = async (e: React.MouseEvent, id: string) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm("Are you sure you want to delete this module? This cannot be undone.")) return

        try {
            const res = await fetch(`/api/training/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchData()
            }
        } catch (error) {
            console.error("Delete Error:", error)
        }
    }

    const categories = Array.from(new Set(modules.map(m => m.category)))
    if (categories.length === 0 && !loading) categories.push('Excel', 'Tally', 'Zoho', 'Income Tax', 'GST')

    const getModuleProgress = (moduleId: string) => {
        const p = progress.find(pg => pg.moduleId === moduleId)
        return p?.completed ? 'COMPLETED' : 'IN_PROGRESS'
    }

    const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
        'Excel': ['Pivot Tables', 'Basic Formulas', 'VLOOKUP Mastery'],
        'GST': ['GSTR-1 Filing', 'GSTR-3B Filing', 'GST Rates & Slabs', 'E-Way Bill Process'],
        'Tally': ['Company Creation', 'Voucher Entry', 'GST Configuration'],
        'Income Tax': ['Residential Status', 'Due Dates', 'Salary Head Basics', 'TDS Basics'],
        'Audit': ['Bank Reconciliation'],
        'MCA': ['Company Incorporation', 'Annual Filings (MGT-7 & AOC-4)'],
        'PF_ESI': ['Monthly ECR Filing'],
        'Accounting': ['Golden Rules', 'Bank Reconciliation'],
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Staff Training Academy</h1>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>Master the tools and concepts of CA Practice</p>
                </div>
                {userRole === 'ADMIN' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setShowAIModal(true)} className="btn btn-g" style={{ color: 'var(--gold)', border: '1px solid var(--gold)' }}>✨ Generate with AI</button>
                        <button onClick={() => setShowAdminModal(true)} className="btn btn-p">+ Add Module</button>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading training modules...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {categories.map(cat => (
                        <div key={cat}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{getCategoryIcon(cat)}</span> {cat}
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                {modules.filter(m => m.category === cat).map(module => (
                                    <Link key={module.id} href={`/training/${module.id}`} className="card" style={{ textDecoration: 'none', transition: 'transform 0.2s', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: '0 0 8px 0' }}>{module.title}</h3>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {getModuleProgress(module.id) === 'COMPLETED' && (
                                                    <span style={{ color: '#00CF84', fontSize: '18px' }}>✅</span>
                                                )}
                                                {userRole === 'ADMIN' && (
                                                    <button
                                                        onClick={(e) => handleDeleteModule(e, module.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--danger)', padding: '4px' }}
                                                        title="Delete Module"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                                            {module.description || 'Learn the fundamentals of ' + module.title}
                                        </p>
                                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{module.materials?.length || 0} lessons</span>
                                            <span style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600 }}>Start Learning →</span>
                                        </div>
                                    </Link>
                                ))}
                                {modules.filter(m => m.category === cat).length === 0 && (
                                    <div style={{ padding: '20px', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--muted)', fontSize: '13px', textAlign: 'center' }}>
                                        No modules yet in this category.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAIModal && (
                <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '450px', padding: '28px', border: '2px solid var(--gold)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '24px' }}>✨</span>
                            <h2 style={{ margin: 0 }}>AI Course Generator</h2>
                        </div>
                        <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
                            Select a category and topic, and the system will automatically generate a complete curriculum for your staff.
                        </p>
                        <form onSubmit={handleAIGenerate}>
                            <div className="form-group">
                                <label>Target Category</label>
                                <select
                                    value={aiCategory}
                                    onChange={e => setAiCategory(e.target.value)}
                                >
                                    <option value="Excel">Excel</option>
                                    <option value="Tally">Tally</option>
                                    <option value="Zoho">Zoho</option>
                                    <option value="Income Tax">Basics of Income Tax</option>
                                    <option value="GST">Basics of GST</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Topic to Generate</label>
                                <input
                                    type="text"
                                    value={aiTopic}
                                    onChange={e => setAiTopic(e.target.value)}
                                    placeholder="e.g. Pivot Tables, GSTR-1, or Salary Head"
                                    required
                                />
                                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {CATEGORY_SUGGESTIONS[aiCategory]?.map(s => (
                                        <span
                                            key={s}
                                            onClick={() => setAiTopic(s)}
                                            style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--surface2)', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--border)' }}
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                                <button type="button" onClick={() => setShowAIModal(false)} className="btn btn-g" style={{ flex: 1 }} disabled={generating}>Cancel</button>
                                <button type="submit" className="btn btn-p" style={{ flex: 1, background: 'var(--gold)', color: '#000' }} disabled={generating}>
                                    {generating ? '✨ Generating...' : 'Generate Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdminModal && (
                <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px', padding: '24px' }}>
                        <h2 style={{ marginTop: 0 }}>Add New Module</h2>
                        <form onSubmit={handleCreateModule}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={newModule.title}
                                    onChange={e => setNewModule({ ...newModule, title: e.target.value })}
                                    placeholder="e.g. Pivot Tables in Excel"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={newModule.category}
                                    onChange={e => setNewModule({ ...newModule, category: e.target.value })}
                                >
                                    <option value="Excel">Excel</option>
                                    <option value="Tally">Tally</option>
                                    <option value="Zoho">Zoho</option>
                                    <option value="Income Tax">Basics of Income Tax</option>
                                    <option value="GST">Basics of GST</option>
                                    <option value="Other">Other Statutory Filings</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newModule.description}
                                    onChange={e => setNewModule({ ...newModule, description: e.target.value })}
                                    placeholder="Brief overview of what staff will learn..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowAdminModal(false)} className="btn btn-g" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-p" style={{ flex: 1 }}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .form-group { margin-bottom: 16px; }
                label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text); }
                input, select, textarea { 
                    width: 100%; 
                    padding: 10px; 
                    border: 1px solid var(--border); 
                    border-radius: 8px; 
                    background: var(--surface); 
                    color: var(--text);
                }
                textarea { height: 80px; resize: none; }
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                }
            `}</style>
        </div>
    )
}

function getCategoryIcon(cat: string) {
    switch (cat.toLowerCase()) {
        case 'excel': return '📊'
        case 'tally': return '📓'
        case 'zoho': return '☁️'
        case 'income tax': return '🏦'
        case 'audit': return '🔍'
        case 'mca': return '🏢'
        case 'pf_esi': return '👥'
        case 'accounting': return '📒'
        case 'gst': return '🏷️'
        default: return '📚'
    }
}
