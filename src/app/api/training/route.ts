import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get('category')

        const where = category ? { category } : {}

        const modules = await prisma.trainingModule.findMany({
            where,
            orderBy: { order: 'asc' },
            include: {
                materials: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        return NextResponse.json(modules)
    } catch (error) {
        console.error("Training GET Error:", error)
        return NextResponse.json({ error: "Failed to fetch training modules" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const userRole = (session?.user as any)?.role

        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const body = await req.json()
        const { title, description, category, order } = body

        if (!title || !category) {
            return NextResponse.json({ error: "Title and Category are required" }, { status: 400 })
        }

        const newModule = await prisma.trainingModule.create({
            data: {
                title,
                description,
                category,
                order: order || 0
            }
        })

        return NextResponse.json(newModule)
    } catch (error) {
        console.error("Training POST Error:", error)
        return NextResponse.json({ error: "Failed to create training module" }, { status: 500 })
    }
}
