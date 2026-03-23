import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { user, error } = await requireAuth("ADMIN");
        if (error) return error;

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
                gstCategory: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' }
        });

        const headers = ["Name", "Entity Type", "GST Category", "GSTIN", "PAN", "TAN", "Contact Person", "Email", "Phone", "Active", "Created"];
        const rows = clients.map(c => [
            `"${(c.name || '').replace(/"/g, '""')}"`,
            c.entityType,
            c.gstCategory,
            c.gstin || '',
            c.pan || '',
            c.tan || '',
            `"${(c.contactPerson || '').replace(/"/g, '""')}"`,
            c.contactEmail || '',
            c.contactPhone || '',
            c.active ? 'Yes' : 'No',
            c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename=clients-export-${new Date().toISOString().split('T')[0]}.csv`
            }
        });
    } catch (error) {
        console.error("[EXPORT_CLIENTS_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
