import { sendTrackedEmail } from "@/lib/mailer"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { to, subject, content } = body

        if (!to || !content) {
            return NextResponse.json({ error: "To and Content are required" }, { status: 400 })
        }

        // Sanitize: strip all HTML tags to prevent XSS, then convert newlines to <br/>
        const cleanHtml = content.replace(/<[^>]*>/g, '').replace(/\n/g, '<br/>')
        
        const message = await sendTrackedEmail({
            senderId: (session.user as any)?.id,
            to: [{ email: to }],
            category: "REMINDER",
            subject: subject || "Tax Compliance Reminder - KCS Team",
            body: cleanHtml.replace(/<br\/>/g, "\n")
        })

        if (message.status === "FAILED") {
            throw new Error(message.failureReason || "Failed to send email. Check SMTP settings in the dashboard.")
        }

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        console.error("[SEND_REMINDER_ERROR]", error)
        return NextResponse.json({ error: error.message || "Failed to send reminder" }, { status: 500 })
    }
}
