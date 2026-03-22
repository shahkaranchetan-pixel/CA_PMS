import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string, activityId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { activityId } = await params;
        const { isCompleted } = await request.json();

        const activity = await prisma.activity.update({
            where: { id: activityId },
            data: { isCompleted }
        });

        return NextResponse.json(activity);
    } catch (error: any) {
        console.error("Failed to update activity:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
