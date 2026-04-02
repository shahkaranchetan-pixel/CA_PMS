"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ModuleViewer({ params }: { params: { id: string } }) {
    const { data: session } = useSession()
    const userRole = (session?.user as any)?.role
    const router = useRouter()

    const [module, setModule] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState<any>(null)
    const [activeLessonIndex, setActiveLessonIndex] = useState(0)
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
        if (quizAnswers[key] !== undefined) return 

        setQuizAnswers(prev => ({ ...prev, [key]: chosenIndex }))

        if (chosenIndex === correctIndex) {
            setQuizScores(prev => ({
                ...prev,
                [materialId]: (prev[materialId] || 0) + 1
            }))
        }
    }

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>Preparing your training environment...</div>
    if (!module) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--danger)' }}>Module not found.</div>

    const activeMaterial = module.materials?.[activeLessonIndex]
    const materialsCount = module.materials?.length || 0

    const getHeroImage = (category: string) => {
        if (category === 'Tally') return '/images/tally_hero.png';
        if (category === 'Accounting') return '/images/accounting_hero.png';
        if (category === 'GST' || category === 'Income Tax') return '/images/voucher_hero.png';
        return null;
    }
    const heroImage = getHeroImage(module?.category);

    return (
        <div className="training-viewer-mode" style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: '#0B0D11', color: '#fff' }}>
            {/* Sidebar Navigation */}
            <div style={{ width: '300px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '24px', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
                <Link href="/training" style={{ color: 'var(--gold)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontWeight: 600 }}>
                    ← Back to Academy
                </Link>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>{module.category}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Module Outline</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {module.materials?.sort((a: any, b: any) => a.order - b.order).map((m: any, idx: number) => (
                        <button
                            key={m.id}
                            onClick={() => { setActiveLessonIndex(idx); setShowMaterialForm(false); }}
                            style={{
                                display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', borderRadius: '10px',
                                background: activeLessonIndex === idx ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                                border: '1px solid',
                                borderColor: activeLessonIndex === idx ? 'var(--gold)' : 'transparent',
                                color: activeLessonIndex === idx ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
                                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', width: '100%',
                            }}
                        >
                            <span style={{ opacity: 0.6 }}>{idx + 1}</span>
                            <span style={{ fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</span>
                            {m.type === 'QUIZ' ? '📝' : '📖'}
                        </button>
                    ))}

                    {userRole === 'ADMIN' && (
                        <button 
                            onClick={() => setShowMaterialForm(true)}
                            style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer' }}
                        >
                            + Add New Section
                        </button>
                    )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>OVERALL PROGRESS</div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--gold)', width: progress?.completed ? '100%' : `${((activeLessonIndex + 1) / materialsCount) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#0B0D11' }}>
                {!showMaterialForm && activeMaterial ? (
                    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                        {heroImage && (
                            <div style={{ marginBottom: '32px', borderRadius: '32px', overflow: 'hidden', height: '240px', position: 'relative', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <img src={heroImage} alt={module.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0B0D11 0%, transparent 100%)' }} />
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <div>
                                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: 0 }}>{activeMaterial.title}</h1>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                                    Section {activeLessonIndex + 1} of {materialsCount} • {activeMaterial.type === 'QUIZ' ? 'Assessment' : 'Lesson'}
                                </div>
                            </div>
                            {progress?.completed ? (
                                <div style={{ color: '#00CF84', background: 'rgba(0, 207, 132, 0.1)', padding: '8px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 700 }}>
                                    ✓ Training Completed
                                </div>
                            ) : activeLessonIndex === (materialsCount - 1) && (
                                <button onClick={handleMarkComplete} className="btn btn-p" style={{ padding: '10px 24px', borderRadius: '20px', fontSize: '14px', fontWeight: 700 }}>Finish Course</button>
                            )}
                        </div>

                        <div className="card glass-premium" style={{ padding: '48px', borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            {activeMaterial.type === 'TEXT' && (
                                <div className="markdown-reader">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {activeMaterial.content}
                                    </ReactMarkdown>
                                </div>
                            )}

                            {activeMaterial.type === 'LINK' && (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '64px', marginBottom: '24px' }}>📚</div>
                                    <h2 style={{ fontSize: '24px', color: '#fff' }}>Reference Manual</h2>
                                    <p style={{ color: 'var(--muted2)', marginBottom: '32px', fontSize: '16px' }}>This section contains external documentation or a practice workbook.</p>
                                    <a href={activeMaterial.content} target="_blank" rel="noopener noreferrer" className="btn btn-p" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', padding: '16px 32px', borderRadius: '16px' }}>
                                        Open External Resource ↗
                                    </a>
                                </div>
                            )}

                            {activeMaterial.type === 'QUIZ' && (
                                <div className="quiz-view">
                                    {(() => {
                                        let questions = [];
                                        try { questions = JSON.parse(activeMaterial.content); } catch (e) { return <div>Error loading quiz content.</div> }
                                        const score = quizScores[activeMaterial.id] || 0
                                        const allAnswered = questions.every((_: any, qid: number) => quizAnswers[`${activeMaterial.id}_${qid}`] !== undefined)

                                        return (
                                            <div>
                                                {questions.map((q: any, qIdx: number) => {
                                                    const chosen = quizAnswers[`${activeMaterial.id}_${qIdx}`]
                                                    const isCorrect = chosen === q.ans
                                                    return (
                                                        <div key={qIdx} style={{ marginBottom: '40px', padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', gap: '12px' }}>
                                                                <span style={{ color: 'var(--gold)', opacity: 0.8 }}>Q{qIdx + 1}</span> {q.q}
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                                {q.opts.map((opt: string, optIdx: number) => {
                                                                    let borderS = '1px solid var(--border)'
                                                                    let bgS = 'rgba(255,255,255,0.03)'
                                                                    if (chosen === optIdx) {
                                                                        borderS = isCorrect ? '2px solid #00CF84' : '2px solid #FF5757'
                                                                        bgS = isCorrect ? 'rgba(0, 207, 132, 0.1)' : 'rgba(255, 87, 87, 0.1)'
                                                                    } else if (chosen !== undefined && optIdx === q.ans) {
                                                                        borderS = '2px solid #00CF84'
                                                                        bgS = 'rgba(0, 207, 132, 0.05)'
                                                                    }
                                                                    return (
                                                                        <button 
                                                                            key={optIdx} 
                                                                            disabled={chosen !== undefined}
                                                                            onClick={() => handleQuizAnswer(activeMaterial.id, qIdx, optIdx, q.ans)}
                                                                            style={{ padding: '16px', borderRadius: '12px', border: borderS, background: bgS, color: '#fff', textAlign: 'left', cursor: chosen === undefined ? 'pointer' : 'default', transition: 'all 0.2s', fontSize: '14px' }}
                                                                        >
                                                                            {opt}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                            {chosen !== undefined && (
                                                                <div style={{ marginTop: '16px', fontSize: '13px', color: isCorrect ? '#00CF84' : '#FF5757', padding: '12px', background: isCorrect ? 'rgba(0,207,132,0.05)' : 'rgba(255,87,87,0.05)', borderRadius: '8px' }}>
                                                                    <strong>{isCorrect ? '✅ Correct' : '❌ Incorrect'}:</strong> {q.expl}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}

                                                {allAnswered && (
                                                    <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)', padding: '32px', borderRadius: '24px', textAlign: 'center', marginTop: '40px' }}>
                                                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>{score === questions.length ? '🌟' : '👏'}</div>
                                                        <h3 style={{ color: 'var(--gold)', margin: 0, fontSize: '24px' }}>Result: {score}/{questions.length}</h3>
                                                        <p style={{ color: 'var(--muted)', marginTop: '8px' }}>{score === questions.length ? 'Outstanding! You have mastered this module.' : 'Great effort! Review the explanations above to perfect your score.'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Pagination Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', alignItems: 'center' }}>
                            <button 
                                disabled={activeLessonIndex === 0}
                                onClick={() => setActiveLessonIndex(prev => prev - 1)}
                                style={{ background: 'none', border: 'none', color: activeLessonIndex === 0 ? 'transparent' : 'var(--muted)', cursor: activeLessonIndex === 0 ? 'default' : 'pointer', fontWeight: 600, fontSize: '14px' }}
                            >
                                ← Previous Lesson
                            </button>
                            
                            <div style={{ color: 'var(--muted2)', fontSize: '13px' }}>
                                Page {activeLessonIndex + 1} of {materialsCount}
                            </div>

                            {activeLessonIndex < (materialsCount - 1) ? (
                                <button 
                                    onClick={() => setActiveLessonIndex(prev => prev + 1)}
                                    className="btn btn-p" 
                                    style={{ borderRadius: '16px', padding: '12px 32px', fontSize: '15px', fontWeight: 700 }}
                                >
                                    Continue →
                                </button>
                            ) : (
                                <div style={{ width: '120px' }} />
                            )}
                        </div>
                    </div>
                ) : showMaterialForm ? (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div className="card glass-premium" style={{ padding: '40px', borderRadius: '24px' }}>
                            <h2 style={{ marginTop: 0 }}>Add Module Resource</h2>
                            <form onSubmit={handleAddMaterial}>
                                <div className="form-group"><label>Title</label><input type="text" value={newMaterial.title} onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })} required /></div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select value={newMaterial.type} onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value })}>
                                        <option value="TEXT">Text Explanation</option>
                                        <option value="LINK">External Link</option>
                                        <option value="VIDEO_EMBED">Video Embed Code</option>
                                        <option value="QUIZ">Interactive Quiz (JSON)</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Content Data</label><textarea value={newMaterial.content} onChange={e => setNewMaterial({ ...newMaterial, content: e.target.value })} required /></div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                                    <button type="button" onClick={() => setShowMaterialForm(false)} className="btn btn-g" style={{ flex: 1 }}>Cancel</button>
                                    <button type="submit" className="btn btn-p" style={{ flex: 1 }}>Add to Course</button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                        <h2>Checking Course Integrity...</h2>
                    </div>
                )}
            </div>

            <style jsx>{`
                .glass-premium { 
                    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); 
                    backdrop-filter: blur(20px); 
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                }
                .form-group { margin-bottom: 24px; }
                label { display: block; font-size: 11px; font-weight: 800; color: var(--gold); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
                input, select, textarea { width: 100%; padding: 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; background: rgba(0,0,0,0.3); color: #fff; font-size: 14px; }
                textarea { height: 250px; }
                
                .markdown-reader :global(h1) { color: var(--gold); font-size: 32px; margin-bottom: 24px; font-weight: 800; }
                .markdown-reader :global(h2) { color: #fff; font-size: 22px; margin: 48px 0 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; font-weight: 700; }
                .markdown-reader :global(h3) { color: var(--gold); font-size: 18px; margin: 32px 0 16px 0; font-weight: 600; }
                .markdown-reader :global(p) { line-height: 1.9; margin-bottom: 24px; color: rgba(255,255,255,0.8); font-size: 17px; }
                .markdown-reader :global(ul), .markdown-reader :global(ol) { margin-bottom: 24px; padding-left: 24px; }
                .markdown-reader :global(li) { margin-bottom: 14px; line-height: 1.7; color: rgba(255,255,255,0.8); }
                .markdown-reader :global(blockquote) { border-left: 5px solid var(--gold); background: rgba(212, 175, 55, 0.04); padding: 32px; margin: 40px 0; border-radius: 0 20px 20px 0; font-style: italic; }
                .markdown-reader :global(strong) { color: #fff; font-weight: 700; }
                .markdown-reader :global(code) { background: rgba(212, 175, 55, 0.1); color: var(--gold); padding: 4px 10px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
                .markdown-reader :global(hr) { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 60px 0; }
                .markdown-reader :global(table) { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 32px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
                .markdown-reader :global(th), .markdown-reader :global(td) { padding: 16px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .markdown-reader :global(th) { background: rgba(212, 175, 55, 0.1); color: var(--gold); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
                .markdown-reader :global(tr:last-child td) { border-bottom: none; }
                .markdown-reader :global(tr:nth-child(even)) { background: rgba(255,255,255,0.02); }
                
                .markdown-reader :global(details) { background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; margin-bottom: 24px; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); }
                .markdown-reader :global(summary) { font-weight: 700; color: var(--gold); outline: none; }
                .training-viewer-mode :global(.card) {
                    background: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    color: #fff !important;
                }
                .training-viewer-mode :global(.card.glass-premium) {
                    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%) !important;
                    backdrop-filter: blur(20px) !important;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5) !important;
                }
            `}</style>
        </div>
    )
}
