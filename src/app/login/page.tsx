"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Invalid email or password")
            } else {
                window.location.href = "/"
            }
        } catch (err) {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            padding: '20px'
        }}>
            {/* Background decorations */}
            <div style={{
                position: 'fixed', top: '-200px', right: '-200px',
                width: '600px', height: '600px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(232,160,32,0.06) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'fixed', bottom: '-300px', left: '-200px',
                width: '700px', height: '700px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(79,172,254,0.04) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />

            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '40px 36px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Top glow */}
                <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '200px', height: '3px',
                    background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
                    borderRadius: '0 0 10px 10px'
                }} />

                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '32px',
                        fontWeight: 700,
                        color: 'var(--gold)',
                        lineHeight: 1,
                        marginBottom: '6px'
                    }}>
                        KCS TaskPro
                    </div>
                    <div style={{
                        fontSize: '9px',
                        color: 'var(--muted)',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        fontWeight: 600
                    }}>
                        PRACTICE MANAGEMENT SUITE
                    </div>
                </div>

                {/* Welcome text */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '22px',
                        fontWeight: 600,
                        color: 'var(--text)',
                        marginBottom: '6px'
                    }}>
                        Welcome Back
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        Sign in to your practice workspace
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: 'rgba(255,87,87,.08)',
                        border: '1px solid rgba(255,87,87,.2)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '20px',
                        fontSize: '12.5px',
                        color: '#FF5757',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'var(--muted)',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            marginBottom: '7px'
                        }}>
                            EMAIL
                        </label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,.04)',
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
                                padding: '13px 16px',
                                color: 'var(--text)',
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color .2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>

                    <div style={{ marginBottom: '26px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'var(--muted)',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            marginBottom: '7px'
                        }}>
                            PASSWORD
                        </label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,.04)',
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
                                padding: '13px 16px',
                                color: 'var(--text)',
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color .2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'var(--gold)',
                            color: '#07101f',
                            border: 'none',
                            borderRadius: '10px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: loading ? 'wait' : 'pointer',
                            transition: 'all .2s',
                            opacity: loading ? 0.7 : 1,
                            letterSpacing: '.5px'
                        }}
                    >
                        {loading ? "Signing in..." : "Sign In →"}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '16px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>OR</div>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--surface2)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        transition: 'all .2s'
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--surface2)'; (e.target as HTMLElement).style.borderColor = 'var(--gold)' }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = 'var(--surface2)'; (e.target as HTMLElement).style.borderColor = 'var(--border)' }}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" />
                    Sign in with Google
                </button>

                <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    fontSize: '11px',
                    color: 'var(--muted)',
                    lineHeight: 1.6
                }}>
                    <div>Admin & Employee accounts supported</div>
                    <div style={{ marginTop: '4px', color: 'var(--muted)', opacity: .5 }}>
                        KCS TaskPro · {new Date().getFullYear()}
                    </div>
                </div>
            </div>
        </div>
    )
}
