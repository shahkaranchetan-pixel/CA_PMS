import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import GoogleProvider from "next-auth/providers/google"
import { checkRateLimit } from "@/lib/rate-limit"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            // NOTE: allowDangerousEmailAccountLinking removed — it allowed account
            // takeover if an attacker registered a Google account with an employee's email.
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    role: profile.role ?? "EMPLOYEE",
                }
            },
        }),
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

                // ── Point 2: Brute-force protection ─────────────────────
                // Rate-limit by email: max 5 attempts per 15 minutes
                const rl = checkRateLimit(`login:${credentials.email}`, 5, 15 * 60 * 1000);
                if (!rl.allowed) {
                    const waitMin = Math.ceil(rl.resetIn / 60000);
                    throw new Error(`Too many login attempts. Try again in ${waitMin} minute(s).`);
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });
                if (!user || !user.password) {
                    // ── Point 5: Login audit log ────────────────────────
                    console.warn(`[AUTH] Failed login — unknown email: ${credentials.email}`);
                    throw new Error("Invalid credentials");
                }
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    // ── Point 5: Login audit log ────────────────────────
                    console.warn(`[AUTH] Failed login — wrong password for: ${credentials.email}`);
                    throw new Error("Invalid credentials");
                }

                console.info(`[AUTH] Successful login: ${credentials.email} (${user.role})`);
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role as "ADMIN" | "EMPLOYEE"
                };
            }
        })
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                if (!user.email) return false;
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email }
                });
                if (!existingUser) {
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }: { token: any, user: any, trigger?: any, session?: any }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user) {
                session.user.role = token.role as any;
                session.user.id = token.id as any;
            }
            return session
        }
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
