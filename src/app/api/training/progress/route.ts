import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const userId = (session?.user as any)?.id

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const progress = await prisma.userTrainingProgress.findMany({
            where: { userId }
        })

        return NextResponse.json(progress)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const userId = (session?.user as any)?.id

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { moduleId, completed } = body

        if (!moduleId) {
            return NextResponse.json({ error: "Module ID is required" }, { status: 400 })
        }

        const progress = await prisma.userTrainingProgress.upsert({
            where: {
                userId_moduleId: {
                    userId,
                    moduleId
                }
            },
            update: {
                completed,
                lastViewed: new Date()
            },
            create: {
                userId,
                moduleId,
                completed,
                lastViewed: new Date()
            }
        })

        return NextResponse.json(progress)
    } catch (error) {
        console.error("Progress POST Error:", error)
        return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
    }
}
