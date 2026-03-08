import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any).role !== "ADMIN") {
            return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
        }

        const body = await request.json()
        const { clientIds, title, taskType, frequency, period, dueDate, priority, assigneeId } = body

        if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
            return new NextResponse(JSON.stringify({ error: "No clients selected" }), { status: 400 })
        }
        if (!title || !dueDate) {
            return new NextResponse(JSON.stringify({ error: "Title and Due Date are required" }), { status: 400 })
        }

        const taskData = clientIds.map(clientId => ({
            title,
            taskType: taskType || 'other',
            frequency: frequency || 'monthly',
            period: period || null,
            dueDate: new Date(dueDate),
            priority: priority || 'medium',
            status: 'PENDING',
            clientId,
            assigneeId: assigneeId || null
        }))

        // Use createMany for bulk insert (Sqlite supports this if we are using it via Prisma, Postgres/MySQL do natively)
        const result = await prisma.task.createMany({
            data: taskData,
            skipDuplicates: true
        })

        return NextResponse.json({ success: true, count: result.count })
    } catch (error) {
        console.error("[TASKS_BULK_GENERATE_ERROR]", error)
        return new NextResponse(JSON.stringify({ error: "Internal Error" }), { status: 500 })
    }
}
