import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

async function callClaudeAPI(prompt: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not found in environment");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }]
        })
    });

    if (!response.ok) {
        // Fallback to older sonnet
        const fallbackRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1000,
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            return data.content[0].text;
        }

        // Final Claude fallback to Haiku
        const haikuRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                max_tokens: 1000,
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (haikuRes.ok) {
            const data = await haikuRes.json();
            return data.content[0].text;
        }

        const error = await response.json();
        throw new Error(error?.error?.message || "Claude API call failed");
    }

    const data = await response.json();
    return data.content[0].text;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { taskId, channel, urgency } = body

        if (!taskId) {
            return NextResponse.json({ error: "taskId is required" }, { status: 400 })
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { client: true }
        })

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 })
        }

        const now = new Date();
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        let daysStatus = "";
        if (dueDate) {
            const diffTime = dueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                daysStatus = `${Math.abs(diffDays)} days overdue`;
            } else if (diffDays === 0) {
                daysStatus = "due today";
            } else {
                daysStatus = `due in ${diffDays} days`;
            }
        }

        const prompt = `
        You are a professional assistant for KCS Practice Management, an Indian CA firm.
        Draft a ${urgency || 'professional'} reminder message to be sent via ${channel || 'WhatsApp'}.
        
        CONTEXT:
        - Client Name: ${task.client.name}
        - Entity Type: ${task.client.entityType}
        - Task Title: ${task.title}
        - Task Type: ${task.taskType}
        - Period: ${task.period || 'N/A'}
        - Status: ${task.status}
        - Deadline Status: ${daysStatus}
        
        INSTRUCTIONS:
        - For WhatsApp: Keep it concise, use emojis appropriately, and include a clear call to action (sharing documents/data).
        - For Email: Use a professional subject line and formal tone.
        - Urgency (${urgency}): 
            - "gentle": Soft nudge, helpful tone.
            - "firm": Direct, highlighting the deadline and potential penalties for late filing (standard Indian compliance context).
        - Language: English (professional Indian context).
        - Do NOT include any placeholders like [Your Name]. Sign off as "KCS Team".
        - Return ONLY the drafted message text.
        `;

        const draft = await callClaudeAPI(prompt);

        return NextResponse.json({ draft });
    } catch (error: any) {
        console.error("[AI_REMINDER_ERROR]", error)
        return NextResponse.json({ error: error.message || "Failed to draft reminder" }, { status: 500 })
    }
}
