import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import MailOutboxClient from "./MailOutboxClient"

export const dynamic = "force-dynamic"

export default async function MailPage() {
    const { user, error } = await requireAuth()
    if (error || !user) redirect("/login")

    const messages = await prisma.emailMessage.findMany({
        where: user.role === "ADMIN" ? {} : { senderId: user.id },
        include: {
            sender: { select: { id: true, name: true, email: true } },
            client: { select: { id: true, name: true } },
            task: { select: { id: true, title: true } },
            recipients: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    })

    return <MailOutboxClient initialMessages={messages as any[]} isAdmin={user.role === "ADMIN"} />
}
