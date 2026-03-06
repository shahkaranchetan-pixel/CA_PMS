import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, dueDate, period, clientId, taskType, frequency, assigneeId } = body;

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
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error: any) {
        console.error("Failed to create task:", error);
        return NextResponse.json(
            { error: "Failed to create task" },
            { status: 500 }
        );
    }
}
