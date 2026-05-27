import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Point 6: standardised to requireAuth
        const { error } = await requireAuth();
        if (error) return error;

        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, email: true, role: true, color: true }
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
