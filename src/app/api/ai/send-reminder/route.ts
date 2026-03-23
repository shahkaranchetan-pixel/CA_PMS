import { sendEmail } from "@/lib/mailer"
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
        
        const success = await sendEmail({
            to,
            subject: subject || "Tax Compliance Reminder - KCS Team",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #E8A020;">KCS Practice Management</h2>
                    <div style="font-size: 15px; line-height: 1.6; color: #333;">
                        ${cleanHtml}
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">
                        This is a professional compliance reminder from KCS TaskPro.<br/>
                        Please contact us if you have any questions.
                    </p>
                </div>
            `
        })

        if (!success) {
            throw new Error("Failed to send email. Check SMTP settings in the dashboard.")
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[SEND_REMINDER_ERROR]", error)
        return NextResponse.json({ error: error.message || "Failed to send reminder" }, { status: 500 })
    }
}
