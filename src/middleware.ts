import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        // If there's no token, redirect to login
        const token = req.nextauth.token
        if (!token) {
            const loginUrl = new URL("/login", req.url)
            loginUrl.searchParams.set("callbackUrl", req.url)
            return NextResponse.redirect(loginUrl)
        }
        return NextResponse.next()
    },
    {
        callbacks: {
            // Only allow through if token exists
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
)

export const config = {
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon\\.ico|login).*)",
    ],
}
