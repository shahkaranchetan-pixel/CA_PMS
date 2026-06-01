import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = (session?.user as any)?.role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: "Only admins can bulk assign tasks" }, { status: 403 });
        }

        const body = await req.json();
        const { taskIds, userId } = body;

        if (!taskIds || !Array.isArray(taskIds) || !userId) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        // We will loop through the task IDs and create/update assignees
        // For simplicity, we clear existing assignees and add the new one
        await prisma.$transaction(async (tx) => {
            // Remove existing assignees for these tasks
            await tx.taskAssignee.deleteMany({
                where: {
                    taskId: { in: taskIds }
                }
            });

            // Create new assignees
            const newAssignees = taskIds.map(taskId => ({
                taskId,
                userId
            }));

            await tx.taskAssignee.createMany({
                data: newAssignees
            });
        });

        return NextResponse.json({ success: true, count: taskIds.length });
    } catch (error) {
        console.error("Error bulk assigning tasks:", error);
        return NextResponse.json({ error: "Failed to bulk assign tasks" }, { status: 500 });
    }
}
