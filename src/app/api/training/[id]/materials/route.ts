import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        const userRole = (session?.user as any)?.role

        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const body = await req.json()
        const { title, type, content, order } = body

        const newMaterial = await prisma.trainingMaterial.create({
            data: {
                moduleId: id,
                title,
                type,
                content,
                order: order || 0
            }
        })

        return NextResponse.json(newMaterial)
    } catch (error) {
        return NextResponse.json({ error: "Failed to create material" }, { status: 500 })
    }
}
