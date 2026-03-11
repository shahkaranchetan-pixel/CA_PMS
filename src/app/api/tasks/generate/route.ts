import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any).role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const now = new Date()
        const currentMonthShort = now.toLocaleString('default', { month: 'short' })
        const currentYear = now.getFullYear()
        const currentPeriod = `${currentMonthShort}-${currentYear}` // e.g. "Mar-2026"

        const clients = await prisma.client.findMany()
        let newTasksCount = 0

        for (const client of clients) {
            const monthlyTasks = []

            // 1. GST Tasks (if GSTIN is present)
            if (client.gstin) {
                monthlyTasks.push({ title: `GSTR-1 Filing - ${currentPeriod}`, type: 'GST_1', dueDay: 10 })
                monthlyTasks.push({ title: `GSTR-3B Filing - ${currentPeriod}`, type: 'GSTR_3B', dueDay: 20 })
            }

            // 2. TDS Tasks (if TAN is present)
            if (client.tan) {
                monthlyTasks.push({ title: `TDS Payment - ${currentPeriod}`, type: 'TDS_PAYMENT', dueDay: 7 })
            }

            // 3. PF/ESI/PT Tasks (if PF or ESI credentials exist)
            if (client.pfLogin || client.esiLogin || client.ptLogin) {
                monthlyTasks.push({ title: `PF/ESI/PT - ${currentPeriod}`, type: 'PF_ESI_PT', dueDay: 15 })
            }

            // 4. Standard Accounting (Always for active clients)
            monthlyTasks.push({ title: `Monthly Accounting - ${currentPeriod}`, type: 'ACCOUNTING', dueDay: 30 })

            for (const taskTemplate of monthlyTasks) {
                const existing = await prisma.task.findFirst({
                    where: {
                        clientId: client.id,
                        taskType: taskTemplate.type,
                        period: currentPeriod
                    }
                })

                if (!existing) {
                    let dueDate = new Date(currentYear, now.getMonth(), taskTemplate.dueDay)

                    // Handle month overflow (e.g. Feb 30 becomes Mar 2)
                    if (dueDate.getMonth() !== now.getMonth()) {
                        dueDate = new Date(currentYear, now.getMonth() + 1, 0)
                    }

                    await prisma.task.create({
                        data: {
                            title: taskTemplate.title,
                            taskType: taskTemplate.type,
                            description: `Auto-generated statutory task for ${currentPeriod}`,
                            status: "PENDING",
                            frequency: "MONTHLY",
                            dueDate: dueDate,
                            period: currentPeriod,
                            clientId: client.id
                        }
                    })
                    newTasksCount++
                }
            }
        }

        return NextResponse.json({ success: true, count: newTasksCount })
    } catch (error) {
        console.error("[TASKS_GENERATE_ERROR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
