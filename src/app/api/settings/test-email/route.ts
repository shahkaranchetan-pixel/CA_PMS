import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { sendTrackedEmail } from "@/lib/mailer"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
    try {
        const { user, error } = await requireAuth("ADMIN")
        if (error) return error

        const body = await request.json()
        const to = body.to || user.email

        if (!to) {
            return NextResponse.json({ error: "A recipient email is required" }, { status: 400 })
        }

        const message = await sendTrackedEmail({
            senderId: user.id,
            category: "TEST",
            subject: "KCS TaskPro test email",
            body: "This is a test email from KCS TaskPro. Your SMTP configuration is working if this message arrives.",
            to: [{ email: to, name: "Test recipient" }],
        })

        if (message.status === "FAILED") {
            return NextResponse.json({ error: message.failureReason || "Test email failed", message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message })
    } catch (error: any) {
        console.error("[TEST_EMAIL_ERROR]", error)
        return NextResponse.json({ error: error.message || "Failed to send test email" }, { status: 500 })
    }
}
