import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { content } = body;

        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const log = await prisma.taskLog.create({
            data: {
                taskId: id,
                userId,
                type: "COMMENT",
                content
            },
            include: {
                user: {
                    select: { name: true, email: true, image: true }
                }
            }
        });

        return NextResponse.json(log, { status: 201 });
    } catch (error: any) {
        console.error("Failed to add task log:", error);
        return NextResponse.json(
            { error: "Failed to add task log" },
            { status: 500 }
        );
    }
}
