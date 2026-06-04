"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"

function ResetPasswordForm() {
    const searchParams  = useSearchParams()
    const router        = useRouter()
    const token         = searchParams.get("token") || ""

    const [password, setPassword]   = useState("")
    const [confirm, setConfirm]     = useState("")
    const [loading, setLoading]     = useState(false)
    const [error, setError]         = useState("")
    const [success, setSuccess]     = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password.length < 8) {
            setError("Password must be at least 8 characters.")
            return
        }
        if (password !== confirm) {
            setError("Passwords do not match.")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            })
            const data = await res.json()

            if (res.ok) {
                setSuccess(true)
                setTimeout(() => router.push("/login"), 3000)
            } else {
                setError(data.error || "Something went wrong. Please try again.")
            }
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>❌</div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "10px" }}>Invalid link</div>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "24px" }}>This reset link is missing a token. Please request a new one.</div>
                <a href="/forgot-password" style={{ display: "inline-block", padding: "12px 24px", background: "var(--ca-saffron)", color: "#07101f", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
                    Request New Link
                </a>
            </div>
        )
    }

    if (success) {
        return (
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>✅</div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "10px" }}>Password updated!</div>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "24px" }}>Redirecting you to login...</div>
            </div>
        )
    }

    return (
        <>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                    Set new password
                </div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                    Choose a strong password (min. 8 characters).
                </div>
            </div>

            {error && (
                <div style={{ background: "rgba(255,87,87,.08)", border: "1px solid rgba(255,87,87,.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "20px", fontSize: "12.5px", color: "#FF5757", textAlign: "center" }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "7px" }}>
                        NEW PASSWORD
                    </label>
                    <input
                        type="password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", borderRadius: "10px", padding: "13px 16px", color: "var(--text)", fontFamily: "DM Sans, sans-serif", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = "var(--ca-saffron)"}
                        onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                </div>

                <div style={{ marginBottom: "26px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "7px" }}>
                        CONFIRM PASSWORD
                    </label>
                    <input
                        type="password"
                        placeholder="Re-enter password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        required
                        style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", borderRadius: "10px", padding: "13px 16px", color: "var(--text)", fontFamily: "DM Sans, sans-serif", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = "var(--ca-saffron)"}
                        onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: "100%", padding: "14px", background: "var(--ca-saffron)", color: "#07101f", border: "none", borderRadius: "10px", fontFamily: "DM Sans, sans-serif", fontSize: "15px", fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1, letterSpacing: ".5px" }}
                >
                    {loading ? "Updating..." : "Update Password →"}
                </button>
            </form>
        </>
    )
}

export default function ResetPasswordPage() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "20px" }}>
            <div style={{ position: "fixed", top: "-200px", right: "-200px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(243, 112, 33,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ width: "100%", maxWidth: "420px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "40px 36px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "200px", height: "3px", background: "linear-gradient(90deg, transparent, var(--ca-saffron), transparent)", borderRadius: "0 0 10px 10px" }} />

                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", fontWeight: 700, color: "var(--ca-saffron)", lineHeight: 1, marginBottom: "6px" }}>KCS TaskPro</div>
                    <div style={{ fontSize: "9px", color: "var(--muted)", letterSpacing: "3px", textTransform: "uppercase", fontWeight: 600 }}>PASSWORD RESET</div>
                </div>

                <Suspense fallback={<div style={{ textAlign: "center", color: "var(--muted)" }}>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    )
}
