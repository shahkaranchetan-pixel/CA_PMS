import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, wrapEmailHtml } from "@/lib/mailer"

export const dynamic = "force-dynamic"

/**
 * Daily Digest Cron — fires every day at 3:30 AM UTC (9:00 AM IST)
 * 
 * - Each employee receives a personalized email listing their pending tasks
 * - Admin receives a consolidated summary of all staff pending work
 * 
 * Protected by CRON_SECRET env variable.
 * Call: GET /api/cron/daily-digest?secret=<CRON_SECRET>
 *       or with header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
    try {
        // ── Security Check ──────────────────────────────────────────────
        const authHeader = req.headers.get("authorization")
        const { searchParams } = new URL(req.url)
        const secret = searchParams.get("secret")
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret) {
            const isAuthorized =
                authHeader === `Bearer ${cronSecret}` || secret === cronSecret
            if (!isAuthorized) {
                return new NextResponse("Unauthorized", { status: 401 })
            }
        }

        // ── Fetch all pending/in-progress tasks with assignees + client ──
        const pendingTasks = await prisma.task.findMany({
            where: {
                deletedAt: null,
                status: { in: ["PENDING", "IN_PROGRESS"] },
            },
            include: {
                client: { select: { name: true } },
                taskAssignees: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, role: true },
                        },
                    },
                },
            },
            orderBy: { dueDate: "asc" },
        })

        // ── Fetch SMTP config + admin user ───────────────────────────────
        const [settingsRaw, adminUser] = await Promise.all([
            prisma.systemSetting.findMany(),
            prisma.user.findFirst({
                where: { role: "ADMIN" },
                select: { id: true, name: true, email: true },
                orderBy: { createdAt: "asc" },
            }),
        ])

        const settings: Record<string, string> = {}
        settingsRaw.forEach((s) => (settings[s.key] = s.value))
        const firmName = settings.FIRM_NAME || "KCS TaskPro"

        const today = new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Kolkata",
        })

        const results: {
            type: "employee" | "admin"
            email: string
            name: string
            taskCount: number
            status: "sent" | "skipped" | "failed"
            reason?: string
        }[] = []

        // ── 1. Employee Digests ──────────────────────────────────────────
        // Group tasks by employee
        const tasksByEmployee = new Map<
            string,
            { user: { id: string; name: string | null; email: string | null }; tasks: typeof pendingTasks }
        >()

        for (const task of pendingTasks) {
            for (const ta of task.taskAssignees) {
                if (!ta.user || ta.user.role === "ADMIN") continue
                if (!tasksByEmployee.has(ta.user.id)) {
                    tasksByEmployee.set(ta.user.id, { user: ta.user, tasks: [] })
                }
                tasksByEmployee.get(ta.user.id)!.tasks.push(task)
            }
        }

        await Promise.allSettled(
            Array.from(tasksByEmployee.values()).map(async ({ user, tasks }) => {
                if (!user.email) {
                    results.push({
                        type: "employee",
                        email: "(no email)",
                        name: user.name || "Unknown",
                        taskCount: tasks.length,
                        status: "skipped",
                        reason: "No email address",
                    })
                    return
                }

                const taskRows = tasks
                    .map((t) => {
                        const due = t.dueDate
                            ? t.dueDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
                            : "No due date"
                        const statusBadge =
                            t.status === "IN_PROGRESS"
                                ? `<span style="color:#E8A020;font-weight:600;">In Progress</span>`
                                : `<span style="color:#e53e3e;font-weight:600;">Pending</span>`
                        return `
                        <tr>
                            <td style="padding:8px 12px;border-bottom:1px solid #EAECF0;">${t.title}</td>
                            <td style="padding:8px 12px;border-bottom:1px solid #EAECF0;">${t.client?.name || "—"}</td>
                            <td style="padding:8px 12px;border-bottom:1px solid #EAECF0;">${due}</td>
                            <td style="padding:8px 12px;border-bottom:1px solid #EAECF0;">${statusBadge}</td>
                        </tr>`
                    })
                    .join("")

                const html = wrapEmailHtml(`
                    <p>Hi <strong>${user.name || "there"}</strong>,</p>
                    <p>Here is your daily pending task update for <strong>${today}</strong>.</p>
                    <p>You have <strong>${tasks.length}</strong> pending task(s) assigned to you:</p>
                    <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
                        <thead>
                            <tr style="background:#F5F7FA;">
                                <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #E8A020;color:#172033;">Task</th>
                                <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #E8A020;color:#172033;">Client</th>
                                <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #E8A020;color:#172033;">Due Date</th>
                                <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #E8A020;color:#172033;">Status</th>
                            </tr>
                        </thead>
                        <tbody>${taskRows}</tbody>
                    </table>
                    <p style="margin-top:20px;">Please update the status of your tasks in <a href="${process.env.NEXTAUTH_URL || ""}" style="color:#E8A020;">KCS TaskPro</a> once completed.</p>
                    <p>Regards,<br/><strong>${firmName}</strong></p>
                `)

                const sent = await sendEmail({
                    to: user.email,
                    subject: `📋 Your Daily Task Update — ${today} (${tasks.length} pending)`,
                    html,
                })

                results.push({
                    type: "employee",
                    email: user.email,
                    name: user.name || "Unknown",
                    taskCount: tasks.length,
                    status: sent ? "sent" : "failed",
                })
            })
        )

        // ── 2. Admin Consolidated Digest ─────────────────────────────────
        if (adminUser?.email) {
            // Build grouped view: employee → their tasks
            const employeeGroups = Array.from(tasksByEmployee.values())

            // Also collect unassigned tasks
            const unassignedTasks = pendingTasks.filter(
                (t) => t.taskAssignees.length === 0
            )

            let adminBody = `
                <p>Hi <strong>${adminUser.name || "Admin"}</strong>,</p>
                <p>Here is the consolidated staff pending work summary for <strong>${today}</strong>.</p>
                <p>Total pending tasks: <strong>${pendingTasks.length}</strong> across <strong>${employeeGroups.length}</strong> staff member(s).</p>
            `

            // Section per employee
            for (const { user, tasks } of employeeGroups) {
                const taskRows = tasks
                    .map((t) => {
                        const due = t.dueDate
                            ? t.dueDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
                            : "—"
                        const overdue =
                            t.dueDate && t.dueDate < new Date()
                                ? `<span style="color:#e53e3e;font-weight:600;">⚠ Overdue</span>`
                                : ""
                        return `
                            <tr>
                                <td style="padding:7px 10px;border-bottom:1px solid #EAECF0;">${t.title}</td>
                                <td style="padding:7px 10px;border-bottom:1px solid #EAECF0;">${t.client?.name || "—"}</td>
                                <td style="padding:7px 10px;border-bottom:1px solid #EAECF0;">${due} ${overdue}</td>
                                <td style="padding:7px 10px;border-bottom:1px solid #EAECF0;">${t.status}</td>
                            </tr>`
                    })
                    .join("")

                adminBody += `
                    <div style="margin-top:24px;">
                        <div style="font-size:15px;font-weight:700;color:#172033;border-left:4px solid #E8A020;padding-left:10px;margin-bottom:8px;">
                            👤 ${user.name || "Unknown"} — ${tasks.length} task(s)
                        </div>
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <thead>
                                <tr style="background:#F5F7FA;">
                                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #EAECF0;">Task</th>
                                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #EAECF0;">Client</th>
                                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #EAECF0;">Due Date</th>
                                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #EAECF0;">Status</th>
                                </tr>
                            </thead>
                            <tbody>${taskRows}</tbody>
                        </table>
                    </div>`
            }

            // Unassigned section
            if (unassignedTasks.length > 0) {
                const unassignedRows = unassignedTasks
                    .map((t) => {
                        const due = t.dueDate
                            ? t.dueDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
                            : "—"
                        return `
                            <tr>
                                <td style="padding:7px 10px;border-bottom:1px solid #EAECF0;">${t.title}</td>
                                <td style="padding:7px 10px;border-bottom:1px solid #EAECF0;">${t.client?.name || "—"}</td>
                                <td style="padding:7px 10px;border-bottom:1px solid #EAECF0;">${due}</td>
                                <td style="padding:7px 10px;border-bottom:1px solid #EAECF0;">${t.status}</td>
                            </tr>`
                    })
                    .join("")

                adminBody += `
                    <div style="margin-top:24px;">
                        <div style="font-size:15px;font-weight:700;color:#667085;border-left:4px solid #CBD5E0;padding-left:10px;margin-bottom:8px;">
                            ⚪ Unassigned — ${unassignedTasks.length} task(s)
                        </div>
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <thead>
                                <tr style="background:#F5F7FA;">
                                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #EAECF0;">Task</th>
                                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #EAECF0;">Client</th>
                                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #EAECF0;">Due Date</th>
                                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #EAECF0;">Status</th>
                                </tr>
                            </thead>
                            <tbody>${unassignedRows}</tbody>
                        </table>
                    </div>`
            }

            adminBody += `<p style="margin-top:24px;">View all tasks in <a href="${process.env.NEXTAUTH_URL || ""}" style="color:#E8A020;">KCS TaskPro</a>.</p><p>Regards,<br/><strong>${firmName} System</strong></p>`

            const sent = await sendEmail({
                to: adminUser.email,
                subject: `📊 Admin Daily Summary — ${today} (${pendingTasks.length} pending tasks)`,
                html: wrapEmailHtml(adminBody),
            })

            results.push({
                type: "admin",
                email: adminUser.email,
                name: adminUser.name || "Admin",
                taskCount: pendingTasks.length,
                status: sent ? "sent" : "failed",
            })
        }

        const sentCount = results.filter((r) => r.status === "sent").length
        const skippedCount = results.filter((r) => r.status === "skipped").length
        const failedCount = results.filter((r) => r.status === "failed").length

        console.log(
            `[DAILY_DIGEST] Done — ${sentCount} sent, ${skippedCount} skipped, ${failedCount} failed`
        )

        return NextResponse.json({
            success: true,
            date: today,
            totalPendingTasks: pendingTasks.length,
            emailsSent: sentCount,
            emailsSkipped: skippedCount,
            emailsFailed: failedCount,
            details: results,
        })
    } catch (error: any) {
        console.error("[DAILY_DIGEST_ERROR]", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
