import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(clients);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const client = await prisma.client.create({
            data: {
                name: data.name,
                entityType: data.entityType,
                gstin: data.gstin,
                pan: data.pan,
                itxLogin: data.itxLogin,
                itxPassword: data.itxPassword,
                gstLogin: data.gstLogin,
                gstPassword: data.gstPassword,
                tracesLogin: data.tracesLogin,
                tracesPassword: data.tracesPassword,
                pfLogin: data.pfLogin,
                pfPassword: data.pfPassword,
                esiLogin: data.esiLogin,
                esiPassword: data.esiPassword,
                ptLogin: data.ptLogin,
                ptPassword: data.ptPassword,
            }
        });

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
}
