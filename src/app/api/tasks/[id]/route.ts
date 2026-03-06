import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH to update task status
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        const task = await prisma.task.update({
            where: { id },
            data: { status },
            include: {
                client: true
            }
        });

        // Trigger Email if marked COMPLETED
        if (status === "COMPLETED") {
            console.log(`[EMAIL SENDING MOCK] Task ${task.title} for ${task.client.name} is completed. Sending email to client...`);
            // Here you would integrate Resend, Sendgrid, or Nodemailer
            // e.g. await sendEmail({ to: client.email, subject: "Task Completed", body: ... })
        }

        return NextResponse.json(task);
    } catch (error: any) {
        console.error("Failed to update task:", error);
        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 }
        );
    }
}
