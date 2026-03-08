import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const templates = await prisma.taskTemplate.findMany({
            include: {
                items: {
                    orderBy: { dueDayOffset: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("Templates GET Error:", error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, items } = body;

        if (!name || !items || items.length === 0) {
            return NextResponse.json({ error: 'Template name and at least one item are required' }, { status: 400 });
        }

        const template = await prisma.taskTemplate.create({
            data: {
                name,
                description,
                items: {
                    create: items.map((i: any) => ({
                        title: i.title,
                        taskType: i.taskType,
                        description: i.description,
                        priority: i.priority || 'medium',
                        dueDayOffset: parseInt(i.dueDayOffset) || 0
                    }))
                }
            },
            include: { items: true }
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        console.error("Templates POST Error:", error);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}
