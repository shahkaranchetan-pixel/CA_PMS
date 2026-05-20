import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import TemplateManager from "./TemplateManager"

export const dynamic = "force-dynamic"

export default async function MailTemplatesPage() {
    const { user, error } = await requireAuth()
    if (error || !user) redirect("/login")
    if (user.role !== "ADMIN") redirect("/mail")

    const templates = await prisma.emailTemplate.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
    })

    return <TemplateManager initialTemplates={templates as any[]} />
}
