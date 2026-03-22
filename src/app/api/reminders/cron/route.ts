import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        // Simple security check: expect a CRON_SECRET or similar if triggering from external
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret');
        if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 1. Fetch SMTP settings
        const settingsRaw = await prisma.systemSetting.findMany();
        const settings: Record<string, string> = {};
        settingsRaw.forEach(s => settings[s.key] = s.value);

        if (!settings.SMTP_HOST || !settings.SMTP_USER || !settings.SMTP_PASS) {
            return NextResponse.json({ error: "SMTP credentials not configured" }, { status: 400 });
        }

        // 2. Identify tasks due in the next 3 days
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);

        const tasksToRemind = await prisma.task.findMany({
            where: {
                status: { in: ['PENDING', 'IN_PROGRESS'] },
                dueDate: {
                    lte: targetDate,
                    gte: new Date()
                },
                taskType: { in: ['GST_1', 'GSTR_3B', 'TDS_PAYMENT', 'PF_ESI_PT'] }
            },
            include: { client: true }
        });

        if (tasksToRemind.length === 0) {
            return NextResponse.json({ message: "No reminders to send today" });
        }

        // 3. Setup Transporter
        const transporter = nodemailer.createTransport({
            host: settings.SMTP_HOST,
            port: parseInt(settings.SMTP_PORT || '587'),
            secure: settings.SMTP_PORT === '465',
            auth: {
                user: settings.SMTP_USER,
                pass: settings.SMTP_PASS,
            },
        });

        const results: any[] = [];
        const mailPromises = tasksToRemind.map(async (task) => {
            if (!task.client?.contactEmail) return null; // Skip if no contact email

            const mailOptions = {
                from: settings.EMAIL_FROM || settings.SMTP_USER,
                to: task.client.contactEmail,
                subject: `📌 Compliance Reminder: ${task.title} is due soon`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #4FACFE;">KCS TaskPro Reminder</h2>
                        <p>Dear ${task.client.name},</p>
                        <p>This is a friendly reminder regarding your upcoming statutory compliance filing:</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>Task:</strong> ${task.title}<br>
                            <strong>Due Date:</strong> ${task.dueDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}<br>
                            <strong>Status:</strong> ${task.status}
                        </div>
                        <p>Please ensure all necessary documents are shared with our team to avoid last-minute delays.</p>
                        <p>Regards,<br><strong>KCS Team</strong></p>
                        <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
                        <p style="font-size: 11px; color: #999;">Automated notification from KCS TaskPro Practice Management Suite.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            results.push({ taskId: task.id, clientId: task.clientId, status: 'SENT' });
        });

        await Promise.allSettled(mailPromises);

        return NextResponse.json({ success: true, remindersSent: results.length, details: results });
    } catch (error: any) {
        console.error("Reminder Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
