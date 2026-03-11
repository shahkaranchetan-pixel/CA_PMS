import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const module = await prisma.trainingModule.findUnique({
            where: { id },
            include: {
                materials: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        if (!module) {
            return NextResponse.json({ error: "Module not found" }, { status: 404 })
        }

        return NextResponse.json(module)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch module" }, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        const userRole = (session?.user as any)?.role

        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const body = await req.json()
        const updatedModule = await prisma.trainingModule.update({
            where: { id },
            data: body
        })

        return NextResponse.json(updatedModule)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update module" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        const userRole = (session?.user as any)?.role

        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await prisma.trainingModule.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete module" }, { status: 500 })
    }
}
