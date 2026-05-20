import nodemailer from "nodemailer"
import { prisma } from "./prisma"

type SmtpConfig = Record<string, string>

type MailRecipient = {
    email: string
    name?: string | null
    clientId?: string | null
}

type TrackedMailInput = {
    senderId?: string | null
    to: MailRecipient[]
    subject: string
    body: string
    category?: string
    clientId?: string | null
    taskId?: string | null
}

let smtpCache: { config: SmtpConfig; expiresAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

async function getSmtpConfig(): Promise<SmtpConfig> {
    if (smtpCache && Date.now() < smtpCache.expiresAt) {
        return smtpCache.config
    }

    const settings = await prisma.systemSetting.findMany()
    const config = settings.reduce((acc: SmtpConfig, s: { key: string; value: string }) => {
        acc[s.key] = s.value
        return acc
    }, {})

    smtpCache = { config, expiresAt: Date.now() + CACHE_TTL_MS }
    return config
}

export function invalidateSmtpCache() {
    smtpCache = null
}

function getMissingSmtpFields(config: SmtpConfig) {
    return ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"].filter(key => !config[key])
}

async function getTransporter() {
    const config = await getSmtpConfig()
    const missing = getMissingSmtpFields(config)
    if (missing.length > 0) {
        throw new Error(`SMTP settings missing: ${missing.join(", ")}`)
    }

    const port = parseInt(config.SMTP_PORT, 10)
    if (Number.isNaN(port)) {
        throw new Error("SMTP_PORT must be a valid number")
    }

    return {
        from: config.EMAIL_FROM,
        transporter: nodemailer.createTransport({
            host: config.SMTP_HOST,
            port,
            secure: port === 465,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS,
            },
        }),
    }
}

export function mergeTemplate(input: string, values: Record<string, string | null | undefined>) {
    return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => values[key] || "")
}

function normalizeBody(body: string) {
    if (/<[a-z][\s\S]*>/i.test(body)) return body
    return body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")
}

export function wrapEmailHtml(body: string) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #253047; line-height: 1.6;">
            <div style="border-bottom: 3px solid #E8A020; padding-bottom: 12px; margin-bottom: 20px;">
                <div style="font-size: 18px; font-weight: 700; color: #172033;">KCS TaskPro</div>
                <div style="font-size: 12px; color: #667085;">Practice Management Update</div>
            </div>
            <div style="font-size: 15px;">${normalizeBody(body)}</div>
            <div style="border-top: 1px solid #EAECF0; margin-top: 24px; padding-top: 14px; font-size: 12px; color: #667085;">
                This email was sent from KCS TaskPro.
            </div>
        </div>
    `
}

async function resolveSenderId(senderId?: string | null) {
    if (senderId) return senderId

    const fallback = await prisma.user.findFirst({
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: { id: true },
    })

    if (!fallback) {
        throw new Error("No user is available to own this email record")
    }

    return fallback.id
}

async function createTrackedMessage(input: TrackedMailInput) {
    const recipients = input.to
        .map(recipient => ({
            email: recipient.email?.trim(),
            name: recipient.name || null,
            clientId: recipient.clientId || input.clientId || null,
        }))
        .filter(recipient => recipient.email)

    if (recipients.length === 0) {
        throw new Error("At least one recipient email is required")
    }

    const senderId = await resolveSenderId(input.senderId)

    return prisma.emailMessage.create({
        data: {
            senderId,
            subject: input.subject,
            body: input.body,
            category: input.category || "GENERAL",
            status: "QUEUED",
            clientId: input.clientId || null,
            taskId: input.taskId || null,
            recipients: {
                create: recipients.map(recipient => ({
                    email: recipient.email,
                    name: recipient.name,
                    clientId: recipient.clientId,
                    status: "QUEUED",
                })),
            },
        },
        include: { recipients: true },
    })
}

export async function sendTrackedEmail(input: TrackedMailInput) {
    const message = await createTrackedMessage(input)

    try {
        const { transporter, from } = await getTransporter()
        const sentAt = new Date()
        const results = await Promise.allSettled(
            message.recipients.map(async recipient => {
                await transporter.sendMail({
                    from,
                    to: recipient.email,
                    subject: message.subject,
                    html: wrapEmailHtml(message.body),
                })

                await prisma.emailRecipient.update({
                    where: { id: recipient.id },
                    data: { status: "SENT", sentAt, error: null },
                })
            })
        )

        const failed = results
            .map((result, index) => ({ result, recipient: message.recipients[index] }))
            .filter(item => item.result.status === "rejected")

        await Promise.all(failed.map(item => {
            const reason = item.result.status === "rejected" ? String(item.result.reason?.message || item.result.reason) : "Failed"
            return prisma.emailRecipient.update({
                where: { id: item.recipient.id },
                data: { status: "FAILED", error: reason },
            })
        }))

        const status = failed.length > 0 ? "FAILED" : "SENT"
        const failureReason = failed.length > 0 ? `${failed.length} recipient(s) failed` : null

        return prisma.emailMessage.update({
            where: { id: message.id },
            data: { status, sentAt: status === "SENT" ? sentAt : null, failureReason },
            include: { recipients: true, sender: { select: { id: true, name: true, email: true } }, client: true, task: true },
        })
    } catch (error: any) {
        const reason = error?.message || "Failed to send email"
        await prisma.emailRecipient.updateMany({
            where: { messageId: message.id },
            data: { status: "FAILED", error: reason },
        })

        return prisma.emailMessage.update({
            where: { id: message.id },
            data: { status: "FAILED", failureReason: reason },
            include: { recipients: true, sender: { select: { id: true, name: true, email: true } }, client: true, task: true },
        })
    }
}

export async function resendTrackedEmail(messageId: string, senderId: string, isAdmin: boolean) {
    const existing = await prisma.emailMessage.findFirst({
        where: {
            id: messageId,
            ...(isAdmin ? {} : { senderId }),
        },
        include: { recipients: true },
    })

    if (!existing) {
        throw new Error("Email not found")
    }

    return sendTrackedEmail({
        senderId,
        subject: existing.subject,
        body: existing.body,
        category: existing.category,
        clientId: existing.clientId,
        taskId: existing.taskId,
        to: existing.recipients.map(recipient => ({
            email: recipient.email,
            name: recipient.name,
            clientId: recipient.clientId,
        })),
    })
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    try {
        if (!to) return false
        const { transporter, from } = await getTransporter()
        await transporter.sendMail({ from, to, subject, html })
        return true
    } catch (error) {
        console.error("[MAILER_ERROR]", error)
        return false
    }
}
