"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ModuleViewer({ params }: { params: { id: string } }) {
    const { data: session } = useSession()
    const userRole = (session?.user as any)?.role
    const router = useRouter()

    const [module, setModule] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState<any>(null)
    const [showMaterialForm, setShowMaterialForm] = useState(false)
    const [newMaterial, setNewMaterial] = useState({ title: '', type: 'TEXT', content: '', order: 0 })

    // Quiz states
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({}) // materialId_qIndex -> chosenIndex
    const [quizScores, setQuizScores] = useState<Record<string, number>>({}) // materialId -> score

    useEffect(() => {
        fetchModule()
        fetchProgress()
    }, [params.id])

    const fetchModule = async () => {
        try {
            const res = await fetch(`/api/training/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setModule(data)
            }
        } catch (error) {
            console.error("Fetch Module Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchProgress = async () => {
        try {
            const res = await fetch('/api/training/progress')
            if (res.ok) {
                const data = await res.json()
                const p = data.find((pg: any) => pg.moduleId === params.id)
                setProgress(p)
            }
        } catch (error) {
            console.error("Fetch Progress Error:", error)
        }
    }

    const handleMarkComplete = async () => {
        try {
            const res = await fetch('/api/training/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId: params.id, completed: true })
            })
            if (res.ok) {
                fetchProgress()
            }
        } catch (error) {
            console.error("Update Progress Error:", error)
        }
    }

    const handleAddMaterial = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch(`/api/training/${params.id}/materials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMaterial)
            })
            if (res.ok) {
                setShowMaterialForm(false)
                setNewMaterial({ title: '', type: 'TEXT', content: '', order: module.materials?.length || 0 })
                fetchModule()
            }
        } catch (error) {
            console.error("Add Material Error:", error)
        }
    }

    const handleQuizAnswer = (materialId: string, qIndex: number, chosenIndex: number, correctIndex: number) => {
        const key = `${materialId}_${qIndex}`
        if (quizAnswers[key] !== undefined) return // Prevents re-answering

        setQuizAnswers(prev => ({ ...prev, [key]: chosenIndex }))

        // Update score if correct
        if (chosenIndex === correctIndex) {
            setQuizScores(prev => ({
                ...prev,
                [materialId]: (prev[materialId] || 0) + 1
            }))
        }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading module...</div>
    if (!module) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Module not found.</div>

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <Link href="/training" style={{ color: 'var(--gold)', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                    ← Back to Academy
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>{module.category}</span>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: '4px 0 8px 0' }}>{module.title}</h1>
                        <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0 }}>{module.description}</p>
                    </div>
                    {progress?.completed ? (
                        <div style={{ background: 'rgba(0, 207, 132, 0.1)', color: '#00CF84', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>✅</span> Completed
                        </div>
                    ) : (
                        <button onClick={handleMarkComplete} className="btn btn-p">Mark as Completed</button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                {module.materials?.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '16px', background: 'var(--surface)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>📚</div>
                        <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '4px' }}>No lessons yet</div>
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
                            {userRole === 'ADMIN' ? 'Start adding materials to this module.' : 'Content for this module is coming soon.'}
                        </div>
                    </div>
                ) : (
                    module.materials.map((material: any, index: number) => (
                        <div key={material.id} className="card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                                    {index + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>{material.title}</h3>

                                    {material.type === 'TEXT' && (
                                        <div style={{ color: 'var(--text)', fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                            {material.content}
                                        </div>
                                    )}

                                    {material.type === 'LINK' && (
                                        <div style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>EXTERNAL RESOURCE</div>
                                            <a href={material.content} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                🔗 Click here to open Resource <span style={{ fontSize: '12px' }}>↗</span>
                                            </a>
                                        </div>
                                    )}

                                    {material.type === 'VIDEO_EMBED' && (
                                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', background: '#000' }} dangerouslySetInnerHTML={{ __html: material.content }} />
                                    )}

                                    {material.type === 'QUIZ' && (
                                        <div className="quiz-section">
                                            {(() => {
                                                const questions = JSON.parse(material.content)
                                                const score = quizScores[material.id] || 0
                                                const totalQ = questions.length
                                                const allAnswered = questions.every((_: any, idx: number) => quizAnswers[`${material.id}_${idx}`] !== undefined)

                                                return (
                                                    <div style={{ background: 'var(--surface2)', padding: '20px', borderRadius: '12px' }}>
                                                        {questions.map((q: any, qIdx: number) => {
                                                            const chosen = quizAnswers[`${material.id}_${qIdx}`]
                                                            const isCorrect = chosen === q.ans

                                                            return (
                                                                <div key={qIdx} style={{ marginBottom: '24px' }}>
                                                                    <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '15px' }}>{qIdx + 1}. {q.q}</p>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                                        {q.opts.map((opt: string, optIdx: number) => {
                                                                            let bg = 'var(--surface)'
                                                                            let border = 'var(--border)'
                                                                            let color = 'var(--text)'

                                                                            if (chosen === optIdx) {
                                                                                bg = isCorrect ? 'rgba(0, 207, 132, 0.1)' : 'rgba(255, 87, 87, 0.1)'
                                                                                border = isCorrect ? '#00CF84' : '#FF5757'
                                                                                color = isCorrect ? '#00CF84' : '#FF5757'
                                                                            } else if (chosen !== undefined && optIdx === q.ans) {
                                                                                bg = 'rgba(0, 207, 132, 0.05)'
                                                                                border = 'rgba(0, 207, 132, 0.2)'
                                                                                color = '#00CF84'
                                                                            }

                                                                            return (
                                                                                <button
                                                                                    key={optIdx}
                                                                                    onClick={() => handleQuizAnswer(material.id, qIdx, optIdx, q.ans)}
                                                                                    disabled={chosen !== undefined}
                                                                                    style={{
                                                                                        padding: '12px',
                                                                                        borderRadius: '8px',
                                                                                        border: `1px solid ${border}`,
                                                                                        background: bg,
                                                                                        color: color,
                                                                                        textAlign: 'left',
                                                                                        fontSize: '14px',
                                                                                        cursor: chosen === undefined ? 'pointer' : 'default',
                                                                                        transition: 'all 0.2s'
                                                                                    }}
                                                                                >
                                                                                    {opt}
                                                                                </button>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                    {chosen !== undefined && (
                                                                        <div style={{ marginTop: '10px', fontSize: '13px', color: isCorrect ? '#00CF84' : '#FF5757', fontWeight: 500 }}>
                                                                            {isCorrect ? '✓ Correct!' : '✗ Wrong.'} <span style={{ color: 'var(--muted)' }}>{q.expl}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                        {allAnswered && (
                                                            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '8px', background: 'var(--gold-dim)', textAlign: 'center' }}>
                                                                <h4 style={{ margin: '0 0 8px 0', color: 'var(--gold)' }}>Quiz Result</h4>
                                                                <div style={{ fontSize: '24px', fontWeight: 700 }}>{score} / {totalQ}</div>
                                                                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--muted)' }}>
                                                                    {score === totalQ ? 'Perfect! You are an expert.' : 'Good job! Review the explanations above.'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {userRole === 'ADMIN' && (
                    <div style={{ marginTop: '24px' }}>
                        {!showMaterialForm ? (
                            <button onClick={() => setShowMaterialForm(true)} className="btn btn-g" style={{ width: '100%', padding: '16px', borderStyle: 'dashed' }}>
                                + Add Lesson Material
                            </button>
                        ) : (
                            <div className="card" style={{ padding: '24px' }}>
                                <h3 style={{ marginTop: 0 }}>Add New Material</h3>
                                <form onSubmit={handleAddMaterial}>
                                    <div className="form-group">
                                        <label>Material Title</label>
                                        <input
                                            type="text"
                                            value={newMaterial.title}
                                            onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                                            placeholder="e.g. Setting up Company in Tally"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Type</label>
                                        <select
                                            value={newMaterial.type}
                                            onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value })}
                                        >
                                            <option value="TEXT">Text Explanation</option>
                                            <option value="LINK">External Link</option>
                                            <option value="VIDEO_EMBED">Video Embed Code</option>
                                            <option value="QUIZ">Interactive Quiz (JSON)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Content</label>
                                        <textarea
                                            value={newMaterial.content}
                                            onChange={e => setNewMaterial({ ...newMaterial, content: e.target.value })}
                                            placeholder={
                                                newMaterial.type === 'TEXT' ? "Detailed step-by-step instructions..." :
                                                    newMaterial.type === 'QUIZ' ? '[{"q":"Q1?","opts":["A","B"],"ans":0,"expl":"Why..."}]' :
                                                        "Paste URL or Embed Code here..."
                                            }
                                            required
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="button" onClick={() => setShowMaterialForm(false)} className="btn btn-g" style={{ flex: 1 }}>Cancel</button>
                                        <button type="submit" className="btn btn-p" style={{ flex: 1 }}>Save Material</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
                textarea { height: 120px; resize: vertical; }
            `}</style>
        </div>
    )
}
