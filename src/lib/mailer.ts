import nodemailer from "nodemailer"
import { prisma } from "./prisma"

// Cache SMTP settings for 5 minutes to avoid querying DB on every email
let smtpCache: { config: Record<string, string>; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getSmtpConfig(): Promise<Record<string, string>> {
    if (smtpCache && Date.now() < smtpCache.expiresAt) {
        return smtpCache.config;
    }

    const settings = await prisma.systemSetting.findMany();
    const config = settings.reduce((acc: Record<string, string>, s: any) => {
        acc[s.key] = s.value;
        return acc;
    }, {});

    smtpCache = { config, expiresAt: Date.now() + CACHE_TTL_MS };
    return config;
}

export function invalidateSmtpCache() {
    smtpCache = null;
}

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    try {
        const config = await getSmtpConfig();

        // If SMTP settings are fully configured, use real nodemailer
        if (config.SMTP_HOST && config.SMTP_PORT && config.SMTP_USER && config.SMTP_PASS && config.EMAIL_FROM) {
            const transporter = nodemailer.createTransport({
                host: config.SMTP_HOST,
                port: parseInt(config.SMTP_PORT, 10),
                secure: parseInt(config.SMTP_PORT, 10) === 465,
                auth: {
                    user: config.SMTP_USER,
                    pass: config.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: config.EMAIL_FROM,
                to,
                subject,
                html,
            });

            console.log(`[MAILER] Real email sent successfully to ${to}`);
            return true;
        } else {
            // Missing config, fallback to mock console output
            console.log(`\n\n=== ⚠️ [MOCK] EMAIL DISPATCHED (SMTP Not Configured) ===`);
            console.log(`TO:      ${to || "No Email Provided"}`);
            console.log(`SUBJECT: ${subject}`);
            console.log(`BODY:    \n${html.replace(/<[^>]*>?/gm, '')}`);
            console.log(`=========================================\n\n`);
            return true;
        }
    } catch (error) {
        console.error("[MAILER_ERROR]", error);
        return false;
    }
}
