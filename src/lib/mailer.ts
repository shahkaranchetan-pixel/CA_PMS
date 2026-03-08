import nodemailer from "nodemailer"
import { prisma } from "./prisma"

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    try {
        // Fetch all system settings and convert to a config object
        const settings = await prisma.systemSetting.findMany()
        const config = settings.reduce((acc: any, s: any) => {
            acc[s.key] = s.value
            return acc
        }, {})

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
