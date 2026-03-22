import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user || user.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 })

        const clients = await prisma.client.findMany({
            orderBy: { name: 'asc' }
        })

        // Generate CSV
        const headers = ["ID", "Name", "Entity Type", "Status", "GSTIN", "PAN", "TAN", "Contact", "Created At"]
        const rows = clients.map(c => [
            c.id,
            `"${c.name.replace(/"/g, '""')}"`,
            c.entityType,
            c.active ? "Active" : "Inactive",
            c.gstin || 'N/A',
            c.pan || 'N/A',
            c.tan || 'N/A',
            `"${c.contactEmail?.replace(/"/g, '""') || 'N/A'}"`,
            new Date(c.createdAt).toLocaleDateString()
        ])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename=clients-export-${new Date().toISOString().split('T')[0]}.csv`
            }
        })
    } catch (error) {
        console.error("[EXPORT_CLIENTS_ERROR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
