"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import PeriodSelector from "./PeriodSelector"
import { toast } from "react-hot-toast"

interface QuickTaskModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function QuickTaskModal({ isOpen, onClose }: QuickTaskModalProps) {
    const today = new Date();
    const prevMonthIdx = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
    const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
    const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [clients, setClients] = useState<any[]>([])
    const [title, setTitle] = useState("")
    const [period, setPeriod] = useState(`${MONTH_ABBRS[prevMonthIdx]}-${prevYear}`)
    const [notifyClient, setNotifyClient] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            fetch("/api/clients")
                .then(res => res.json())
                .then(data => setClients(Array.isArray(data) ? data : []))
                .catch(err => console.error("Failed to load clients", err))
        }
    }, [isOpen])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen, onClose])

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
            toast.error("Voice recognition is not supported in this browser.")
            return
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition
        const recognition = new SpeechRecognition()
        recognition.lang = 'en-IN'
        recognition.interimResults = false

        recognition.onstart = () => setIsListening(true)
        recognition.onend = () => setIsListening(false)
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setTitle(transcript)
        }

        recognition.start()
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            title: title,
            clientId: formData.get("clientId"),
            taskType: formData.get("taskType") || "OTHER",
            dueDate: formData.get("dueDate") || null,
            period: period,
            priority: "medium",
            frequency: "ONCE",
            notifyClient: notifyClient
        }

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to create task")
            }

            toast.success("Task created successfully and mail sent!")
            onClose()
            router.refresh()
            setTitle("")
        } catch (err: any) {
            setError(err.message)
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', backdropFilter: 'blur(4px)'
        }}>
            <div ref={modalRef} className="card" style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gold)' }}>⚡ Quick Task</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
                </div>

                {error && (
                    <div style={{ background: 'rgba(255,87,87,.1)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', border: '1px solid rgba(255,87,87,.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="fg">
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="modalClientId">Client Entity *</label>
                        <select id="modalClientId" name="clientId" required>
                            <option value="">Select a client...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="modalTitle">Task Title *</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                id="modalTitle"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="e.g. File GST Returns"
                                style={{ paddingRight: '40px', width: '100%' }}
                            />
                            <button
                                type="button"
                                onClick={startListening}
                                style={{
                                    position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                                    background: isListening ? 'var(--danger)' : 'var(--surface2)',
                                    border: 'none', borderRadius: '6px', width: '30px', height: '30px',
                                    color: isListening ? '#fff' : 'var(--gold)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Voice Dictation"
                            >
                                {isListening ? '🛑' : '🎤'}
                            </button>
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="modalTaskType">Type</label>
                        <select id="modalTaskType" name="taskType">
                            <option value="OTHER">Other Custom</option>
                            <option value="TDS_PAYMENT">TDS Payment</option>
                            <option value="GST_1">GSTR-1</option>
                            <option value="GSTR_3B">GSTR-3B</option>
                            <option value="ACCOUNTING">Accounting</option>
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="modalDueDate">Due Date</label>
                        <input type="date" id="modalDueDate" name="dueDate" required style={{ colorScheme: 'dark' }} />
                    </div>

                    <PeriodSelector value={period} onChange={setPeriod} />

                    <div className="field" style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: 'rgba(232,160,32,0.05)', borderRadius: '8px', border: '1px solid rgba(232,160,32,0.15)' }}>
                            <input 
                                type="checkbox" 
                                checked={notifyClient} 
                                onChange={e => setNotifyClient(e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold)' }}>📧 Notify Client via Email?</span>
                        </label>
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button type="submit" disabled={loading} className="btn btn-p" style={{ flex: 1, justifyContent: 'center' }}>
                            {loading ? "Creating..." : "Create Task"}
                        </button>
                    </div>

                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={() => { onClose(); router.push('/tasks/new'); }}
                            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                            Open Full Form for more options
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
