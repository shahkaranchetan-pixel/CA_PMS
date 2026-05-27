import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTrackedEmail } from "@/lib/mailer";
import { requireAuth } from "@/lib/auth-helpers";
import { taskSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        // Point 6: standardised auth helper instead of raw getServerSession
        const { user, error } = await requireAuth();
        if (error) return error;
        const senderId = user.id;

        const body = await request.json();

        // Point 7: Zod validation for core task fields
        const validation = taskSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { title, description, dueDate, period, clientId, taskType, frequency, assigneeIds, templateId, priority, estimatedMinutes, blockedById, notifyClient } = body;

        if (!clientId) {
            return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                title,
                taskType,
                description,
                frequency: frequency || "ONCE",
                dueDate: dueDate ? new Date(dueDate) : null,
                period,
                clientId,
                priority: priority || "medium",
                estimatedMinutes: estimatedMinutes || null,
                blockedById: blockedById || null,
                taskAssignees: assigneeIds && assigneeIds.length > 0
                    ? { create: assigneeIds.map((uid: string) => ({ userId: uid })) }
                    : undefined,
            },
            include: {
                client: true,
                taskAssignees: { include: { user: true } }
            }
        });

        // Fire-and-forget: notifications & emails run in background, don't block response
        const backgroundWork = async () => {
            try {
                // Trigger Notification & Email for each Assignee — parallel
                if (task.taskAssignees && task.taskAssignees.length > 0) {
                    await Promise.allSettled(task.taskAssignees.map(async (ta) => {
                        await prisma.notification.create({
                            data: {
                                userId: ta.userId,
                                title: "New Task Assigned",
                                message: `You have been assigned a new task: ${task.title} for ${task.client.name}`,
                                link: `/tasks/${task.id}`
                            }
                        });

                        if (ta.user?.email) {
                            await sendTrackedEmail({
                                senderId,
                                to: [{ email: ta.user.email, name: ta.user.name }],
                                category: "ASSIGNMENT",
                                subject: `New Task: ${task.title}`,
                                body: `Hi ${ta.user.name || "there"},

You have been assigned a new task in KCS TaskPro.

Task: ${task.title}
Client: ${task.client.name}
Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "No due date"}

View Task: ${process.env.NEXTAUTH_URL || ""}/tasks/${task.id}`,
                                taskId: task.id,
                                clientId: task.clientId,
                            });
                        }
                    }));
                }

                // Trigger Client Notification if requested
                if (notifyClient && task.client && task.client.contactEmail) {
                    await sendTrackedEmail({
                        senderId,
                        to: [{ email: task.client.contactEmail, name: task.client.contactPerson || task.client.name, clientId: task.clientId }],
                        category: "CLIENT_UPDATE",
                        subject: `KCS Team: Started work on your ${task.taskType?.replace(/_/g, ' ') || 'Task'}: ${task.title}`,
                        body: `Dear ${task.client.name},

We have started work on your compliance task.

Task: ${task.title}
Type: ${task.taskType?.replace(/_/g, " ")}
Period: ${task.period || "N/A"}
Estimated Completion: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "TBD"}

We will keep you updated as we progress.

Regards,
KCS Practice Team`,
                        taskId: task.id,
                        clientId: task.clientId,
                    });
                }

                // If a template was selected, create subtasks in parallel
                if (templateId) {
                    const template = await prisma.taskTemplate.findUnique({
                        where: { id: templateId },
                        include: { items: true }
                    });

                    if (template && template.items.length > 0) {
                        await Promise.allSettled(template.items.map(async (item) => {
                            let subtaskDueDate = null;
                            if (item.dueDayOffset && item.dueDayOffset > 0 && period) {
                                try {
                                    const [m, y] = period.split('-');
                                    if (m && y) {
                                        const d = new Date(`${m} 1, ${y}`);
                                        d.setDate(item.dueDayOffset);
                                        subtaskDueDate = d;
                                    }
                                } catch (e) { }
                            }

                            await prisma.task.create({
                                data: {
                                    title: item.title,
                                    taskType: item.taskType,
                                    description: item.description,
                                    priority: item.priority,
                                    dueDate: subtaskDueDate || (dueDate ? new Date(dueDate) : null),
                                    period,
                                    clientId,
                                    parentId: task.id,
                                    taskAssignees: assigneeIds && assigneeIds.length > 0
                                        ? { create: assigneeIds.map((uid: string) => ({ userId: uid })) }
                                        : undefined,
                                }
                            });
                        }));
                    }
                }
            } catch (e) {
                console.error("Background task processing error:", e);
            }
        };

        // Fire and forget — don't await
        backgroundWork();

        return NextResponse.json(task, { status: 201 });
    } catch (error: any) {
        console.error("Failed to create task:", error);
        return NextResponse.json(
            { error: "Failed to create task" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        // Point 6: GET was completely unauthenticated — fixed
        const { user, error } = await requireAuth();
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get("clientId");
        const taskType = searchParams.get("taskType");
        const period = searchParams.get("period");

        const where: any = { deletedAt: null };
        if (clientId) where.clientId = clientId;
        if (taskType) where.taskType = taskType;
        if (period) where.period = period;

        const tasks = await prisma.task.findMany({
            where,
            include: {
                client: { select: { id: true, name: true } },
                taskAssignees: { include: { user: { select: { id: true, name: true, color: true } } } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}
