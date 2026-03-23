import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { MONTHS } from "@/lib/constants"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
    try {
        const { user, error } = await requireAuth("ADMIN");
        if (error) return error;

        const body = await request.json()
        const { clientIds, title, taskType, frequency, period, dueDate, priority, assigneeIds, templateId } = body

        if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
            return NextResponse.json({ error: "No clients selected" }, { status: 400 })
        }
        if (!title || !dueDate) {
            return NextResponse.json({ error: "Title and Due Date are required" }, { status: 400 })
        }

        // Count results atomically instead of using a mutable counter
        let template = null;
        if (templateId) {
            template = await prisma.taskTemplate.findUnique({
                where: { id: templateId },
                include: { items: true }
            });
        }

        // Parallel creation is still best if we need IDs for assignees/subtasks
        // but we can optimize the subtask data generation
        await Promise.all(clientIds.map(async (clientId: string) => {
            const task = await prisma.task.create({
                data: {
                    title,
                    taskType: taskType || 'other',
                    frequency: frequency || 'monthly',
                    period: period || null,
                    dueDate: new Date(dueDate),
                    priority: priority || 'medium',
                    status: 'PENDING',
                    clientId,
                    taskAssignees: assigneeIds && assigneeIds.length > 0
                        ? { create: assigneeIds.map((uid: string) => ({ userId: uid })) }
                        : undefined,
                }
            });
            

            // If template is selected, generate subtasks
            if (template && template.items.length > 0) {
                const subtasksPromises = template.items.map(async (item) => {
                    let subtaskDueDate = null;
                    if (item.dueDayOffset && item.dueDayOffset > 0 && period) {
                        try {
                            // FIXED: Robust period parsing (e.g. "Mar-2026")
                            const [m, y] = period.split(/[\-\s\/]/);
                            if (m && y && MONTHS[m] !== undefined) {
                                subtaskDueDate = new Date(parseInt(y), MONTHS[m], item.dueDayOffset);
                            }
                        } catch (e) {
                            console.error("Subtask date parsing error", e);
                        }
                    }

                    return prisma.task.create({
                        data: {
                            title: item.title,
                            taskType: item.taskType,
                            description: item.description,
                            priority: item.priority,
                            dueDate: subtaskDueDate || new Date(dueDate),
                            period,
                            clientId,
                            parentId: task.id,
                            taskAssignees: assigneeIds && assigneeIds.length > 0
                                ? { create: assigneeIds.map((uid: string) => ({ userId: uid })) }
                                : undefined,
                        }
                    });
                });
                await Promise.all(subtasksPromises);
            }
        }));

        return NextResponse.json({ success: true, count: clientIds.length })
    } catch (error) {
        console.error("[TASKS_BULK_GENERATE_ERROR]", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
