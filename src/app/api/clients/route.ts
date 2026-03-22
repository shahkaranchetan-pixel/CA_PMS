import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { encrypt } from "@/lib/encryption";
import { clientSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { user, error } = await requireAuth();
        if (error) return error;

        // Return client list WITHOUT password fields for security
        const clients = await prisma.client.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                name: true,
                entityType: true,
                gstin: true,
                pan: true,
                tan: true,
                contactPerson: true,
                contactEmail: true,
                contactPhone: true,
                active: true,
                createdAt: true,
                updatedAt: true,
                itxLogin: true,
                gstLogin: true,
                pfLogin: true,
                esiLogin: true,
                ptLogin: true,
                tracesLogin: true,
                // Passwords omitted intentionally
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(clients);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { user, error } = await requireAuth("ADMIN");
        if (error) return error;

        const body = await request.json();
        
        // Validate input
        const validation = clientSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ 
                error: "Validation failed", 
                details: validation.error.format() 
            }, { status: 400 });
        }

        const data = validation.data;
        const client = await prisma.client.create({
            data: {
                name: data.name,
                entityType: data.entityType,
                gstCategory: data.gstCategory || 'MONTHLY',
                gstin: data.gstin || null,
                pan: data.pan || null,
                tan: data.tan || null,
                contactEmail: data.contactEmail || null,
                contactPhone: data.contactPhone || null,
                contactPerson: body.contactPerson || null,
                itxLogin: body.itxLogin,
                itxPassword: body.itxPassword ? encrypt(body.itxPassword) : null,
                gstLogin: body.gstLogin,
                gstPassword: body.gstPassword ? encrypt(body.gstPassword) : null,
                tracesLogin: body.tracesLogin,
                tracesPassword: body.tracesPassword ? encrypt(body.tracesPassword) : null,
                pfLogin: body.pfLogin,
                pfPassword: body.pfPassword ? encrypt(body.pfPassword) : null,
                esiLogin: body.esiLogin,
                esiPassword: body.esiPassword ? encrypt(body.esiPassword) : null,
                ptLogin: body.ptLogin,
                ptPassword: body.ptPassword ? encrypt(body.ptPassword) : null,
            }
        });

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        console.error("[CLIENTS_POST_ERROR]", error);
        return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
}
