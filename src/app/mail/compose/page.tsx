import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import ComposeMailClient from "./ComposeMailClient"

export const dynamic = "force-dynamic"

export default async function ComposeMailPage() {
    const { error } = await requireAuth()
    if (error) redirect("/login")

    const [clients, templates] = await Promise.all([
        prisma.client.findMany({
            where: { deletedAt: null, active: true, contactEmail: { not: null } },
            select: { id: true, name: true, contactPerson: true, contactEmail: true },
            orderBy: { name: "asc" },
        }),
        prisma.emailTemplate.findMany({
            where: { isActive: true },
            orderBy: [{ category: "asc" }, { name: "asc" }],
        }),
    ])

    return <ComposeMailClient clients={clients as any[]} templates={templates as any[]} />
}
