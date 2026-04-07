import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import TaskDetailClient from "./TaskDetailClient"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";

export const revalidate = 10

export default async function TaskDetailPage(props: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const params = await props.params;
    const task = await prisma.task.findUnique({
        where: { id: params.id },
        include: {
            client: true,
            taskAssignees: { include: { user: { select: { id: true, name: true, email: true, color: true, image: true } } } },
            activities: true,
            blockedBy: { select: { id: true, title: true } },
            subtasks: {
                include: { taskAssignees: { include: { user: { select: { id: true, name: true, color: true } } } } }
            },
            logs: {
                include: { user: { select: { name: true, image: true, email: true } } },
                orderBy: { createdAt: "desc" },
                take: 50
            }
        }
    })

    if (!task) notFound()

    return <TaskDetailClient task={task} isAdmin={(session.user as any).role === 'ADMIN'} />
}
