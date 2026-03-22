import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error("[NOTIFICATIONS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const body = await request.json()
        const { notificationId } = body

        if (notificationId) {
            await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true }
            })
        } else {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId: user.id, isRead: false },
                data: { isRead: true }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[NOTIFICATIONS_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
