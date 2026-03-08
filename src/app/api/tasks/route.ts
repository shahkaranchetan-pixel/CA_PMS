import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, dueDate, period, clientId, taskType, frequency, assigneeId, templateId, priority, estimatedMinutes, blockedById } = body;

        if (!title || !clientId || !taskType) {
            return NextResponse.json(
                { error: "Title, Client ID, and Task Type are required" },
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
                assigneeId: assigneeId || null,
                priority: priority || "medium",
                estimatedMinutes: estimatedMinutes || null,
                blockedById: blockedById || null,
            },
            include: {
                client: true,
                assignee: true
            }
        });

        // Trigger Notification & Email for Assignee
        if (task.assigneeId) {
            await prisma.notification.create({
                data: {
                    userId: task.assigneeId,
                    title: "New Task Assigned",
                    message: `You have been assigned a new task: ${task.title} for ${task.client.name}`,
                    link: `/tasks/${task.id}`
                }
            });

            if (task.assignee?.email) {
                await sendEmail({
                    to: task.assignee.email,
                    subject: `New Task: ${task.title}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #4FACFE;">New Task Assigned</h2>
                            <p>Hi ${task.assignee.name},</p>
                            <p>You have been assigned a new task in TaskDesk Pro:</p>
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

        // If a template was selected, auto-generate the subtasks
        if (templateId) {
            const template = await prisma.taskTemplate.findUnique({
                where: { id: templateId },
                include: { items: true }
            });

            if (template && template.items.length > 0) {
                const subtasks = template.items.map(item => {
                    // Try to calculate due date based on dueDayOffset if applicable
                    let subtaskDueDate = null;
                    if (item.dueDayOffset && item.dueDayOffset > 0 && period) {
                        try {
                            // simplistic: parse period (e.g. Aug-2026) and set day to offset
                            const [m, y] = period.split('-');
                            if (m && y) {
                                const d = new Date(`${m} 1, ${y}`);
                                d.setDate(item.dueDayOffset);
                                subtaskDueDate = d;
                            }
                        } catch (e) { }
                    }

                    return {
                        title: item.title,
                        taskType: item.taskType,
                        description: item.description,
                        priority: item.priority,
                        dueDate: subtaskDueDate || (dueDate ? new Date(dueDate) : null),
                        period,
                        clientId,
                        assigneeId: assigneeId || null, // assign subtasks to same user by default
                        parentId: task.id // Link to the newly created parent task
                    };
                });

                await prisma.task.createMany({
                    data: subtasks
                });
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
