import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json()

        if (!token || !password) {
            return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
        }

        // Look up the token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        })

        if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "This reset link is invalid or has expired. Please request a new one." },
                { status: 400 }
            )
        }

        // Hash the new password
        const hashed = await bcrypt.hash(password, 12)

        // Update user password and mark token as used — in a transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { email: resetToken.email },
                data: { password: hashed },
            }),
            prisma.passwordResetToken.update({
                where: { token },
                data: { used: true },
            }),
        ])

        console.info(`[AUTH] Password reset successful for: ${resetToken.email}`)

        return NextResponse.json({ message: "Password updated successfully. You can now sign in." })
    } catch (error) {
        console.error("[RESET_PASSWORD_ERROR]", error)
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }
}
