import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const currentUserId = (session.user as any).id;
        const body = await req.json();
        const { recipientIds, note } = body;

        if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
            return new NextResponse("Invalid recipients", { status: 400 });
        }

        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) {
            return new NextResponse("Task not found", { status: 404 });
        }

        // Create Escalation
        const escalation = await prisma.taskEscalation.create({
            data: {
                taskId: id,
                escalatedById: currentUserId,
                note: note || "",
                recipients: {
                    create: recipientIds.map((userId: string) => ({
                        userId
                    }))
                }
            }
        });

        // Add a task log for the escalation
        const recipientNames = await prisma.user.findMany({
            where: { id: { in: recipientIds } },
            select: { name: true }
        });
        const recipientNamesStr = recipientNames.map(r => r.name).join(", ");

        await prisma.taskLog.create({
            data: {
                taskId: id,
                userId: currentUserId,
                type: "COMMENT",
                content: `Escalated task to ${recipientNamesStr}` + (note ? ` with note: "${note}"` : "")
            }
        });

        return NextResponse.json(escalation);
    } catch (error) {
        console.error("Error escalating task:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
