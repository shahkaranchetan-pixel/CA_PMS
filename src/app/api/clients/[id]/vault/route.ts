import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET all vault entries for a client
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const entries = await prisma.clientVaultEntry.findMany({
            where: { clientId: id },
            orderBy: { createdAt: 'asc' }
        });
        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch vault entries" }, { status: 500 });
    }
}

// POST a new custom vault entry
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await request.json();

        const entry = await prisma.clientVaultEntry.create({
            data: {
                clientId: id,
                portalName: data.portalName,
                username: data.username || null,
                password: data.password || null,
                notes: data.notes || null,
            }
        });

        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        console.error("Vault entry creation error:", error);
        return NextResponse.json({ error: "Failed to create vault entry" }, { status: 500 });
    }
}

// DELETE a custom vault entry
export async function DELETE(request: Request) {
    try {
        const { entryId } = await request.json();

        await prisma.clientVaultEntry.delete({
            where: { id: entryId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete vault entry" }, { status: 500 });
    }
}
