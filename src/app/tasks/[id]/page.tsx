import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import TaskDetailClient from "./TaskDetailClient"

export const dynamic = "force-dynamic"

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
    const task = await prisma.task.findUnique({
        where: { id: params.id },
        include: {
            client: true,
            assignee: true,
            activities: true,
        }
    })

    if (!task) notFound()

    return <TaskDetailClient task={task} />
}
