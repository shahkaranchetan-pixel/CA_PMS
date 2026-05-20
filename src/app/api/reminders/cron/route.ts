import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendTrackedEmail } from "@/lib/mailer"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization")
        const { searchParams } = new URL(req.url)
        const secret = searchParams.get("secret")
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret) {
            const isAuthorized = authHeader === `Bearer ${cronSecret}` || secret === cronSecret
            if (!isAuthorized) {
                return new NextResponse("Unauthorized", { status: 401 })
            }
        }

        const settingsRaw = await prisma.systemSetting.findMany()
        const settings: Record<string, string> = {}
        settingsRaw.forEach(setting => settings[setting.key] = setting.value)

        const reminderDays = Math.max(parseInt(settings.REMINDER_DAYS_BEFORE || "3", 10) || 3, 0)
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + reminderDays)

        const tasksToRemind = await prisma.task.findMany({
            where: {
                status: { in: ["PENDING", "IN_PROGRESS"] },
                dueDate: {
                    lte: targetDate,
                    gte: new Date(),
                },
                taskType: {
                    in: ["GST_1", "GSTR_1", "GSTR1", "GSTR_3B", "GSTR3B", "TDS_PAYMENT", "TDS_RETURN", "PF_ESI_PT"],
                },
                deletedAt: null,
            },
            include: { client: true },
        })

        if (tasksToRemind.length === 0) {
            return NextResponse.json({ message: "No reminders to send today", remindersSent: 0 })
        }

        const results: any[] = []
        await Promise.allSettled(tasksToRemind.map(async task => {
            if (!task.client?.contactEmail) return

            const message = await sendTrackedEmail({
                to: [{ email: task.client.contactEmail, name: task.client.contactPerson || task.client.name, clientId: task.clientId }],
                category: "REMINDER",
                clientId: task.clientId,
                taskId: task.id,
                subject: `Compliance Reminder: ${task.title} is due soon`,
                body: `Dear ${task.client.name},

This is a friendly reminder regarding your upcoming statutory compliance filing.

Task: ${task.title}
Due Date: ${task.dueDate?.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
Status: ${task.status}

Please ensure all necessary documents are shared with our team to avoid last-minute delays.

Regards,
KCS Team`,
            })

            results.push({ taskId: task.id, clientId: task.clientId, status: message.status })
        }))

        return NextResponse.json({ success: true, remindersSent: results.filter(item => item.status === "SENT").length, details: results })
    } catch (error: any) {
        console.error("Reminder Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
