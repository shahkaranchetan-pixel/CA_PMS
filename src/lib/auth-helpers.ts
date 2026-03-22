import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export type Role = "ADMIN" | "EMPLOYEE";

export async function requireAuth(role?: Role) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !user) {
        return { 
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
            user: null 
        };
    }

    if (role && user.role !== role) {
        return { 
            error: NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 }),
            user: null 
        };
    }

    return { user, session, error: null };
}
