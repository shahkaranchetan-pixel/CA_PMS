import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, wrapEmailHtml } from "@/lib/mailer"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        // Always return 200 to avoid leaking which emails are registered
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

        if (user) {
            // Invalidate any previous unused tokens for this email
            await prisma.passwordResetToken.updateMany({
                where: { email: user.email!, used: false },
                data: { used: true },
            })

            // Generate a secure random token (64 hex chars = 32 bytes)
            const token = crypto.randomBytes(32).toString("hex")
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

            await prisma.passwordResetToken.create({
                data: { token, email: user.email!, expiresAt },
            })

            const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

            const html = wrapEmailHtml(`
                <p>Hi <strong>${user.name || "there"}</strong>,</p>
                <p>We received a request to reset your password for <strong>KCS TaskPro</strong>.</p>
                <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
                <div style="text-align:center;margin:28px 0;">
                    <a href="${resetUrl}" style="
                        display:inline-block;
                        padding:13px 28px;
                        background:#E8A020;
                        color:#07101f;
                        border-radius:10px;
                        text-decoration:none;
                        font-weight:700;
                        font-size:15px;
                        letter-spacing:.4px;
                    ">Reset Password →</a>
                </div>
                <p style="font-size:12px;color:#667085;">
                    If you didn't request this, you can safely ignore this email.<br/>
                    The link will expire automatically after 1 hour.
                </p>
                <p>Regards,<br/><strong>KCS TaskPro</strong></p>
            `)

            await sendEmail({
                to: user.email!,
                subject: "Reset your KCS TaskPro password",
                html,
            })
        }

        // Always return the same response to prevent email enumeration
        return NextResponse.json({ message: "If that email is registered, a reset link has been sent." })
    } catch (error) {
        console.error("[FORGOT_PASSWORD_ERROR]", error)
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }
}
