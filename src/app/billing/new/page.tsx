"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewInvoicePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [clients, setClients] = useState<any[]>([])
    const [items, setItems] = useState([{ description: "", amount: "" }])

    useEffect(() => {
        fetch("/api/clients")
            .then(res => res.json())
            .then(data => setClients(Array.isArray(data) ? data : []))
            .catch(console.error)
    }, [])

    const handleAddItem = () => {
        setItems([...items, { description: "", amount: "" }])
    }

    const handleItemChange = (index: number, field: "description" | "amount", value: string) => {
        const newItems = [...items]
        newItems[index][field] = value
        setItems(newItems)
    }

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            clientId: formData.get("clientId"),
            number: formData.get("number"),
            date: formData.get("date"),
            dueDate: formData.get("dueDate"),
            notes: formData.get("notes"),
            items: items.map(i => ({ description: i.description, amount: parseFloat(i.amount) }))
        }

        try {
            const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to create invoice")
            }

            router.push("/billing")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

    return (
        <div>
            <div className="topbar">
                <div>
                    <Link href="/billing" style={{ color: 'var(--muted)', fontSize: '12.5px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Billing</Link>
                    <div className="ptitle">Draft New Invoice</div>
                    <div className="psub">Generate a professional invoice for a client</div>
                </div>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,87,87,.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,87,87,.2)', fontSize: '13px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="two-col">
                <div className="card">
                    <div className="ctitle">🧾 Invoice Parameters</div>

                    <div className="fg" style={{ marginTop: '16px' }}>
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="clientId">Client Entity *</label>
                            <select id="clientId" name="clientId" required>
                                <option value="">Select a client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="number">Invoice Number *</label>
                            <input type="text" id="number" name="number" required placeholder="e.g. INV-2026-001" defaultValue={`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`} />
                        </div>

                        <div className="field"></div>

                        <div className="field">
                            <label htmlFor="date">Issue Date *</label>
                            <input type="date" id="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ colorScheme: 'dark' }} />
                        </div>

                        <div className="field">
                            <label htmlFor="dueDate">Due Date *</label>
                            <input type="date" id="dueDate" name="dueDate" required style={{ colorScheme: 'dark' }} />
                        </div>

                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="notes">Notes / Special Instructions</label>
                            <textarea id="notes" name="notes" rows={3} placeholder="Thank you for your business!"></textarea>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="ctitle">📋 Line Items</div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                        {items.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <div className="field" style={{ flex: 1 }}>
                                    {index === 0 && <label>Service Description</label>}
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. GST Filing for August"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                    />
                                </div>
                                <div className="field" style={{ width: '120px' }}>
                                    {index === 0 && <label>Amount (₹)</label>}
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="0"
                                        value={item.amount}
                                        onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                                    />
                                </div>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn-ic"
                                        style={{ marginTop: index === 0 ? '22px' : '0' }}
                                        onClick={() => handleRemoveItem(index)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <button type="button" className="btn btn-g btn-sm" onClick={handleAddItem}>+ Add Item</button>
                    </div>

                    <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '16px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Playfair Display,serif', color: 'var(--gold)' }}>
                            ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => router.back()} className="btn btn-g">Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-p">
                            {loading ? "Generating..." : "Generate Invoice"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
