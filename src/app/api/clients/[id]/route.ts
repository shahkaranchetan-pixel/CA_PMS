import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const client = await prisma.client.findUnique({
            where: { id }
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await request.json();
        const client = await prisma.client.update({
            where: { id },
            data: {
                name: data.name,
                entityType: data.entityType,
                gstin: data.gstin || null,
                pan: data.pan || null,
                tan: data.tan || null,
                contact: data.contact || null,
                active: data.active,
                itxLogin: data.itxLogin || null,
                itxPassword: data.itxPassword || null,
                gstLogin: data.gstLogin || null,
                gstPassword: data.gstPassword || null,
                tracesLogin: data.tracesLogin || null,
                tracesPassword: data.tracesPassword || null,
                pfLogin: data.pfLogin || null,
                pfPassword: data.pfPassword || null,
                esiLogin: data.esiLogin || null,
                esiPassword: data.esiPassword || null,
                ptLogin: data.ptLogin || null,
                ptPassword: data.ptPassword || null,
            }
        });

        return NextResponse.json(client);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }
}
