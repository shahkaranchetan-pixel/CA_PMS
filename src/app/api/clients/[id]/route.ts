import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const client = await prisma.client.findUnique({
            where: { id }
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        const user = session?.user as any;
        const isAdmin = user?.role === 'ADMIN';

        // Decrypt passwords ONLY if user is ADMIN
        if (isAdmin) {
            if (client.itxPassword) client.itxPassword = decrypt(client.itxPassword);
            if (client.gstPassword) client.gstPassword = decrypt(client.gstPassword);
            if (client.tracesPassword) client.tracesPassword = decrypt(client.tracesPassword);
            if (client.pfPassword) client.pfPassword = decrypt(client.pfPassword);
            if (client.esiPassword) client.esiPassword = decrypt(client.esiPassword);
            if (client.ptPassword) client.ptPassword = decrypt(client.ptPassword);
        } else {
            // Redact passwords for regular employees
            if (client.itxPassword) client.itxPassword = "••••••••";
            if (client.gstPassword) client.gstPassword = "••••••••";
            if (client.tracesPassword) client.tracesPassword = "••••••••";
            if (client.pfPassword) client.pfPassword = "••••••••";
            if (client.esiPassword) client.esiPassword = "••••••••";
            if (client.ptPassword) client.ptPassword = "••••••••";
        }

        return NextResponse.json(client);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;

        if (!session || user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
        }

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
                contactPerson: data.contactPerson || null,
                contactEmail: data.contactEmail || null,
                contactPhone: data.contactPhone || null,
                active: data.active,
                itxLogin: data.itxLogin || null,
                itxPassword: data.itxPassword && data.itxPassword !== "••••••••" ? encrypt(data.itxPassword) : undefined,
                gstLogin: data.gstLogin || null,
                gstPassword: data.gstPassword && data.gstPassword !== "••••••••" ? encrypt(data.gstPassword) : undefined,
                tracesLogin: data.tracesLogin || null,
                tracesPassword: data.tracesPassword && data.tracesPassword !== "••••••••" ? encrypt(data.tracesPassword) : undefined,
                pfLogin: data.pfLogin || null,
                pfPassword: data.pfPassword && data.pfPassword !== "••••••••" ? encrypt(data.pfPassword) : undefined,
                esiLogin: data.esiLogin || null,
                esiPassword: data.esiPassword && data.esiPassword !== "••••••••" ? encrypt(data.esiPassword) : undefined,
                ptLogin: data.ptLogin || null,
                ptPassword: data.ptPassword && data.ptPassword !== "••••••••" ? encrypt(data.ptPassword) : undefined,
            }
        });

        return NextResponse.json(client);
    } catch (error) {
        console.error("[CLIENT_PUT_ERROR]", error);
        return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }
}
