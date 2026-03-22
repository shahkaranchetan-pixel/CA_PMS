"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
    const { data: session } = useSession()
    const router = useRouter()

    const [config, setConfig] = useState({
        SMTP_HOST: '',
        SMTP_PORT: '',
        SMTP_USER: '',
        SMTP_PASS: '',
        EMAIL_FROM: '',
        FIRM_NAME: '',
        FIRM_ADDRESS: '',
        FIRM_LOGO: '',
        REMINDER_DAYS_BEFORE: '3',
        CRON_SECRET: '',
    })

    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (session?.user && (session.user as any).role !== "ADMIN") {
            router.push("/")
            return
        }

        // Fetch existing settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setConfig(prev => ({ ...prev, ...data }))
                }
            })
            .catch(console.error)
    }, [session, router])

    const handleSave = async () => {
        setSaving(true)
        setMessage('')

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })

            if (res.ok) {
                setMessage('Settings saved successfully!')
                setTimeout(() => setMessage(''), 3000)
            } else {
                setMessage('Error saving settings.')
            }
        } catch (error) {
            setMessage('Network error.')
        } finally {
            setSaving(false)
        }
    }

    if (!session) return null

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="topbar">
                <div className="ptitle">System Settings</div>
                <div className="psub">Global configuration for KCS TaskPro firm management</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                {/* Firm Profile */}
                <div className="card">
                    <div className="ctitle">🏢 Firm Profile</div>
                    <div className="fg">
                        <div className="field">
                            <label>Firm Name</label>
                            <input
                                type="text"
                                value={config.FIRM_NAME}
                                onChange={e => setConfig({ ...config, FIRM_NAME: e.target.value })}
                                placeholder="e.g. KCS & Associates"
                            />
                        </div>
                        <div className="field">
                            <label>Firm Address</label>
                            <textarea
                                value={config.FIRM_ADDRESS}
                                onChange={e => setConfig({ ...config, FIRM_ADDRESS: e.target.value })}
                                placeholder="Registered Office details"
                                style={{ height: '60px', borderRadius: '8px', padding: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', width: '100%', outline: 'none' }}
                            />
                        </div>
                        <div className="field">
                            <label>Logo URL</label>
                            <input
                                type="text"
                                value={config.FIRM_LOGO}
                                onChange={e => setConfig({ ...config, FIRM_LOGO: e.target.value })}
                                placeholder="Public image URL"
                            />
                        </div>
                    </div>
                </div>

                {/* Automation & Security */}
                <div className="card">
                    <div className="ctitle">🔐 Security & Automation</div>
                    <div className="fg">
                        <div className="field">
                            <label>Reminder Threshold (Days Before)</label>
                            <input
                                type="number"
                                value={config.REMINDER_DAYS_BEFORE}
                                onChange={e => setConfig({ ...config, REMINDER_DAYS_BEFORE: e.target.value })}
                                placeholder="3"
                            />
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Reminders trigger when deadline is within this range</div>
                        </div>
                        <div className="field">
                            <label>Cron Secret</label>
                            <input
                                type="text"
                                value={config.CRON_SECRET}
                                onChange={e => setConfig({ ...config, CRON_SECRET: e.target.value })}
                                placeholder="Vercel Cron Secret"
                            />
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Secures /api/reminders/cron from unauthorized calls</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="ctitle">📧 SMTP Email Configuration</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                    Configure the SMTP credentials here to enable automated email notifications.
                </div>

                <div className="fg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="field">
                        <label>SMTP Host</label>
                        <input
                            type="text"
                            value={config.SMTP_HOST}
                            onChange={e => setConfig({ ...config, SMTP_HOST: e.target.value })}
                            placeholder="e.g. smtp.gmail.com"
                        />
                    </div>
                    <div className="field">
                        <label>SMTP Port</label>
                        <input
                            type="text"
                            value={config.SMTP_PORT}
                            onChange={e => setConfig({ ...config, SMTP_PORT: e.target.value })}
                            placeholder="587"
                        />
                    </div>
                    <div className="field">
                        <label>SMTP User</label>
                        <input
                            type="text"
                            value={config.SMTP_USER}
                            onChange={e => setConfig({ ...config, SMTP_USER: e.target.value })}
                            placeholder="updates@yourfirm.com"
                        />
                    </div>
                    <div className="field">
                        <label>SMTP Password</label>
                        <input
                            type="password"
                            value={config.SMTP_PASS}
                            onChange={e => setConfig({ ...config, SMTP_PASS: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="field" style={{ marginTop: '16px' }}>
                    <label>Default "From" Address</label>
                    <input
                        type="text"
                        value={config.EMAIL_FROM}
                        onChange={e => setConfig({ ...config, EMAIL_FROM: e.target.value })}
                        placeholder="KCS Notifications <noreply@yourfirm.com>"
                    />
                </div>

                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={handleSave} disabled={saving} className="btn btn-p">
                        {saving ? 'Saving...' : '💾 Save All Settings'}
                    </button>
                    {message && (
                        <span style={{ fontSize: '13px', color: message.includes('Error') ? 'var(--danger)' : '#00CF84', fontWeight: 600 }}>
                            {message}
                        </span>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="ctitle">🤖 Reminder Automation</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                    Manually trigger the reminder scan for statutory tasks due in the next 3 days. 
                    This will send emails to clients for GSTR-1, GSTR-3B, TDS, and PF/ESI tasks if a contact email is set.
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                        onClick={async () => {
                            setSaving(true);
                            try {
                                const res = await fetch('/api/reminders/cron');
                                const data = await res.json();
                                if (data.success) {
                                    alert(`Successfully sent ${data.remindersSent} reminders.`);
                                } else {
                                    alert(`Error: ${data.error || 'Failed to send reminders'}`);
                                }
                            } catch (e) {
                                alert('Network error triggering reminders.');
                            } finally {
                                setSaving(false);
                            }
                        }} 
                        className="btn btn-g"
                        disabled={saving}
                    >
                        🚀 Trigger Manual Reminders
                    </button>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                        Note: It uses the SMTP settings above.
                    </div>
                </div>
            </div>
        </div>
    )
}
