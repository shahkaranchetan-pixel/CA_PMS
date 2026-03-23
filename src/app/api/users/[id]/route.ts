import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, email, role, dept, phone, color } = body;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                role,
                dept,
                phone,
                color
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        
        // Check if user is the last admin
        const isAdmin = await prisma.user.findUnique({
            where: { id },
            select: { role: true }
        });

        if (isAdmin?.role === 'ADMIN') {
            const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
            if (adminCount <= 1) {
                return NextResponse.json({ error: "Cannot delete the last admin" }, { status: 400 });
            }
        }

        // Check if user has active task assignments
        const activeAssignments = await prisma.taskAssignee.count({
            where: { userId: id }
        });
        if (activeAssignments > 0) {
            return NextResponse.json({ 
                error: `Cannot delete user with ${activeAssignments} active task assignment(s). Reassign them first.` 
            }, { status: 400 });
        }

        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
