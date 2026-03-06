import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const employees = await prisma.user.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(employees);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 });
        }

        const data = await request.json();

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Employee with this email already exists" }, { status: 400 });
        }

        // Create new employee (without password for now, assuming magic link or default setup)
        const employee = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role || 'EMPLOYEE',
            }
        });

        return NextResponse.json(employee, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}
