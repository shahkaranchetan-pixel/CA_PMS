"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface MaterialItem {
    title: string
    type: 'TEXT' | 'LINK' | 'QUIZ'
    content: string
}

const EMPTY_MATERIAL: MaterialItem = { title: '', type: 'TEXT', content: '' }

const ALL_CATEGORIES = [
    { value: 'Excel', label: 'Excel' },
    { value: 'Tally', label: 'Tally' },
    { value: 'Zoho', label: 'Zoho' },
    { value: 'Income Tax', label: 'Basics of Income Tax' },
    { value: 'GST', label: 'Basics of GST' },
    { value: 'Audit', label: 'Audit' },
    { value: 'MCA', label: 'MCA / Company Law' },
    { value: 'PF_ESI', label: 'PF & ESI' },
    { value: 'Accounting', label: 'Accounting' },
    { value: 'Other', label: 'Other Statutory Filings' },
]

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
    const [showAIModal, setShowAIModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [aiTopic, setAiTopic] = useState('')
    const [aiCategory, setAiCategory] = useState('Excel')

    // Import modal state
    const [importStep, setImportStep] = useState(1)
    const [importSaving, setImportSaving] = useState(false)
    const [importModule, setImportModule] = useState({ title: '', category: 'Excel', description: '' })
    const [importMaterials, setImportMaterials] = useState<MaterialItem[]>([{ ...EMPTY_MATERIAL }])
    const [smartPasteText, setSmartPasteText] = useState('')
    const [showSmartPaste, setShowSmartPaste] = useState(false)
    const [showPromptHelper, setShowPromptHelper] = useState(false)
    const [promptCopied, setPromptCopied] = useState(false)

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

    // --- AI Generate handler (existing) ---
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
            } else {
                const data = await res.json()
                alert(data.error || "Generation failed. Please check your AI API keys in Vercel settings.")
            }
        } catch (error: any) {
            console.error("AI Error:", error)
            alert("Error: " + error.message)
        } finally {
            setGenerating(false)
        }
    }

    // --- Delete handler ---
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

    // --- Import Material Handlers ---
    const openImportModal = () => {
        setImportStep(1)
        setImportModule({ title: '', category: 'Excel', description: '' })
        setImportMaterials([{ ...EMPTY_MATERIAL }])
        setSmartPasteText('')
        setShowSmartPaste(false)
        setShowPromptHelper(false)
        setShowImportModal(true)
    }

    const addMaterial = () => {
        setImportMaterials([...importMaterials, { ...EMPTY_MATERIAL }])
    }

    const removeMaterial = (index: number) => {
        if (importMaterials.length <= 1) return
        setImportMaterials(importMaterials.filter((_, i) => i !== index))
    }

    const updateMaterial = (index: number, field: keyof MaterialItem, value: string) => {
        const updated = [...importMaterials]
        updated[index] = { ...updated[index], [field]: value }
        setImportMaterials(updated)
    }

    // --- Smart Paste: Parse structured text from external AI ---
    const handleSmartPaste = () => {
        if (!smartPasteText.trim()) return

        const text = smartPasteText.trim()
        const parsedMaterials: MaterialItem[] = []

        // Strategy 1: Try to parse as JSON first
        try {
            const jsonText = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
            const parsed = JSON.parse(jsonText)

            if (parsed.description && !importModule.description) {
                setImportModule({ ...importModule, description: parsed.description })
            }
            if (parsed.title && !importModule.title) {
                setImportModule(prev => ({ ...prev, title: parsed.title }))
            }

            const mats = parsed.materials || parsed.lessons || parsed.content
            if (Array.isArray(mats)) {
                mats.forEach((m: any) => {
                    parsedMaterials.push({
                        title: m.title || m.name || 'Untitled',
                        type: (m.type === 'LINK' ? 'LINK' : m.type === 'QUIZ' ? 'QUIZ' : 'TEXT') as 'TEXT' | 'LINK' | 'QUIZ',
                        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
                    })
                })
            }
        } catch {
            // Strategy 2: Parse structured text with headers
            // Look for patterns like "## Lesson 1: Title" or "### Title" or "**Title**"
            const sections = text.split(/(?=^#{1,3}\s+|\*\*[^*]+\*\*\s*\n)/m).filter(s => s.trim())

            if (sections.length > 1) {
                sections.forEach(section => {
                    const lines = section.trim().split('\n')
                    const headerLine = lines[0].replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '').trim()
                    const body = lines.slice(1).join('\n').trim()

                    if (headerLine && body) {
                        // Detect if it's a link
                        const urlMatch = body.match(/^https?:\/\/\S+$/)
                        parsedMaterials.push({
                            title: headerLine,
                            type: urlMatch ? 'LINK' : 'TEXT',
                            content: body
                        })
                    }
                })
            } else {
                // Strategy 3: Treat entire text as a single TEXT material
                parsedMaterials.push({
                    title: importModule.title || 'Imported Lesson',
                    type: 'TEXT',
                    content: text
                })
            }
        }

        if (parsedMaterials.length > 0) {
            // Replace empty materials or append
            const existingNonEmpty = importMaterials.filter(m => m.title.trim() || m.content.trim())
            setImportMaterials([...existingNonEmpty, ...parsedMaterials])
            setSmartPasteText('')
            setShowSmartPaste(false)
        }
    }

    // --- Save Import ---
    const handleImportSave = async () => {
        const validMaterials = importMaterials.filter(m => m.title.trim() && m.content.trim())
        if (!importModule.title.trim() || !importModule.category) {
            alert("Please provide a module title and category.")
            return
        }
        if (validMaterials.length === 0) {
            alert("Please add at least one lesson with title and content.")
            return
        }

        setImportSaving(true)
        try {
            const res = await fetch('/api/training', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: importModule.title,
                    category: importModule.category,
                    description: importModule.description,
                    materials: validMaterials
                })
            })
            if (res.ok) {
                setShowImportModal(false)
                fetchData()
            } else {
                const data = await res.json()
                alert(data.error || "Failed to save module.")
            }
        } catch (error: any) {
            console.error("Import Error:", error)
            alert("Error saving module: " + error.message)
        } finally {
            setImportSaving(false)
        }
    }

    // --- Prompt helper for external AI ---
    const getPromptTemplate = () => {
        const cat = importModule.category || '[CATEGORY]'
        const topic = importModule.title || '[TOPIC]'
        return `You are an expert Indian Chartered Accountant trainer.
Create a training module for CA staff on: "${topic}" (Category: "${cat}").

RULES:
- Create 2–4 text lessons, each under 300 words. Be practical and concise.
- Reference Indian tax laws (FY 2024-25) with section numbers where applicable.
- Include 1 quiz with 3 multiple-choice questions at the end.

Return ONLY this JSON (no markdown fences, no explanation):
{
  "title": "${topic}",
  "description": "One line description of the module",
  "materials": [
    { "title": "Lesson 1 Title", "type": "TEXT", "content": "Lesson body here..." },
    { "title": "Lesson 2 Title", "type": "TEXT", "content": "Lesson body here..." },
    { "title": "Assessment Quiz", "type": "QUIZ", "content": "[{\\"q\\":\\"Question?\\",\\"opts\\":[\\"A\\",\\"B\\",\\"C\\",\\"D\\"],\\"ans\\":0,\\"expl\\":\\"Explanation\\"}]" }
  ]
}`
    }

    const copyPrompt = () => {
        navigator.clipboard.writeText(getPromptTemplate())
        setPromptCopied(true)
        setTimeout(() => setPromptCopied(false), 2000)
    }

    const categories = Array.from(new Set(modules.map(m => m.category)))
    if (categories.length === 0 && !loading) categories.push('Excel', 'Tally', 'Zoho', 'Income Tax', 'GST')

    const getModuleProgress = (moduleId: string) => {
        const p = progress.find(pg => pg.moduleId === moduleId)
        return p?.completed ? 'COMPLETED' : 'IN_PROGRESS'
    }

    const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
        'Excel': ['Navigation Shortcuts', 'Formatting Shortcuts', 'Basic SUM \u0026 AVERAGE', 'VLOOKUP Mastery'],
        'GST': ['GSTR-1: Sales Entry', 'GSTR-3B: Payment \u0026 Offset', 'ITC Reversal Basics', 'E-Way Bill: Generation'],
        'Tally': ['Company Creation \u0026 Features', 'Voucher Entry: Sales/Purchase', 'Bank Rec in Tally'],
        'Income Tax': ['Residential Status: 182-Day Rule', 'Section 194C Contractor TDS', 'Salary Head Components'],
        'Audit': ['Bank Statement Check', 'Cash Verification Steps'],
        'MCA': ['Name Reservation Process', 'AOC-4 Filing Basics'],
        'PF_ESI': ['Monthly ECR Generation'],
        'Accounting': ['Three Golden Rules', 'Depreciation Basics'],
    }

    const validMaterialCount = importMaterials.filter(m => m.title.trim() && m.content.trim()).length

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Staff Training Academy</h1>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>Master the tools and concepts of CA Practice</p>
                </div>
                {userRole === 'ADMIN' && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => setShowAIModal(true)} className="btn btn-g" style={{ color: 'var(--gold)', border: '1px solid var(--gold)' }}>✨ Generate with AI</button>
                        <button onClick={openImportModal} className="btn btn-p" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📥 Import Material
                        </button>
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

            {/* ====== AI GENERATE MODAL (existing) ====== */}
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

            {/* ====== IMPORT TRAINING MATERIAL MODAL ====== */}
            {showImportModal && (
                <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card import-modal" style={{
                        width: '680px',
                        maxWidth: '95vw',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 0,
                        border: '2px solid var(--primary, #6366f1)'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '24px 28px 16px',
                            borderBottom: '1px solid var(--border)',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '20px', flexShrink: 0
                                }}>📥</div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Import Training Material</h2>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                                        Add content from ChatGPT, Gemini, Claude, or any AI tool
                                    </p>
                                </div>
                            </div>

                            {/* Step indicator */}
                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                {[
                                    { n: 1, label: 'Module Info' },
                                    { n: 2, label: 'Add Lessons' },
                                    { n: 3, label: 'Preview & Save' }
                                ].map(step => (
                                    <div key={step.n} style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <div style={{
                                            height: '4px',
                                            width: '100%',
                                            borderRadius: '4px',
                                            background: importStep >= step.n
                                                ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                                                : 'var(--border)',
                                            transition: 'background 0.3s ease'
                                        }} />
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: importStep === step.n ? 700 : 400,
                                            color: importStep >= step.n ? 'var(--text)' : 'var(--muted)',
                                            transition: 'all 0.3s ease'
                                        }}>{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>

                            {/* ---- STEP 1: Module Info ---- */}
                            {importStep === 1 && (
                                <div className="step-fade-in">
                                    <div className="form-group">
                                        <label>Module Title *</label>
                                        <input
                                            type="text"
                                            value={importModule.title}
                                            onChange={e => setImportModule({ ...importModule, title: e.target.value })}
                                            placeholder="e.g. Section 44AD Presumptive Taxation"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Category *</label>
                                        <select
                                            value={importModule.category}
                                            onChange={e => setImportModule({ ...importModule, category: e.target.value })}
                                        >
                                            {ALL_CATEGORIES.map(c => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={importModule.description}
                                            onChange={e => setImportModule({ ...importModule, description: e.target.value })}
                                            placeholder="Brief overview of what staff will learn..."
                                        />
                                    </div>

                                    {/* Prompt Helper */}
                                    <div style={{
                                        marginTop: '8px',
                                        padding: '16px',
                                        background: 'var(--surface2, rgba(99,102,241,0.05))',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <div
                                            onClick={() => setShowPromptHelper(!showPromptHelper)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                cursor: 'pointer', userSelect: 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '16px' }}>💡</span>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                                                    Need to generate content from ChatGPT / Gemini?
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '12px', color: 'var(--muted)', transform: showPromptHelper ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                                        </div>
                                        {showPromptHelper && (
                                            <div style={{ marginTop: '12px' }}>
                                                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 10px' }}>
                                                    Copy this prompt and paste it into ChatGPT, Gemini, Claude, or any AI tool. Then paste the response in Step 2 using &quot;Smart Paste&quot;.
                                                </p>
                                                <pre style={{
                                                    fontSize: '11px',
                                                    padding: '12px',
                                                    background: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                    maxHeight: '200px',
                                                    overflow: 'auto',
                                                    color: 'var(--text)',
                                                    lineHeight: 1.5
                                                }}>
                                                    {getPromptTemplate()}
                                                </pre>
                                                <button
                                                    type="button"
                                                    onClick={copyPrompt}
                                                    className="btn btn-g"
                                                    style={{
                                                        marginTop: '8px',
                                                        fontSize: '12px',
                                                        padding: '6px 16px',
                                                        background: promptCopied ? 'rgba(0,207,132,0.15)' : undefined,
                                                        color: promptCopied ? '#00CF84' : undefined,
                                                        border: promptCopied ? '1px solid #00CF84' : undefined
                                                    }}
                                                >
                                                    {promptCopied ? '✓ Copied to clipboard!' : '📋 Copy Prompt'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ---- STEP 2: Add Lessons ---- */}
                            {importStep === 2 && (
                                <div className="step-fade-in">
                                    {/* Smart Paste toggle */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowSmartPaste(!showSmartPaste)}
                                            className="btn btn-g"
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '12px 16px',
                                                background: showSmartPaste ? 'rgba(99,102,241,0.1)' : undefined,
                                                border: showSmartPaste ? '1px solid #6366f1' : undefined,
                                                borderRadius: '10px'
                                            }}
                                        >
                                            <span style={{ fontSize: '18px' }}>🪄</span>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 600 }}>Smart Paste — Auto-Parse AI Output</div>
                                                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                                    Paste the JSON response from ChatGPT/Gemini and it will auto-fill all lessons
                                                </div>
                                            </div>
                                        </button>

                                        {showSmartPaste && (
                                            <div style={{
                                                marginTop: '10px',
                                                padding: '16px',
                                                background: 'var(--surface2, rgba(99,102,241,0.05))',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <textarea
                                                    value={smartPasteText}
                                                    onChange={e => setSmartPasteText(e.target.value)}
                                                    placeholder={"Paste the AI response here...\n\nSupported formats:\n• JSON output from ChatGPT/Gemini/Claude\n• Structured text with headers (## or **bold**)\n• Plain text (will be added as single lesson)"}
                                                    style={{
                                                        width: '100%',
                                                        height: '140px',
                                                        resize: 'vertical',
                                                        fontFamily: 'monospace',
                                                        fontSize: '12px',
                                                        padding: '12px',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '8px',
                                                        background: 'var(--surface)',
                                                        color: 'var(--text)'
                                                    }}
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleSmartPaste}
                                                    className="btn btn-p"
                                                    style={{ marginTop: '8px', fontSize: '13px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                                    disabled={!smartPasteText.trim()}
                                                >
                                                    🪄 Parse & Auto-Fill Lessons
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>OR ADD MANUALLY</span>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                    </div>

                                    {/* Material entries */}
                                    {importMaterials.map((mat, idx) => (
                                        <div key={idx} style={{
                                            padding: '16px',
                                            marginBottom: '12px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--surface)',
                                            position: 'relative'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    color: 'var(--primary, #6366f1)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    Lesson {idx + 1}
                                                </span>
                                                {importMaterials.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMaterial(idx)}
                                                        style={{
                                                            background: 'none', border: 'none',
                                                            cursor: 'pointer', fontSize: '16px',
                                                            color: 'var(--danger)', padding: '2px 6px',
                                                            borderRadius: '4px'
                                                        }}
                                                        title="Remove lesson"
                                                    >×</button>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                <input
                                                    type="text"
                                                    value={mat.title}
                                                    onChange={e => updateMaterial(idx, 'title', e.target.value)}
                                                    placeholder="Lesson title"
                                                    style={{ flex: 1 }}
                                                />
                                                <select
                                                    value={mat.type}
                                                    onChange={e => updateMaterial(idx, 'type', e.target.value)}
                                                    style={{ width: '110px', flexShrink: 0 }}
                                                >
                                                    <option value="TEXT">📄 Text</option>
                                                    <option value="LINK">🔗 Link</option>
                                                    <option value="QUIZ">❓ Quiz</option>
                                                </select>
                                            </div>
                                            <textarea
                                                value={mat.content}
                                                onChange={e => updateMaterial(idx, 'content', e.target.value)}
                                                placeholder={
                                                    mat.type === 'LINK'
                                                        ? 'Paste URL here (e.g. https://...)'
                                                        : mat.type === 'QUIZ'
                                                            ? 'Paste quiz JSON: [{"q":"Question?","opts":["A","B","C","D"],"ans":0,"expl":"Why"}]'
                                                            : 'Paste or type the lesson content here...'
                                                }
                                                style={{
                                                    width: '100%',
                                                    height: mat.type === 'LINK' ? '40px' : '100px',
                                                    resize: 'vertical',
                                                    fontSize: '12px'
                                                }}
                                            />
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addMaterial}
                                        className="btn btn-g"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '2px dashed var(--border)',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        + Add Another Lesson
                                    </button>
                                </div>
                            )}

                            {/* ---- STEP 3: Preview & Save ---- */}
                            {importStep === 3 && (
                                <div className="step-fade-in">
                                    <div style={{
                                        padding: '20px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))',
                                        border: '1px solid var(--border)',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '16px' }}>{getCategoryIcon(importModule.category)}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary, #6366f1)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{importModule.category}</span>
                                        </div>
                                        <h3 style={{ margin: '8px 0 4px', fontSize: '18px', fontWeight: 700 }}>{importModule.title}</h3>
                                        {importModule.description && (
                                            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>{importModule.description}</p>
                                        )}
                                    </div>

                                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {validMaterialCount} Lesson{validMaterialCount !== 1 ? 's' : ''} to Import
                                    </h4>

                                    {importMaterials.filter(m => m.title.trim() && m.content.trim()).map((mat, idx) => (
                                        <div key={idx} style={{
                                            padding: '12px 16px',
                                            marginBottom: '8px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--surface)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}>
                                            <span style={{
                                                width: '28px', height: '28px',
                                                borderRadius: '8px',
                                                background: mat.type === 'QUIZ' ? 'rgba(245,158,11,0.15)' : mat.type === 'LINK' ? 'rgba(59,130,246,0.15)' : 'rgba(99,102,241,0.15)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '14px', flexShrink: 0
                                            }}>
                                                {mat.type === 'TEXT' ? '📄' : mat.type === 'LINK' ? '🔗' : '❓'}
                                            </span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{mat.title}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {mat.content.substring(0, 80)}{mat.content.length > 80 ? '...' : ''}
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: '10px', padding: '3px 8px',
                                                borderRadius: '6px',
                                                background: 'var(--surface2)',
                                                color: 'var(--muted)',
                                                fontWeight: 600,
                                                flexShrink: 0
                                            }}>{mat.type}</span>
                                        </div>
                                    ))}

                                    {validMaterialCount === 0 && (
                                        <div style={{
                                            padding: '24px',
                                            textAlign: 'center',
                                            color: 'var(--danger)',
                                            fontSize: '13px',
                                            border: '1px dashed var(--danger)',
                                            borderRadius: '10px'
                                        }}>
                                            ⚠️ No valid lessons found. Go back and add at least one lesson with a title and content.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 28px',
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10px',
                            flexShrink: 0
                        }}>
                            <button
                                type="button"
                                onClick={() => {
                                    if (importStep === 1) setShowImportModal(false)
                                    else setImportStep(importStep - 1)
                                }}
                                className="btn btn-g"
                                style={{ minWidth: '100px' }}
                                disabled={importSaving}
                            >
                                {importStep === 1 ? 'Cancel' : '← Back'}
                            </button>

                            {importStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (importStep === 1 && !importModule.title.trim()) {
                                            alert("Please enter a module title.")
                                            return
                                        }
                                        setImportStep(importStep + 1)
                                    }}
                                    className="btn btn-p"
                                    style={{ minWidth: '140px' }}
                                >
                                    Next Step →
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleImportSave}
                                    className="btn btn-p"
                                    style={{
                                        minWidth: '160px',
                                        background: validMaterialCount > 0 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : undefined,
                                        opacity: validMaterialCount > 0 ? 1 : 0.5
                                    }}
                                    disabled={importSaving || validMaterialCount === 0}
                                >
                                    {importSaving ? '⏳ Saving...' : `✅ Save Module (${validMaterialCount} lessons)`}
                                </button>
                            )}
                        </div>
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
                    font-size: 13px;
                    box-sizing: border-box;
                }
                input:focus, select:focus, textarea:focus {
                    outline: none;
                    border-color: var(--primary, #6366f1);
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
                }
                textarea { height: 80px; resize: none; }
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                }
                .step-fade-in {
                    animation: stepIn 0.3s ease-out;
                }
                @keyframes stepIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .import-modal::-webkit-scrollbar { width: 6px; }
                .import-modal::-webkit-scrollbar-track { background: transparent; }
                .import-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
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
