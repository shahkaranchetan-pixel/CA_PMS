import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                client: true,
                assignee: true,
                blockedBy: true,
                logs: {
                    include: { user: { select: { name: true, image: true, email: true } } },
                    orderBy: { createdAt: "desc" }
                }
            }
        });
        if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (user.role !== 'ADMIN' && task.assigneeId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(task);
    } catch (error: any) {
        console.error("Failed to fetch task:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// PATCH to update task status
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = user.id;

        const { id } = await params;
        const body = await request.json();
        const { status, notifyClient, blockedById, estimatedMinutes, timeLogged, assigneeId, title, description, dueDate, priority } = body;

        const oldTask = await prisma.task.findUnique({ where: { id } });
        if (!oldTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

        if (user.role !== 'ADMIN' && oldTask.assigneeId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (blockedById !== undefined) updateData.blockedById = blockedById;
        if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes;
        if (timeLogged !== undefined) updateData.timeLogged = timeLogged;
        if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (priority !== undefined) updateData.priority = priority;

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                client: true,
                assignee: true
            }
        });

        // Trigger Notification & Email for Reassignment
        if (assigneeId && assigneeId !== oldTask.assigneeId) {
            await prisma.notification.create({
                data: {
                    userId: assigneeId,
                    title: "Task Reassigned",
                    message: `A task has been reassigned to you: ${task.title} for ${task.client.name}`,
                    link: `/tasks/${task.id}`
                }
            });

            if (task.assignee?.email) {
                await sendEmail({
                    to: task.assignee.email,
                    subject: `Reassigned Task: ${task.title}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #4FACFE;">Task Reassigned</h2>
                            <p>Hi ${task.assignee.name},</p>
                            <p>A task has been reassigned to you in TaskDesk Pro:</p>
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

        if (status && oldTask.status !== status && userId) {
            await prisma.taskLog.create({
                data: {
                    taskId: id,
                    userId,
                    type: "STATUS_CHANGE",
                    oldStatus: oldTask.status,
                    newStatus: status,
                    content: `Status changed from ${oldTask.status} to ${status}`
                }
            });
        }

        // Trigger Email if optionally requested
        if (notifyClient && status === "COMPLETED" && task.client) {
            // Use client's contact phone/email if possible, but for now we follow the existing pattern
            // but we'll try to keep it reasonable. In a real system we'd have a client email field.
            await sendEmail({
                to: "client@example.com", // Placeholder as per previous user pattern, or we could add a field
                subject: `Task Completed: ${task.title}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #E8A020;">Update on your compliance task</h2>
                        <p>Dear ${task.client.name},</p>
                        <p>We are pleased to inform you that the following task has been successfully completed by our team:</p>
                        <div style="background: #f4f4f5; padding: 16px; border-left: 4px solid #E8A020; margin: 16px 0;">
                            <strong>Task:</strong> ${task.title}<br/>
                            <strong>Period:</strong> ${task.period || 'N/A'}<br/>
                            <strong>Completed By:</strong> ${task.assignee?.name || 'CA Practice Team'}
                        </div>
                        <p>If you have any questions, please feel free to reach out to us.</p>
                        <p>Best Regards,<br/><strong>Your CA Practice Team</strong></p>
                    </div>
                `
            });
        }

        return NextResponse.json(task);
    } catch (error: any) {
        console.error("Failed to update task:", error);
        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 }
        );
    }
}
