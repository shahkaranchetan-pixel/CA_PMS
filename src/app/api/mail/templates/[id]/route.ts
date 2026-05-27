import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export async function PUT(request: Request, { params }: any) {
    try {
        const { error } = await requireAuth("ADMIN")
        if (error) return error

        const { id } = await params
        const body = await request.json()
        const { name, category, subject, body: templateBody, isActive } = body

        const template = await prisma.emailTemplate.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(category !== undefined ? { category } : {}),
                ...(subject !== undefined ? { subject } : {}),
                ...(templateBody !== undefined ? { body: templateBody } : {}),
                ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
            },
        })

        return NextResponse.json(template)
    } catch (error) {
        console.error("[MAIL_TEMPLATE_PUT_ERROR]", error)
        return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
    }
}

export async function DELETE(_request: Request, { params }: any) {
    try {
        const { error } = await requireAuth("ADMIN")
        if (error) return error

        const { id } = await params
        await prisma.emailTemplate.update({
            where: { id },
            data: { isActive: false },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[MAIL_TEMPLATE_DELETE_ERROR]", error)
        return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
    }
}
