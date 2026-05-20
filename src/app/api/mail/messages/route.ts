import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { sendTrackedEmail } from "@/lib/mailer"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { user, error } = await requireAuth()
        if (error) return error

        const messages = await prisma.emailMessage.findMany({
            where: user.role === "ADMIN" ? {} : { senderId: user.id },
            include: {
                sender: { select: { id: true, name: true, email: true } },
                client: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } },
                recipients: { orderBy: { createdAt: "asc" } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error("[MAIL_MESSAGES_GET_ERROR]", error)
        return NextResponse.json({ error: "Failed to fetch mail" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { user, error } = await requireAuth()
        if (error) return error

        const body = await request.json()
        const { subject, body: messageBody, recipients, category, clientId, taskId } = body

        if (!subject || !messageBody || !Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json({ error: "Subject, body, and recipients are required" }, { status: 400 })
        }

        const message = await sendTrackedEmail({
            senderId: user.id,
            subject,
            body: messageBody,
            category,
            clientId: clientId || null,
            taskId: taskId || null,
            to: recipients,
        })

        return NextResponse.json(message, { status: 201 })
    } catch (error: any) {
        console.error("[MAIL_MESSAGES_POST_ERROR]", error)
        return NextResponse.json({ error: error.message || "Failed to send mail" }, { status: 500 })
    }
}
