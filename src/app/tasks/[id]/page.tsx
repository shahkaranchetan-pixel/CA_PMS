import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import TaskDetailClient from "./TaskDetailClient"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic"

export default async function TaskDetailPage(props: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const params = await props.params;
    const task = await prisma.task.findUnique({
        where: { id: params.id },
        include: {
            client: true,
            taskAssignees: { include: { user: true } },
            activities: true,
            blockedBy: true,
            subtasks: {
                include: { taskAssignees: { include: { user: true } } }
            },
            logs: {
                include: { user: { select: { name: true, image: true, email: true } } },
                orderBy: { createdAt: "desc" }
            }
        }
    })

    if (!task) notFound()

    return <TaskDetailClient task={task} isAdmin={(session.user as any).role === 'ADMIN'} />
}
