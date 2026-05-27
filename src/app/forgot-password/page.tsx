"use client"

import { useState } from "react"

export default function ForgotPasswordPage() {
    const [email, setEmail]     = useState("")
    const [loading, setLoading] = useState(false)
    const [sent, setSent]       = useState(false)
    const [error, setError]     = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            if (res.ok) {
                setSent(true)
            } else {
                const data = await res.json()
                setError(data.error || "Something went wrong. Please try again.")
            }
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg)",
            padding: "20px",
        }}>
            {/* Background decorations */}
            <div style={{ position: "fixed", top: "-200px", right: "-200px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(232,160,32,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "fixed", bottom: "-300px", left: "-200px", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,172,254,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{
                width: "100%",
                maxWidth: "420px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "40px 36px",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Top glow */}
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "200px", height: "3px", background: "linear-gradient(90deg, transparent, var(--gold), transparent)", borderRadius: "0 0 10px 10px" }} />

                {/* Brand */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", fontWeight: 700, color: "var(--gold)", lineHeight: 1, marginBottom: "6px" }}>
                        KCS TaskPro
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "3px", textTransform: "uppercase", fontWeight: 600 }}>
                        PASSWORD RESET
                    </div>
                </div>

                {sent ? (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>📧</div>
                        <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "10px" }}>
                            Check your inbox
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "28px" }}>
                            If <strong>{email}</strong> is registered, you'll receive a reset link shortly. Check your spam folder too.
                        </div>
                        <a href="/login" style={{ display: "inline-block", padding: "12px 28px", background: "var(--gold)", color: "#07101f", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
                            Back to Login
                        </a>
                    </div>
                ) : (
                    <>
                        <div style={{ textAlign: "center", marginBottom: "28px" }}>
                            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                                Forgot your password?
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                                Enter your email and we'll send you a reset link.
                            </div>
                        </div>

                        {error && (
                            <div style={{ background: "rgba(255,87,87,.08)", border: "1px solid rgba(255,87,87,.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "20px", fontSize: "12.5px", color: "#FF5757", textAlign: "center" }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "7px" }}>
                                    EMAIL
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", borderRadius: "10px", padding: "13px 16px", color: "var(--text)", fontFamily: "DM Sans, sans-serif", fontSize: "14px", outline: "none", transition: "border-color .2s", boxSizing: "border-box" }}
                                    onFocus={e => e.target.style.borderColor = "var(--gold)"}
                                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{ width: "100%", padding: "14px", background: "var(--gold)", color: "#07101f", border: "none", borderRadius: "10px", fontFamily: "DM Sans, sans-serif", fontSize: "15px", fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1, letterSpacing: ".5px" }}
                            >
                                {loading ? "Sending..." : "Send Reset Link →"}
                            </button>
                        </form>

                        <div style={{ textAlign: "center", marginTop: "20px" }}>
                            <a href="/login" style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none" }}>
                                ← Back to Login
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
