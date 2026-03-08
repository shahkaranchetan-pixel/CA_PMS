export const dynamic = "force-dynamic";
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });
                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    throw new Error("Invalid credentials");
                }
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
            }
        })
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }: { token: any, user: any }) {
            if (user) {
                token.role = user.role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user) {
                session.user.role = token.role
                session.user.id = token.id
            }
            return session
        }
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "SUPER_SECRET_FALLBACK",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
