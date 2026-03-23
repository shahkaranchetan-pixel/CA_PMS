import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { user, error } = await requireAuth();
        if (error) return error;

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
        const { user, error } = await requireAuth();
        if (error) return error;

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
