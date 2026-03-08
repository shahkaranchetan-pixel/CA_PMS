import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import TaskDetailClient from "./TaskDetailClient"

export const dynamic = "force-dynamic"

export default async function TaskDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const task = await prisma.task.findUnique({
        where: { id: params.id },
        include: {
            client: true,
            assignee: true,
            activities: true,
            blockedBy: true,
            subtasks: {
                include: { assignee: true }
            },
            logs: {
                include: { user: { select: { name: true, image: true, email: true } } },
                orderBy: { createdAt: "desc" }
            }
        }
    })

    if (!task) notFound()

    return <TaskDetailClient task={task} />
}
