import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { requireAuth } from "@/lib/auth-helpers";

const MONTHS: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, error } = await requireAuth();
        if (error) return error;

        const { id } = await params;
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                client: true,
                taskAssignees: { include: { user: true } },
                blockedBy: true,
                logs: {
                    include: { user: { select: { name: true, image: true, email: true } } },
                    orderBy: { createdAt: "desc" }
                }
            }
        });
        if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Check access: admin can see all, employees can see their assigned tasks
        const isAssigned = task.taskAssignees.some(ta => ta.userId === user.id);
        if (user.role !== 'ADMIN' && !isAssigned) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(task);
    } catch (error: any) {
        console.error("Failed to fetch task:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// PATCH to update task
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, error } = await requireAuth();
        if (error) return error;
        const userId = user.id;

        const { id } = await params;
        const body = await request.json();
        const { status, notifyClient, blockedById, estimatedMinutes, timeLogged, assigneeIds, title, description, dueDate, priority } = body;

        const oldTask = await prisma.task.findUnique({
            where: { id },
            include: { taskAssignees: true }
        });
        if (!oldTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

        const isAssigned = oldTask.taskAssignees.some(ta => ta.userId === userId);
        if (user.role !== 'ADMIN' && !isAssigned) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (blockedById !== undefined) updateData.blockedById = blockedById;
        if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes;
        if (timeLogged !== undefined) updateData.timeLogged = timeLogged;
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (priority !== undefined) updateData.priority = priority;

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                client: true,
                taskAssignees: { include: { user: true } }
            }
        });

        // Always log status changes, regardless of other fields
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

            // Feature: Auto-rollover monthly tasks
            if (status === 'COMPLETED' && oldTask.frequency === 'MONTHLY' && oldTask.period) {
                try {
                    const [mon, yr] = oldTask.period.split(/[\-\s\/]/);
                    if (mon && yr && MONTHS[mon] !== undefined) {
                        const monthIndex = MONTHS[mon];
                        const nextMonth = new Date(parseInt(yr), monthIndex + 1, 1);
                        const nextPeriod = `${MONTH_NAMES[nextMonth.getMonth()]}-${nextMonth.getFullYear()}`;
                        
                        const exists = await prisma.task.findFirst({
                            where: { clientId: oldTask.clientId, taskType: oldTask.taskType, period: nextPeriod }
                        });
                        
                        if (!exists) {
                            let nextDue = oldTask.dueDate ? new Date(oldTask.dueDate) : new Date();
                            if (oldTask.dueDate) {
                                nextDue.setMonth(nextDue.getMonth() + 1);
                            }
                            
                            await prisma.task.create({
                                data: {
                                    title: oldTask.title.replace(oldTask.period, nextPeriod).replace(mon, MONTH_NAMES[nextMonth.getMonth()]),
                                    taskType: oldTask.taskType,
                                    frequency: 'MONTHLY',
                                    period: nextPeriod,
                                    clientId: oldTask.clientId,
                                    dueDate: nextDue,
                                    status: 'PENDING',
                                    priority: oldTask.priority
                                }
                            });
                        }
                    }
                } catch (e) { console.error("Auto-rollover failed", e) }
            }
        }

        // Handle assignee changes if assigneeIds is provided
        if (assigneeIds !== undefined && Array.isArray(assigneeIds)) {
            const oldAssigneeIds = oldTask.taskAssignees.map(ta => ta.userId);
            const newAssigneeIds: string[] = assigneeIds;

            // Find removed and added assignees
            const removedIds = oldAssigneeIds.filter(id => !newAssigneeIds.includes(id));
            const addedIds = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));

            // Remove old assignments
            if (removedIds.length > 0) {
                await prisma.taskAssignee.deleteMany({
                    where: { taskId: id, userId: { in: removedIds } }
                });
            }

            // Add new assignments
            if (addedIds.length > 0) {
                await prisma.taskAssignee.createMany({
                    data: addedIds.map((uid: string) => ({ taskId: id, userId: uid })),
                    skipDuplicates: true
                });

                // Notify newly added assignees
                for (const newUserId of addedIds) {
                    await prisma.notification.create({
                        data: {
                            userId: newUserId,
                            title: "Task Reassigned",
                            message: `A task has been assigned to you: ${task.title} for ${task.client.name}`,
                            link: `/tasks/${task.id}`
                        }
                    });

                    const assigneeUser = await prisma.user.findUnique({ where: { id: newUserId } });
                    if (assigneeUser?.email) {
                        await sendEmail({
                            to: assigneeUser.email,
                            subject: `Reassigned Task: ${task.title}`,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                    <h2 style="color: #4FACFE;">Task Assigned</h2>
                                    <p>Hi ${assigneeUser.name},</p>
                                    <p>A task has been assigned to you in KCS TaskPro:</p>
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
            
            // Reload task with updated assignees
            const updatedTask = await prisma.task.findUnique({
                where: { id },
                include: {
                    client: true,
                    taskAssignees: { include: { user: true } }
                }
            });
            return NextResponse.json(updatedTask);
        }

        // Trigger Email if optionally requested
        if (notifyClient && status === "COMPLETED" && task.client) {
            await sendEmail({
                to: task.client.contactEmail || "client@example.com",
                subject: `Task Completed: ${task.title}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #E8A020;">Update on your compliance task</h2>
                        <p>Dear ${task.client.name},</p>
                        <p>We are pleased to inform you that the following task has been successfully completed by our team:</p>
                        <div style="background: #f4f4f5; padding: 16px; border-left: 4px solid #E8A020; margin: 16px 0;">
                            <strong>Task:</strong> ${task.title}<br/>
                            <strong>Period:</strong> ${task.period || 'N/A'}<br/>
                            <strong>Completed By:</strong> ${task.taskAssignees.map(ta => ta.user?.name).filter(Boolean).join(', ') || 'CA Practice Team'}
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

// DELETE to soft-delete task
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, error } = await requireAuth("ADMIN");
        if (error) return error;

        const { id } = await params;
        
        // Cascade delete subtasks
        await prisma.task.updateMany({
            where: { parentId: id },
            data: { deletedAt: new Date() }
        });

        const task = await prisma.task.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true, task });
    } catch (error: any) {
        console.error("Failed to delete task:", error);
        return NextResponse.json(
            { error: "Failed to delete task" },
            { status: 500 }
        );
    }
}
