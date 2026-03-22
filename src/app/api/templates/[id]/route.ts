import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const template = await prisma.taskTemplate.findUnique({
            where: { id },
            include: {
                items: {
                    orderBy: { dueDayOffset: 'asc' }
                }
            }
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error("Template GET Error:", error);
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, description, items } = body;

        if (!name || !items || items.length === 0) {
            return NextResponse.json({ error: 'Template name and at least one item are required' }, { status: 400 });
        }

        // Update template and its items
        // Simplified approach: Delete old items and create new ones
        const template = await prisma.$transaction(async (tx) => {
            // Update main template info
            const updatedTemplate = await tx.taskTemplate.update({
                where: { id },
                data: {
                    name,
                    description,
                }
            });

            // Delete old items
            await tx.taskTemplateItem.deleteMany({
                where: { templateId: id }
            });

            // Create new items
            await tx.taskTemplateItem.createMany({
                data: items.map((i: any) => ({
                    templateId: id,
                    title: i.title,
                    taskType: i.taskType,
                    description: i.description || null,
                    priority: i.priority || 'medium',
                    dueDayOffset: parseInt(i.dueDayOffset) || 0
                }))
            });

            return updatedTemplate;
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Template PUT Error:", error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 401 });
        }

        const { id } = await params;
        
        // Delete template (Prisma should handle cascading items if defined in schema, but let's be explicit if needed)
        // Check schema.prisma relationship
        await prisma.taskTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Template DELETE Error:", error);
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
}
