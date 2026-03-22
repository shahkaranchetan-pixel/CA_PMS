import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const { id: clientId } = await params
        const body = await request.json()
        const { action, portalName } = body

        if (!action || !portalName) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        // Verify client exists
        const client = await prisma.client.findUnique({ where: { id: clientId } })
        if (!client) return new NextResponse("Client not found", { status: 404 })

        const log = await prisma.vaultAuditLog.create({
            data: {
                clientId,
                userId: user.id,
                action,
                portalName
            }
        })

        return NextResponse.json(log)
    } catch (error) {
        console.error("[VAULT_AUDIT_LOG_ERROR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user || user.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 })

        const { id: clientId } = await params

        const logs = await prisma.vaultAuditLog.findMany({
            where: { clientId },
            include: {
                user: { select: { name: true, email: true, role: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(logs)
    } catch (error) {
        console.error("[VAULT_AUDIT_FETCH_ERROR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
