import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const where: any = user.role === 'ADMIN' ? {} : { assigneeId: user.id }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                client: { select: { name: true } },
                assignee: { select: { name: true } }
            },
            orderBy: { dueDate: 'asc' }
        })

        // Generate CSV
        const headers = ["ID", "Title", "Type", "Status", "Priority", "Frequency", "Due Date", "Period", "Client", "Assignee"]
        const rows = tasks.map(t => [
            t.id,
            `"${t.title.replace(/"/g, '""')}"`,
            t.taskType,
            t.status,
            t.priority,
            t.frequency,
            t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A',
            t.period || 'N/A',
            `"${t.client.name.replace(/"/g, '""')}"`,
            `"${t.assignee?.name?.replace(/"/g, '""') || 'Unassigned'}"`
        ])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename=tasks-export-${new Date().toISOString().split('T')[0]}.csv`
            }
        })
    } catch (error) {
        console.error("[EXPORT_TASKS_ERROR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
