import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { error } = await requireAuth()
        if (error) return error

        const templates = await prisma.emailTemplate.findMany({
            where: { isActive: true },
            orderBy: [{ category: "asc" }, { name: "asc" }],
        })

        return NextResponse.json(templates)
    } catch (error) {
        console.error("[MAIL_TEMPLATES_GET_ERROR]", error)
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { error } = await requireAuth("ADMIN")
        if (error) return error

        const body = await request.json()
        const { name, category, subject, body: templateBody } = body

        if (!name || !subject || !templateBody) {
            return NextResponse.json({ error: "Name, subject, and body are required" }, { status: 400 })
        }

        const template = await prisma.emailTemplate.create({
            data: {
                name,
                category: category || "GENERAL",
                subject,
                body: templateBody,
            },
        })

        return NextResponse.json(template, { status: 201 })
    } catch (error) {
        console.error("[MAIL_TEMPLATES_POST_ERROR]", error)
        return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
    }
}
