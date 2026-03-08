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
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="ctitle">📧 SMTP Email Configuration</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                    Configure the SMTP credentials here to enable the application to send automated email notifications to clients and team members.
                    If left blank, the system will only generate in-app notifications.
                </div>

                <div className="fg" style={{ maxWidth: '500px' }}>
                    <div className="field">
                        <label>SMTP Host</label>
                        <input
                            type="text"
                            name="SMTP_HOST"
                            value={config.SMTP_HOST}
                            onChange={e => setConfig({ ...config, SMTP_HOST: e.target.value })}
                            placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                        />
                    </div>

                    <div className="field">
                        <label>SMTP Port</label>
                        <input
                            type="text"
                            name="SMTP_PORT"
                            value={config.SMTP_PORT}
                            onChange={e => setConfig({ ...config, SMTP_PORT: e.target.value })}
                            placeholder="e.g. 587 or 465"
                        />
                    </div>

                    <div className="field">
                        <label>SMTP User / Email</label>
                        <input
                            type="text"
                            name="SMTP_USER"
                            value={config.SMTP_USER}
                            onChange={e => setConfig({ ...config, SMTP_USER: e.target.value })}
                            placeholder="e.g. updates@yourfirm.com"
                        />
                    </div>

                    <div className="field">
                        <label>SMTP Password / App Password</label>
                        <input
                            type="password"
                            name="SMTP_PASS"
                            value={config.SMTP_PASS}
                            onChange={e => setConfig({ ...config, SMTP_PASS: e.target.value })}
                            placeholder="Enter password"
                        />
                    </div>

                    <div className="field">
                        <label>Default "From" Address</label>
                        <input
                            type="text"
                            name="EMAIL_FROM"
                            value={config.EMAIL_FROM}
                            onChange={e => setConfig({ ...config, EMAIL_FROM: e.target.value })}
                            placeholder="e.g. TaskDesk Notifications <noreply@yourfirm.com>"
                        />
                    </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={handleSave} disabled={saving} className="btn btn-p">
                        {saving ? 'Saving...' : '💾 Save Configuration'}
                    </button>
                    {message && (
                        <span style={{ fontSize: '13px', color: message.includes('Error') ? 'var(--danger)' : '#00CF84', fontWeight: 600 }}>
                            {message}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
