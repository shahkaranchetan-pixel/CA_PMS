import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { resendTrackedEmail } from "@/lib/mailer"

export const dynamic = "force-dynamic"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { user, error } = await requireAuth()
        if (error) return error

        const { id } = await params
        const message = await resendTrackedEmail(id, user.id, user.role === "ADMIN")

        return NextResponse.json(message, { status: 201 })
    } catch (error: any) {
        console.error("[MAIL_RESEND_ERROR]", error)
        const status = error.message === "Email not found" ? 404 : 500
        return NextResponse.json({ error: error.message || "Failed to resend mail" }, { status })
    }
}
