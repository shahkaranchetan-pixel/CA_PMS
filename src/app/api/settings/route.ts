import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma"
import { invalidateSmtpCache } from "@/lib/mailer"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { user, error } = await requireAuth("ADMIN");
        if (error) return error;

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
        const { user, error } = await requireAuth("ADMIN");
        if (error) return error;

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

        invalidateSmtpCache(); // Clear cached SMTP settings
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[SETTINGS_POST_ERROR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
