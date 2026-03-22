import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { user, error } = await requireAuth();
        if (error) return error;

        const employees = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                role: true,
                dept: true,
                color: true,
                phone: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(employees);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { user, error } = await requireAuth("ADMIN");
        if (error) return error;

        const data = await request.json();

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Employee with this email already exists" }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create new employee
        const employee = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role || 'EMPLOYEE',
                dept: data.dept || 'General',
                phone: data.phone || null,
                color: data.color || '#4FACFE',
            }
        });

        return NextResponse.json({ success: true, employee }, { status: 201 });
    } catch (error) {
        console.error("Employee Creation Error:", error);
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}
