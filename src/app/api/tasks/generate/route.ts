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

        // Logic to generate tasks:
        // Find all active clients, and check their required filings/tasks depending on some client settings.
        // For simplicity, let's just generate a baseline set of recurring monthly tasks for all active clients
        // if they don't already exist for the current month.

        const currentMonth = new Date().toLocaleString('default', { month: 'short', year: 'numeric' }) // e.g. "Mar 2026"

        const clients = await prisma.client.findMany()

        let newTasksCount = 0;

        for (const client of clients) {
            // Define standard monthly tasks
            const monthlyTasks = [
                { title: `TDS Payment - ${currentMonth}`, type: 'TDS_PAYMENT', dueDay: 7 },
                { title: `GSTR-1 Filing - ${currentMonth}`, type: 'GST_1', dueDay: 10 },
                { title: `PF/ESI/PT - ${currentMonth}`, type: 'PF_ESI_PT', dueDay: 15 },
                { title: `GSTR-3B Filing - ${currentMonth}`, type: 'GSTR_3B', dueDay: 20 },
                { title: `Monthly Accounting - ${currentMonth}`, type: 'ACCOUNTING', dueDay: 30 }
            ]

            for (const taskTemplate of monthlyTasks) {
                // Check if task already exists for this client and period
                const existing = await prisma.task.findFirst({
                    where: {
                        clientId: client.id,
                        taskType: taskTemplate.type,
                        period: currentMonth
                    }
                })

                if (!existing) {
                    // Create due date for the current month and year
                    const now = new Date()
                    let dueDate = new Date(now.getFullYear(), now.getMonth(), taskTemplate.dueDay)

                    // If due day is 30, handle Feb safely (creates Mar 2nd usually, so maybe just stick to standard calculation)

                    await prisma.task.create({
                        data: {
                            title: taskTemplate.title,
                            taskType: taskTemplate.type,
                            description: `Auto-generated task for ${currentMonth}`,
                            status: "PENDING",
                            frequency: "MONTHLY",
                            dueDate: dueDate,
                            period: currentMonth,
                            clientId: client.id
                        }
                    })
                    newTasksCount++;
                }
            }
        }

        return NextResponse.json({ success: true, count: newTasksCount })
    } catch (error) {
        console.error("[TASKS_GENERATE_ERROR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
