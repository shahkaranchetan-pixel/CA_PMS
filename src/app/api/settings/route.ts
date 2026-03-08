import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user || user.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 })

        const settings = await prisma.systemSetting.findMany()
        const config = settings.reduce((acc: any, s: any) => {
            acc[s.key] = s.value
            return acc
        }, {})

        return NextResponse.json(config)
    } catch (error) {
        console.error("[SETTINGS_GET_ERROR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const user = session?.user as any
        if (!user || user.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 })

        const body = await request.json()

        // Settings are passed as a key-value object
        for (const [key, value] of Object.entries(body)) {
            if (typeof value === 'string') {
                await prisma.systemSetting.upsert({
                    where: { key },
                    update: { value },
                    create: { key, value }
                })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[SETTINGS_POST_ERROR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
