import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, dueDate, period, clientId, taskType, frequency, assigneeIds, templateId, priority, estimatedMinutes, blockedById, notifyClient } = body;

        if (!title || !clientId || !taskType || !dueDate) {
            return NextResponse.json(
                { error: "Title, Client ID, Task Type, and Due Date are required" },
                { status: 400 }
            );
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

        // Trigger Notification & Email for each Assignee
        if (task.taskAssignees && task.taskAssignees.length > 0) {
            for (const ta of task.taskAssignees) {
                await prisma.notification.create({
                    data: {
                        userId: ta.userId,
                        title: "New Task Assigned",
                        message: `You have been assigned a new task: ${task.title} for ${task.client.name}`,
                        link: `/tasks/${task.id}`
                    }
                });

                if (ta.user?.email) {
                    await sendEmail({
                        to: ta.user.email,
                        subject: `New Task: ${task.title}`,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                <h2 style="color: #4FACFE;">New Task Assigned</h2>
                                <p>Hi ${ta.user.name},</p>
                                <p>You have been assigned a new task in KCS TaskPro:</p>
                                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; border-left: 4px solid #4FACFE;">
                                    <strong>Task:</strong> ${task.title}<br/>
                                    <strong>Client:</strong> ${task.client.name}<br/>
                                    <strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                </div>
                                <p style="margin-top: 20px;">
                                    <a href="${process.env.NEXTAUTH_URL}/tasks/${task.id}" style="background: #4FACFE; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Task</a>
                                </p>
                            </div>
                        `
                    });
                }
            }
        }

        // Trigger Client Notification if requested
        if (notifyClient && task.client && task.client.contactEmail) {
            await sendEmail({
                to: task.client.contactEmail,
                subject: `KCS Team: Started work on your ${task.taskType?.replace(/_/g, ' ') || 'Task'}: ${task.title}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #E8A020;">Task Initiated</h2>
                        <p>Dear ${task.client.name},</p>
                        <p>We've started work on your compliance task at KCS Practice Management Software:</p>
                        <div style="background: #f4f4f5; padding: 16px; border-left: 4px solid #E8A020; margin: 16px 0;">
                            <strong>Task:</strong> ${task.title}<br/>
                            <strong>Type:</strong> ${task.taskType?.replace(/_/g, ' ')}<br/>
                            <strong>Period:</strong> ${task.period || 'N/A'}<br/>
                            <strong>Est. Completion:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'TBD'}
                        </div>
                        <p>We will keep you updated as we progress. Feel free to reach out if you have any questions.</p>
                        <p>Warm Regards,<br/><strong>KCS Practice Team</strong></p>
                    </div>
                `
            });
        }

        // If a template was selected, auto-generate the subtasks
        if (templateId) {
            const template = await prisma.taskTemplate.findUnique({
                where: { id: templateId },
                include: { items: true }
            });

            if (template && template.items.length > 0) {
                for (const item of template.items) {
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

                    const subtask = await prisma.task.create({
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
                }
            }
        }

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
                client: true,
                taskAssignees: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}
