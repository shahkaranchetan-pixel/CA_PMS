/**
 * Point 8: Error Monitoring
 *
 * To enable Sentry, run:
 *   npm install @sentry/nextjs
 *   npx @sentry/wizard@latest -i nextjs
 *
 * Then add to .env:
 *   NEXT_PUBLIC_SENTRY_DSN=https://xxxx@oXXX.ingest.sentry.io/XXXXX
 *
 * Until Sentry is configured, errors are logged to the console.
 * Replace captureException calls across the codebase with the Sentry SDK once set up.
 */

export function captureException(error: unknown, context?: Record<string, unknown>) {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        // When Sentry is installed, replace this with:
        // import * as Sentry from "@sentry/nextjs"
        // Sentry.captureException(error, { extra: context })
        console.error("[Sentry] captureException — install @sentry/nextjs to enable:", error, context)
    } else {
        console.error("[ERROR]", error, context)
    }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        // Sentry.captureMessage(message, level)
        console.warn(`[Sentry] ${level}: ${message}`)
    } else {
        console.log(`[${level.toUpperCase()}]`, message)
    }
}
