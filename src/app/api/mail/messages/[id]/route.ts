import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { user, error } = await requireAuth()
        if (error) return error

        const { id } = await params
        const message = await prisma.emailMessage.findFirst({
            where: {
                id,
                ...(user.role === "ADMIN" ? {} : { senderId: user.id }),
            },
            include: {
                sender: { select: { id: true, name: true, email: true } },
                client: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } },
                recipients: { orderBy: { createdAt: "asc" } },
            },
        })

        if (!message) {
            return NextResponse.json({ error: "Mail not found" }, { status: 404 })
        }

        return NextResponse.json(message)
    } catch (error) {
        console.error("[MAIL_MESSAGE_GET_ERROR]", error)
        return NextResponse.json({ error: "Failed to fetch mail" }, { status: 500 })
    }
}
