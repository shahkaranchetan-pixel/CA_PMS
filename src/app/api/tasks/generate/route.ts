import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export async function POST() {
    try {
        const { user, error } = await requireAuth("ADMIN");
        if (error) return error;

        const now = new Date()
        const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonthIdx = now.getMonth();
        const currentYear = now.getFullYear();
        const currentPeriod = `${MONTH_NAMES[currentMonthIdx]}-${currentYear}`;

        const clients = await prisma.client.findMany()
        let newTasksCount = 0

        for (const client of clients) {
            const monthlyTasks = []

            // 1. GST Tasks (if GSTIN is present)
            if (client.gstin) {
                if (client.gstCategory === 'MONTHLY') {
                    monthlyTasks.push({ title: `GSTR-1 Filing - ${currentPeriod}`, type: 'GST_1', dueDay: 11 })
                } else if (client.gstCategory === 'QUARTERLY') {
                    const quarterlyMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct (filing months for previous quarter)
                    if (quarterlyMonths.includes(now.getMonth())) {
                        const quarters: Record<number, string> = { 0: 'Q3', 3: 'Q4', 6: 'Q1', 9: 'Q2' };
                        const qName = quarters[now.getMonth()];
                        monthlyTasks.push({ title: `GSTR-1 (Quarterly) - ${qName}`, type: 'GST_1', dueDay: 13 })
                    }
                }
                
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

            // 4. TDS Return (Quarterly) - Form 24Q / 26Q
            // Quarterly tasks generated in the month they are due (often end of following month)
            // Apr (Q4), Jul (Q1), Oct (Q2), Jan (Q3)
            const quarterlyMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct (0-indexed)
            if (client.tan && quarterlyMonths.includes(now.getMonth())) {
                const quarters: Record<number, string> = { 0: 'Q3', 3: 'Q4', 6: 'Q1', 9: 'Q2' };
                const qName = quarters[now.getMonth()];
                monthlyTasks.push({ title: `TDS Return (${qName}) - ${currentYear}`, type: 'TDS_RETURN', dueDay: 30 });
            }

            // 5. Standard Accounting (Always for active clients)
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
